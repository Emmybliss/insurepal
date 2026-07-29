# Commission Unification Refactor Plan

> Status: **Reviewed & Approved** — Ready for Phase 1 implementation

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current Architecture Diagram](#2-current-architecture-diagram)
3. [Proposed Architecture Diagram](#3-proposed-architecture-diagram)
4. [Dependency Analysis](#4-dependency-analysis)
5. [Obsolete Tables / Columns / Services](#5-obsolete-tables--columns--services)
6. [Controllers Affected](#6-controllers-affected)
7. [Reports Affected](#7-reports-affected)
8. [Dashboards Affected](#8-dashboards-affected)
9. [Migration Strategy (5 Phases)](#9-migration-strategy-5-phases)
   - [Phase 1: Foundation](#phase-1-foundation)
   - [Phase 2: Backfill](#phase-2-backfill)
   - [Phase 3: Instrument Creation Points](#phase-3-instrument-creation-points)
   - [Phase 4: Update Reporting](#phase-4-update-reporting)
   - [Phase 5: Cleanup](#phase-5-cleanup)
10. [Risk Assessment](#10-risk-assessment)
11. [Rollback Strategy](#11-rollback-strategy)
12. [Database Migrations](#12-database-migrations)
13. [Test Strategy](#13-test-strategy)
14. [Open Questions (Resolved)](#14-open-questions-resolved)
15. [Estimated Impact](#15-estimated-impact)
16. [NAICOM & Placement Analysis](#16-naicom--placement-analysis)
17. [Bugs Found During Analysis](#17-bugs-found-during-analysis)
18. [File Inventory](#18-file-inventory)

---

## 1. Problem Statement

Commission values are **duplicated** across three tables with no single source of truth:

| Table | Column | Written By |
|-------|--------|-----------|
| `policies` | `commission_amount` | `PolicyIssuanceService` |
| `placement_markets` | `commission_amount`, `co_broker_commission`, `reporting_broker_commission` | `BrokerSlipService` |
| `broker_slips` | `commission_amount`, `co_broker_commission`, `reporting_broker_commission` | `BrokerSlipService` |

**Consequences:**

- Reports read from different sources and produce inconsistent results
- `PlacementService::convertToPolicy` sets `commission_amount = 0` — bug
- NAICOM Form 72B/C fail to report commission for policies without a Placement workflow
- `CreditNoteService` / `DebitNoteService` create separate records but never adjust any commission total
- `CalculateCommission` job is a stub (logs only)
- `UpdateNaicomReport` job is a stub (logs only)

**Goal:**

Make **Policy** the primary aggregate root. Every Policy lifecycle event (creation, credit note, debit note, endorsement, cancellation, renewal) posts entries to a `commission_entries` ledger. The ledger is the single source of truth for all commission calculations and reporting, but it exists to *support* the Policy lifecycle — not to become the center of the architecture.

Existing commission columns on `policies`, `placement_markets`, and `broker_slips` remain for display and backward compatibility, but all calculations derive from the ledger.

---

## 2. Current Architecture Diagram

```
Commission Sources (DUPLICATED)
===============================

┌──────────────────────────────────────────────────────────────┐
│                    SOURCE 1: policies                        │
│  commission_amount (decimal) — stored at creation            │
│  ─────────────────────────────────────────────────────────  │
│  Written by: PolicyIssuanceService::recordPlacedPolicy()     │
│  Written by: PolicyIssuanceService::createDirectPolicy()     │
│  Written by: PolicyIssuanceService::convertQuoteToPolicy()   │
│  Read by:    ReportService (business/financial metrics)      │
│  Read by:    ReportsController (all report endpoints)        │
│  Read by:    DashboardController (broker dashboard)          │
│  Read by:    Product performance queries                     │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                    SOURCE 2: placement_markets               │
│  commission_amount / co_broker_commission /                  │
│  reporting_broker_commission                                 │
│  ─────────────────────────────────────────────────────────  │
│  Written by: BrokerSlipService::createSlip()                 │
│  Written by: BrokerSlipService::createDirectSlip()           │
│  Read by:    NaicomForm72BService::calculateCommissionData() │
│  Read by:    NaicomForm72CService::calculateCommissionDue()  │
│  Read by:    NaicomCommissionRecognitionService              │
│  Read by:    PlacementService::convertToPolicy() (sets to 0) │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                    SOURCE 3: broker_slips                    │
│  commission_amount / co_broker_commission /                  │
│  reporting_broker_commission                                 │
│  ─────────────────────────────────────────────────────────  │
│  Written by: BrokerSlipService::createSlip()                 │
│  Written by: BrokerSlipService::createDirectSlip()           │
│  Calculated: BrokerSlipCalculationService                    │
│  Read by:    FinancialNotePayloadMapper (PDF generation)     │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                    SOURCE 4: commission_rules                │
│  Percentage split config (insurer/broker/platform %)         │
│  ─────────────────────────────────────────────────────────  │
│  Used by:   CommissionRule::findForPolicy()                  │
│  Used by:   NOT actually consumed in any commission calc     │
│  Status:    Orphaned — never referenced in Calculation       │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                    SOURCE 5: CalculateCommission job (STUB)  │
│  ─────────────────────────────────────────────────────────  │
│  Listens to: PolicyIssued, PaymentReceived                   │
│  Action:     Logs only — NO actual calculation               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────▼───────────────────────────────────────────┐
│                    SOURCE 6: UpdateNaicomReport job (STUB)    │
│  ─────────────────────────────────────────────────────────  │
│  Listens to: PolicyIssued, Cancelled, Renewed,               │
│              PaymentReceived, DebitNoteGenerated,             │
│              CreditNoteGenerated                             │
│  Action:     Logs only — NO actual update                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Proposed Architecture Diagram

```
POLICY AS AGGREGATE ROOT
=========================

                    Policy
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  Commission      Credit Notes    Debit Notes
   Entries
  (Ledger)

Business services dispatch domain events → Event listeners post to ledger.

                    commission_entries
┌──────────────────────────────────────────────────────────────┐
│ id                    : bigInteger (PK)                       │
│ tenant_id             : foreignId → tenants                   │
│ policy_id             : foreignId → policies (cascade delete) │
│ transaction_type      : CommissionTransactionType (Enum)      │
│                       ├── Policy          (+150,000)          │
│                       ├── CreditNote      (-30,000)           │
│                       ├── DebitNote       (+10,000)           │
│                       ├── Endorsement     (±5,000)            │
│                       ├── Cancellation    (-135,000)          │
│                       ├── Reversal        (±varies)           │
│                       ├── ManualAdjustment (±varies)          │
│                       └── Renewal         (+new_amount)       │
│ reference_type        : string? (polymorphic)                 │
│                       ├── policy                              │
│                       ├── credit_note                         │
│                       ├── debit_note                          │
│                       └── policy_amendment                    │
│ reference_id          : bigInteger?                           │
│ amount                : decimal(15,2)                         │
│ posting_date          : date (business date — effective/issue)│
│ description           : text?                                 │
│ created_by            : foreignId? → users                    │
│ created_at            : timestamp (audit trail)               │
│ updated_at            : timestamp (audit trail)               │
└──────────────────────────────────────────────────────────────┘

INDEXES:
  - (policy_id, posting_date)
  - (tenant_id, posting_date)
  - (reference_type, reference_id)

                    commission_entry_audits
┌──────────────────────────────────────────────────────────────┐
│ id                    : bigInteger (PK)                       │
│ commission_entry_id   : foreignId → commission_entries        │
│ action                : string (created | updated | reversed) │
│ original_amount       : decimal(15,2)?                        │
│ new_amount            : decimal(15,2)?                        │
│ original_type         : string?                               │
│ new_type              : string?                               │
│ changed_by            : foreignId → users                     │
│ reason                : text                                  │
│ created_at            : timestamp                             │
└──────────────────────────────────────────────────────────────┘

                   Policy Helper Methods:
┌──────────────────────────────────────────────────────────────┐
│ $policy->grossCommission()     — SUM(POLICY + RENEWAL)        │
│ $policy->netCommission()       — SUM(all entries)             │
│ $policy->earnedCommission()    — SUM(entries up to today)     │
│ $policy->reversedCommission()  — SUM(REVERSAL entries)        │
│ $policy->commissionBalance()   — SUM(POLICY+RENEWAL+DN-CN-   │
│                                   CANCELLATION+ENDORSEMENT)   │
│ All delegate to CommissionQueryService internally.            │
└──────────────────────────────────────────────────────────────┘

                    EVENT-DRIVEN DATA FLOW:
┌──────────────────────────────────────────────────────────────┐
│ Business Services             Events                   Listeners       │
│ ───────────────              ──────                   ─────────       │
│ PolicyIssuanceService   ──►  PolicyCreated       ──►  PostPolicyEntry │
│ CreditNoteService       ──►  CreditNoteIssued    ──►  PostCreditNote  │
│ DebitNoteService        ──►  DebitNoteIssued     ──►  PostDebitNote   │
│ CancelPolicyService     ──►  PolicyCancelled     ──►  PostCancellation│
│ RenewPolicyService      ──►  PolicyRenewed       ──►  PostRenewal     │
│ PolicyAmendment         ──►  PolicyAmended       ──►  PostEndorsement │
│                                                                       │
│ Reports / Dashboards    ──►  Policy helper methods                    │
│                              ↓                                        │
│                          CommissionQueryService                       │
│                              ↓                                        │
│                          commission_entries (SUM)                     │
└──────────────────────────────────────────────────────────────┘

NO MORE:
  - policies.commission_amount used in calculations
  - placement_markets.*_commission used in calculations
  - broker_slips.*_commission used in calculations
  - Duplicated report logic
  - Synchronization jobs between tables

NEW BEHAVIOR:
  - Policy is the aggregate root; ledger supports the Policy lifecycle
  - Business services dispatch events; listeners write to ledger
  - Reports read via Policy helper methods → CommissionQueryService
  - Entries support updates where permitted by business rules
  - All updates recorded in commission_entry_audits (user, timestamp, previous value)
  - Reversal entries preferred for financial corrections
  - Updated_at retained for audit trail
```

---

## 4. Dependency Analysis

### Commission Read Dependencies (What reads from where)

| Component | Current Source | Problem | Priority |
|-----------|---------------|---------|----------|
| `ReportService::getBusinessMetrics` | `policies.commission_amount` | Ignores credit/debit note adjustments | 🔴 High |
| `ReportService::getFinancialMetrics` | `policies.commission_amount` | Ignores adjustments | 🔴 High |
| `ReportService::getProductPerformance` | `policies.commission_amount` | Same | 🟡 Medium |
| `ReportsController::businessOverview` | `policies.commission_amount` | Same | 🔴 High |
| `ReportsController::naicom` | `policies.commission_amount` | Same | 🔴 High |
| `ReportsController::generateNaicomData` | `policies.commission_amount` | Same | 🔴 High |
| `ReportsController::productPerformance` | `policies.commission_amount` | Same | 🟡 Medium |
| `DashboardController::brokerDashboard` | `policies.commission_amount` | Same | 🟡 Medium |
| `DashboardController::underwriterDashboard` | `policies.commission_amount` | Same | 🟡 Medium |
| `NaicomForm72BService::calculateCommissionData` | `placement_markets.co_broker_commission`, `reporting_broker_commission` | Fails if no placement exists | 🔴 High |
| `NaicomForm72CService::calculateCommissionDue` | `placement_markets.co_broker_commission`, `reporting_broker_commission` | Fails if no placement | 🔴 High |
| `NaicomForm72AService` | Form 72C rows (in-memory) | Indirect — fix 72C first | 🟡 Medium |
| `NaicomCommissionRecognitionService::calculateEarnedCommission` | `placement_markets.reporting_broker_commission` | Returns 0 if no placement+lead | 🔴 High |
| `FinancialNotePayloadMapper::mapBrokerSlip` | `broker_slips.*` | Display only — low priority | 🟢 Low |

### Commission Write Dependencies (What writes where — post-refactor)

| Component | Currently Writes To | New Behavior | Priority |
|-----------|-------------------|-------------|----------|
| `PolicyIssuanceService::recordPlacedPolicy` | `policies.commission_amount` | Dispatch `PolicyCreated` → listener posts POLICY entry | 🔴 High |
| `PolicyIssuanceService::createDirectPolicy` | `policies.commission_amount` | Dispatch `PolicyCreated` → listener posts POLICY entry | 🔴 High |
| `PolicyIssuanceService::convertQuoteToPolicy` | `policies.commission_amount` | Dispatch `PolicyCreated` → listener posts POLICY entry | 🔴 High |
| `PlacementService::convertToPolicy` | `policies.commission_amount = 0` 🔴 BUG | Fix zero bug + dispatch `PolicyCreated` | 🔴 High |
| `BrokerSlipService::createSlip` | `placement_markets.*`, `broker_slips.*` | Keep for reference; no changes | 🟢 Low |
| `BrokerSlipService::createDirectSlip` | `placement_markets.*`, `broker_slips.*` | Keep for reference; no changes | 🟢 Low |
| `BrokerSlipCalculationService` | `broker_slips.*` | Keep for slip PDF calculation | 🟢 Low |
| `CreditNoteService::issue` | `credit_notes` (only) | Dispatch `CreditNoteIssued` → listener posts CREDIT_NOTE entry | 🔴 High |
| `DebitNoteService::issue` | `debit_notes` (only) | Dispatch `DebitNoteIssued` → listener posts DEBIT_NOTE entry | 🔴 High |
| `CancelPolicyService::cancel` | `policies` (via `Policy::cancel()`) | Dispatch `PolicyCancelled` → listener posts CANCELLATION entry | 🔴 High |
| `RenewPolicyService::renew` | `policies.premium_amount` | Dispatch `PolicyRenewed` → listener posts RENEWAL entry | 🟡 Medium |
| `PolicyAmendment::activate` | `policies` (via `update()`) | Dispatch `PolicyAmended` → listener posts ENDORSEMENT entry | 🟡 Medium |

---

## 5. Obsolete Tables / Columns / Services

### Columns Marked Display-Only (Not Removed)

| Table | Column | Reason to Keep |
|-------|--------|----------------|
| `policies` | `commission_amount` | Existing queries, historical data, direct display |
| `placement_markets` | `commission_amount` | Broker slip PDFs, historical reference |
| `placement_markets` | `co_broker_commission` | NAICOM historical split data |
| `placement_markets` | `reporting_broker_commission` | NAICOM historical split data |
| `broker_slips` | `commission_amount` | Slip PDF generation |
| `broker_slips` | `co_broker_commission` | Slip PDF generation |
| `broker_slips` | `reporting_broker_commission` | Slip PDF generation |

### New Tables

| Table | Purpose |
|-------|---------|
| `commission_entries` | Single source of truth for all commission values |
| `commission_entry_audits` | Audit trail for all updates to commission entries |

### Existing Services: Remove or Replace

| Service | Action | Rationale |
|---------|--------|-----------|
| `CalculateCommission` (Jobs/) | Remove stub | Never implemented; replaced by event listeners |
| `UpdateNaicomReport` (Jobs/) | Remove stub | Never implemented; replaced by direct ledger reads |

### New Services

| Service | Purpose |
|---------|---------|
| `CommissionPostingService` | Write entries to the commission ledger + audit trail |
| `CommissionQueryService` | Read and aggregate entries for reports and dashboards |
| `InsuranceBackfillCommissionLedger` (Command) | Artisan command to migrate historical data |

### New Events

| Event | Dispatched By | Listener Action |
|-------|--------------|-----------------|
| `PolicyCreated` | `PolicyIssuanceService`, `PlacementService` | Post POLICY entry |
| `CreditNoteIssued` | `CreditNoteService` | Post CREDIT_NOTE entry |
| `DebitNoteIssued` | `DebitNoteService` | Post DEBIT_NOTE entry |
| `PolicyCancelled` | `CancelPolicyService` | Post CANCELLATION entry |
| `PolicyRenewed` | `RenewPolicyService` | Post RENEWAL entry |
| `PolicyAmended` | `PolicyAmendment` | Post ENDORSEMENT entry |

### New Enum

| Enum | Values |
|------|--------|
| `App\Enums\CommissionTransactionType` | `Policy`, `CreditNote`, `DebitNote`, `Endorsement`, `Cancellation`, `Reversal`, `ManualAdjustment`, `Renewal` |

---

## 6. Controllers Affected

| Controller | Method | Change Required | Phase |
|-----------|--------|-----------------|-------|
| `PolicyManagementController` | `storeRecordPlaced()` | Policy created → `PolicyCreated` dispatched (listener posts ledger) | Phase 3 |
| `PolicyManagementController` | `storeDirect()` | Same | Phase 3 |
| `PolicyManagementController` | `convertQuote()` | Same | Phase 3 |
| `PolicyManagementController` | `store()` | Same | Phase 3 |
| `CreditNoteController` | `store()` / `issue()` | CN issued → `CreditNoteIssued` dispatched | Phase 3 |
| `DebitNoteController` | `store()` / `issue()` | DN issued → `DebitNoteIssued` dispatched | Phase 3 |
| `PlacementController` | `convertToPolicy()` | Fix commission=0 bug + dispatch `PolicyCreated` | Phase 3 |
| `ReportsController` | All report methods | Replace `policies.commission_amount` with `$policy->netCommission()` | Phase 4 |
| `DashboardController` | `brokerDashboard()` | Use `$policy->netCommission()` / `CommissionQueryService` | Phase 4 |
| `DashboardController` | `underwriterDashboard()` | Same | Phase 4 |

---

## 7. Reports Affected

| Report | Current Source | New Source | Phase |
|--------|---------------|------------|-------|
| Business Overview | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| Financial Analytics | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| Product Performance | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| NAICOM (Controller) | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| NAICOM Form 72B | `placement_markets.*` | `CommissionQueryService` + `commission_splits` (if needed) | Phase 4 |
| NAICOM Form 72C | `placement_markets.*` | `CommissionQueryService` + `commission_splits` (if needed) | Phase 4 |
| NAICOM Commission Recognition | `placement_markets.reporting_broker_commission` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| Broker Dashboard | `policies.commission_amount` | `Policy::netCommission()` | Phase 4 |
| Compliance Dashboard | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| Business Trends | `policies.commission_amount` | `CommissionQueryService` → `commission_entries` SUM | Phase 4 |
| Top Customers | `policies.premium_amount` | No change (premium is not commission) | — |

---

## 8. Dashboards Affected

| Dashboard | Metric | Current | New | Phase |
|-----------|--------|---------|-----|-------|
| Broker | `commission_earned` | `Policy::sum('commission_amount')` | `Policy::netCommission()` via `CommissionQueryService` | Phase 4 |
| Underwriter | Premium trends | `policies.premium_amount` | No change | — |
| Customer | Premium | `policies.premium_amount` | No change | — |

---

## 9. Migration Strategy (5 Phases)

### Phase 1: Foundation

**Duration:** ~2 days

**Steps:**

1. Create `CommissionTransactionType` enum at `app/Enums/CommissionTransactionType.php`

2. Create migration for `commission_entries` table (with `posting_date`, `created_at`, `updated_at`)

3. Create migration for `commission_entry_audits` table

4. Create `CommissionEntry` model with:
   - `BelongsToTenant` trait
   - `policy()` belongsTo relationship
   - `createdBy()` belongsTo relationship
   - `reference()` morphTo relationship
   - `casts()` method for `transaction_type` (enum), `amount` (decimal)
   - Scopes: `byPolicy($id)`, `byTransactionType($type)`, `byDateRange($from, $to)`
   - Controlled update method that records audit trail

5. Create `CommissionEntryAudit` model (belongsTo `CommissionEntry`)

6. Create `CommissionPostingService` with:
   - `postEntry(Policy $policy, CommissionTransactionType $type, float $amount, ...$meta): CommissionEntry`
   - `updateEntry(CommissionEntry $entry, array $changes, User $by, string $reason): CommissionEntry`
   - `reverseEntry(CommissionEntry $entry, User $by, string $reason): CommissionEntry`
   - Private `recordAudit($entry, $action, $original, $new, $user, $reason)`

7. Create `CommissionQueryService` with:
   - `getNetCommission(Policy $policy): float` — returns `SUM(amount)`
   - `getGrossCommission(Policy $policy): float` — `SUM(POLICY + RENEWAL)`
   - `getCommissionBreakdown(Policy $policy): Collection`
   - `getEarnedCommission(Policy $policy, ?Carbon $asOf): float`
   - `getReversedCommission(Policy $policy): float`
   - `getCommissionBalance(Policy $policy): float`
   - `getCommissionByDateRange(Carbon $from, Carbon $to, ?int $tenantId): Collection`

8. Add helper methods to `Policy` model:
   ```php
   public function grossCommission(): float
   {
       return app(CommissionQueryService::class)->getGrossCommission($this);
   }

   public function netCommission(): float
   {
       return app(CommissionQueryService::class)->getNetCommission($this);
   }

   public function earnedCommission(?Carbon $asOf = null): float
   {
       return app(CommissionQueryService::class)->getEarnedCommission($this, $asOf);
   }

   public function reversedCommission(): float
   {
       return app(CommissionQueryService::class)->getReversedCommission($this);
   }

   public function commissionBalance(): float
   {
       return app(CommissionQueryService::class)->getCommissionBalance($this);
   }
   ```

9. Create 6 domain event classes + 6 listener classes:
   - `Events\PolicyCreated` → `Listeners\PostPolicyCommissionEntry`
   - `Events\CreditNoteIssued` → `Listeners\PostCreditNoteCommissionEntry`
   - `Events\DebitNoteIssued` → `Listeners\PostDebitNoteCommissionEntry`
   - `Events\PolicyCancelled` → `Listeners\PostCancellationCommissionEntry`
   - `Events\PolicyRenewed` → `Listeners\PostRenewalCommissionEntry`
   - `Events\PolicyAmended` → `Listeners\PostEndorsementCommissionEntry`

10. Register events + listeners in `EventServiceProvider` or `AppServiceProvider`

11. Write feature test for `CommissionPostingService`
12. Write feature test for `CommissionQueryService`
13. Write unit test for `CommissionEntry` model
14. Write unit test for `CommissionTransactionType` enum
15. Write unit test for Policy helper methods
16. Run `npm run lint && npm run types && php artisan test`

**Deliverables:**
- [ ] Enum: `app/Enums/CommissionTransactionType.php`
- [ ] Migration: `create_commission_entries_table.php`
- [ ] Migration: `create_commission_entry_audits_table.php`
- [ ] Model: `app/Models/CommissionEntry.php`
- [ ] Model: `app/Models/CommissionEntryAudit.php`
- [ ] Service: `app/Services/CommissionPostingService.php`
- [ ] Service: `app/Services/CommissionQueryService.php`
- [ ] Events: 6 event classes under `app/Events/`
- [ ] Listeners: 6 listener classes under `app/Listeners/`
- [ ] Policy helper methods on `app/Models/Policy.php`
- [ ] Tests: `tests/Feature/Services/CommissionPostingServiceTest.php`
- [ ] Tests: `tests/Feature/Services/CommissionQueryServiceTest.php`
- [ ] Tests: `tests/Unit/Models/CommissionEntryTest.php`
- [ ] Tests: `tests/Unit/Enums/CommissionTransactionTypeTest.php`

---

### Phase 2: Backfill

**Duration:** ~1-2 days

**Steps:**

1. Create `php artisan insurance:backfill-commission-ledger` command

2. Backfill logic (conservative — validate before creating entries):
   - **Policy entries**: Read `policies.commission_amount` → create POLICY entry for each policy.
     Validate: skip if `commission_amount` is null/zero and no credit/debit notes exist.
   - **Credit note entries**: Read `credit_notes.amount` (where status = issued/paid) → create CREDIT_NOTE entry.
     Validate: skip if `credit_note.policy_id` has no corresponding POLICY entry yet (log warning).
   - **Debit note entries**: Read `debit_notes.amount` (where status = issued/paid) → create DEBIT_NOTE entry.
     Validate: skip if `debit_note.policy_id` has no corresponding POLICY entry yet (log warning).
   - **Cancellation entries**: Read policies with `status = cancelled` → create CANCELLATION entry for the original commission amount.
     Validate: skip if policy has no POLICY entry yet (log warning).
   - **Amendment entries**: Read `policy_amendments` where `status = activated` and `premium_adjustment != 0`.
     **Do not automatically create ENDORSEMENT entries.** Instead, flag each amendment for manual review:
     ```php
     // Collect in a flagged report:
     $flagged = [
         'amendment_id' => $amendment->id,
         'policy_id' => $amendment->policy_id,
         'premium_adjustment' => $amendment->premium_adjustment,
         'reason' => 'Commission delta cannot be reliably determined from JSON amended_data',
         'suggested_action' => 'Create ENDORSEMENT entry manually after reviewing amendment context',
     ];
     ```

3. Validation step in command:
   - For each policy: `abs(SUM(ledger) - legacy_commission + credit_notes - debit_notes) < 0.01`
   - Report any mismatches to log/console
   - Generate a separate **flag report** for amendments needing manual review

4. Implement `--dry-run` flag: show what would be inserted without writing

5. Implement `--force` flag: skip confirmation prompt

6. Make command idempotent: skip if entry already exists for (policy_id, reference_type, reference_id)

7. Write feature test for backfill command

8. Run parity queries: compare old vs new totals for last 3 months; assert match before proceeding

**Deliverables:**
- [ ] Command: `app/Console/Commands/InsuranceBackfillCommissionLedger.php`
- [ ] Tests: `tests/Feature/Console/InsuranceBackfillCommissionLedgerTest.php`
- [ ] Validation report output (console)
- [ ] Manual review flag report (console + optional file export)

---

### Phase 3: Instrument Creation Points

**Duration:** ~2-3 days

**Steps:**

1. **PolicyIssuanceService::recordPlacedPolicy()**
   - After `$policy->save()`, dispatch `PolicyCreated` event
   - Event carries: `$policy`, `$commissionAmount`, `$createdBy`
   - Listener calls `CommissionPostingService::postEntry(POLICY, ...)`

2. **PolicyIssuanceService::createDirectPolicy()**
   - Same pattern after policy creation

3. **PolicyIssuanceService::convertQuoteToPolicy()**
   - Same pattern after conversion

4. **PlacementService::convertToPolicy()**
   - **Fix bug**: Replace `'commission_amount' => 0` with actual commission from placement
   - After conversion, dispatch `PolicyCreated`
   - Amount: from placement market's commission fields

5. **CreditNoteService::issue()**
   - After CN creation + approval, dispatch `CreditNoteIssued`
   - Listener calls `CommissionPostingService::postEntry(CREDIT_NOTE, -amount, ...)`
   - Amount: negative (reduces net commission)

6. **DebitNoteService::issue()**
   - After DN creation + approval, dispatch `DebitNoteIssued`
   - Listener calls `CommissionPostingService::postEntry(DEBIT_NOTE, +amount, ...)`
   - Amount: positive (increases net commission)

7. **CancelPolicyService::cancel()**
   - After `$policy->cancel()`, dispatch `PolicyCancelled`
   - Listener calls `CommissionPostingService::postEntry(CANCELLATION, -amount, ...)`
   - Amount: `-$policy->commissionBalance()` (reverses net commission)
   - _Fallback to `$policy->commission_amount` if no ledger entries yet_

8. **RenewPolicyService::renew()**
   - After renewal, dispatch `PolicyRenewed`
   - Listener calls `CommissionPostingService::postEntry(RENEWAL, +amount, ...)`
   - Amount: new commission amount (if different)

9. **PolicyAmendment::activate()**
   - If premium adjustment changes commission, dispatch `PolicyAmended`
   - Listener calls `CommissionPostingService::postEntry(ENDORSEMENT, ±delta, ...)`
   - Amount: calculated commission delta

**Event Payload Contracts:**

```php
// Example event structure
class PolicyCreated
{
    public function __construct(
        public Policy $policy,
        public float $commissionAmount,
        public ?User $createdBy,
    ) {}
}

class CreditNoteIssued
{
    public function __construct(
        public CreditNote $creditNote,
        public float $commissionDelta, // negative
        public ?User $createdBy,
    ) {}
}
// ...similar for all 6 events
```

**Deliverables (per service):**
- [ ] Modified service dispatching domain event (not calling ledger directly)
- [ ] Event class with typed payload
- [ ] Listener class handling commission posting
- [ ] Updated feature test verifying event is dispatched
- [ ] Updated feature test verifying listener creates ledger entry
- [ ] Regression test ensuring existing behavior is unchanged

---

### Phase 4: Update Reporting

**Duration:** ~2-3 days

**Steps:**

1. **ReportService::getBusinessMetrics()**
   - Replace `Policy::sum('commission_amount')` with `CommissionQueryService::getNetCommission()` grouped by policy
   - Delete any old raw-SQL commission queries

2. **ReportService::getFinancialMetrics()**
   - Same replacement pattern

3. **ReportService::getProductPerformance()**
   - Join products through policies, sum commission from `CommissionQueryService`

4. **ReportsController::businessOverview()**
   - Switch to `$policy->netCommission()` or `CommissionQueryService` aggregations

5. **ReportsController::naicom()**
   - Switch to ledger-backed aggregation

6. **ReportsController::generateNaicomData()**
   - Switch to ledger-backed aggregation

7. **NaicomForm72BService::calculateCommissionData()**
   - Read commission from `commission_entries` instead of `placement_markets`
   - Fall back to `placement_markets` for legacy periods (pre-migration)

8. **NaicomForm72CService::calculateCommissionDue()**
   - Read from ledger instead of `placement_markets`
   - Retain `remittance_allocations` for remitted amounts (no change needed there)

9. **NaicomCommissionRecognitionService::calculateEarnedCommission()**
   - Use `$policy->earnedCommission()` instead of `$policy->placement->markets()->lead()->reporting_broker_commission`

10. **DashboardController::brokerDashboard()**
    - Update `commission_earned` to use `Policy::netCommission()` / `CommissionQueryService`

**Deliverables:**
- [ ] Modified service files
- [ ] Parallel query validation: run old vs new in same SQL, assert match for last 3 months
- [ ] Updated tests for each report

---

### Phase 5: Cleanup

**Duration:** ~1 day

**Steps:**

1. Remove `CalculateCommission` job file
2. Remove `UpdateNaicomReport` job file
3. Remove any event listeners that only dispatch these stub jobs
4. Add `@deprecated` PHPDoc on `policies.commission_amount` column accessor:
   ```php
   /**
    * @deprecated Use $this->netCommission() instead. Kept for backward compatibility
    *             during the Commission Ledger migration. Will be removed in a future release.
    */
   ```
5. Add `@deprecated` PHPDoc on `placement_markets` commission fields:
   ```php
   /**
    * @deprecated Display-only. Commission values now live in commission_entries.
    */
   ```
6. Add `@deprecated` PHPDoc on `broker_slips` commission fields (same format)
7. Add database CHECK constraint on `commission_entries.amount != 0` (optional — only if business rules disallow zero)
8. Final validation: run full test suite + compare all report outputs

**Deliverables:**
- [ ] Deleted stub job files
- [ ] `@deprecated` annotations on all legacy commission columns
- [ ] Final validation report

---

## 10. Risk Assessment

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| R1 | Historical data inconsistency: ledger backfill doesn't match actuals | 🔴 High | Medium | Run validation queries before migration; fix discrepancies manually; implement `--dry-run` |
| R2 | Reports produce different numbers after switch to ledger | 🔴 High | Medium | Run parallel queries (old vs new) for last 3 months; assert match before switching |
| R3 | NAICOM Form 72B/C require per-insurer split data (co-broker vs reporting broker) | 🟡 Medium | High | Retain `reference_type`/`reference_id` on entries; add `commission_splits` table later if needed |
| R4 | BrokerSlip commission fields used in PDF generation | 🟢 Low | High | Keep as display-only; no impact on refactor |
| R5 | Performance impact of SUM aggregation vs direct column read | 🟢 Low | Low | Index on `(policy_id, posting_date)`; use materialized view if needed |
| R6 | Multi-tenant data leak | 🔴 High | Low | All queries scoped by `tenant_id` via `BelongsToTenant` trait (existing pattern) |
| R7 | Concurrent writes: race condition on ledger entries | 🟡 Medium | Low | Wrap in database transaction; use `lockForUpdate` if needed |
| R8 | Credit notes/debit notes already processed in reports — double counting after migration | 🔴 High | Medium | Backfill validation: verify `ledger_total = policy_commission - credit_notes + debit_notes` |
| R9 | PolicyAmendment JSON data may contain commission changes that are hard to backfill | 🟡 Medium | Medium | Flag for manual review; do not guess commission from historical JSON |
| R10 | Audit trail gaps for manual entry corrections during transition | 🟡 Medium | Low | `commission_entry_audits` table captures all changes; train admins on correct correction workflow |

### Risk Mitigation Matrix

```
Risk → R1    R2    R3    R4    R5    R6    R7    R8    R9    R10
──────────────────────────────────────────────────────────────────
P1   │  ✓    ✓     —     —     —     ✓     ✓     —     —     ✓
P2   │  ✓    ✓     —     —     —     —     —     ✓     ✓     —
P3   │  —    —     ✓     —     —     ✓     ✓     —     —     —
P4   │  —    ✓     ✓     ✓     ✓     ✓     —     —     —     —
P5   │  —    —     —     —     ✓     ✓     —     —     ✓     ✓

  ✓ = Mitigation applied in this phase
  — = Not addressed in this phase
  P1–P5 = Phase 1 through Phase 5
```

---

## 11. Rollback Strategy

### Option A: Full Rollback (within 48 hours of deployment)

1. Revert migration: `php artisan migrate:rollback --step=2` (drops `commission_entries` + `commission_entry_audits`)
2. Restore report queries to use `policies.commission_amount` directly
3. Revert event listeners and service changes via git: `git revert <merge-commit>`
4. Data loss: Only ledger data created within 48 hours is lost; all raw data preserved in original tables

### Option B: Partial Rollback (after 48 hours)

1. Keep `commission_entries` and `commission_entry_audits` tables (now have valuable data)
2. Point reports back to original tables via config flag:
   ```php
   // config/insurance.php
   'commission_source' => env('COMMISSION_SOURCE', 'ledger'), // or 'legacy'
   ```
3. Add feature flag check in `CommissionQueryService`:
   ```php
   if (config('insurance.commission_source') === 'legacy') {
       return Policy::sum('commission_amount');
   }
   return $this->commissionEntry->sum('amount');
   ```
4. Run reverse backfill if needed (write ledger totals back to `policies.commission_amount`)

### Data Integrity Validation (before rollback)

```sql
SELECT
  policy_id,
  SUM(amount) as ledger_total,
  (SELECT commission_amount FROM policies WHERE id = policy_id) as policy_commission
FROM commission_entries
GROUP BY policy_id
HAVING ABS(ledger_total - policy_commission) > 0.01
```

---

## 12. Database Migrations

### Migration 1: `create_commission_entries_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->string('transaction_type'); // CommissionTransactionType enum stored as string
            $table->string('reference_type')->nullable(); // policy, credit_note, debit_note, policy_amendment
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->date('posting_date'); // business date (effective date, issued date)
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps(); // created_at (audit) + updated_at (audit)

            $table->index(['policy_id', 'posting_date']);
            $table->index(['tenant_id', 'posting_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_entries');
    }
};
```

### Migration 2: `create_commission_entry_audits_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_entry_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commission_entry_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // created, updated, reversed
            $table->decimal('original_amount', 15, 2)->nullable();
            $table->decimal('new_amount', 15, 2)->nullable();
            $table->string('original_transaction_type')->nullable();
            $table->string('new_transaction_type')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason');
            $table->timestamps();

            $table->index('commission_entry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_entry_audits');
    }
};
```

---

## 13. Test Strategy

### Unit Tests

| Test Class | Tests |
|-----------|-------|
| `CommissionTransactionTypeTest` | `values_are_correct_strings()`, `is_valid_type()`, `labels_are_descriptive()` |
| `CommissionEntryTest` | `belongs_to_policy()`, `belongs_to_tenant()`, `amount_is_decimal()`, `scope_by_policy()`, `scope_by_type()`, `update_records_audit()` |
| `CommissionEntryAuditTest` | `belongs_to_entry()`, `stores_original_and_new_values()`, `stores_changed_by_and_reason()` |
| `PolicyCommissionHelpersTest` | `gross_commission_delegates_to_query_service()`, `net_commission_delegates_to_query_service()`, `earned_commission_delegates_to_query_service()`, `reversed_commission_delegates_to_query_service()`, `commission_balance_delegates_to_query_service()` |

### Feature Tests

| Test Class | Tests |
|-----------|-------|
| `CommissionPostingServiceTest` | `post_policy_entry()`, `post_credit_note_entry()`, `post_debit_note_entry()`, `post_cancellation_entry()`, `post_renewal_entry()`, `post_endorsement_entry()`, `update_entry_records_audit()`, `reverse_entry_creates_reversal_and_audit()`, `throws_on_invalid_type()`, `throws_on_null_policy()` |
| `CommissionQueryServiceTest` | `get_net_commission()`, `get_gross_commission()`, `get_commission_breakdown()`, `get_earned_commission_up_to_date()`, `get_reversed_commission()`, `get_commission_balance()`, `multi_entry_net_calculation()`, `returns_zero_for_empty_policy()` |
| `PolicyCommissionFlowTest` | `policy_creation_dispatches_event()`, `event_listener_creates_ledger_entry()`, `credit_note_dispatches_event()`, `credit_note_listener_creates_ledger_entry()`, `debit_note_listener_creates_ledger_entry()`, `cancellation_listener_creates_ledger_entry()`, `renewal_listener_creates_ledger_entry()`, `amendment_listener_creates_ledger_entry()`, `multiple_events_accumulate_correct_balance()` |
| `ReportCommissionConsistencyTest` | `business_overview_matches_ledger()`, `financial_metrics_match_legacy_after_backfill()`, `product_performance_matches_legacy()`, `parallel_query_validation()` |
| `BackfillCommandTest` | `backfill_creates_policy_entries()`, `backfill_creates_credit_note_entries()`, `backfill_creates_debit_note_entries()`, `backfill_is_idempotent()`, `backfill_dry_run_shows_no_writes()`, `backfill_flags_amendments_for_review()`, `backfill_reports_mismatches()` |
| `NaicomWithLedgerTest` | `form_72b_reads_from_ledger()`, `form_72c_commission_due_comes_from_ledger()`, `commission_recognition_reads_ledger()` |

### Run Commands

```bash
# All commission-related tests
php artisan test --compact --filter=Commission

# Individual test files
php artisan test --compact tests/Feature/Services/CommissionPostingServiceTest.php
php artisan test --compact tests/Feature/Services/CommissionQueryServiceTest.php
php artisan test --compact tests/Feature/Services/PolicyCommissionFlowTest.php
php artisan test --compact tests/Feature/Console/InsuranceBackfillCommissionLedgerTest.php

# Verification order (per AGENTS.md)
npm run lint && npm run types && php artisan test --compact --filter=Commission
```

---

## 14. Open Questions (Resolved)

These questions were raised during initial analysis. They are now resolved as per the architectural recommendations.

### Q1: Commission Splits Table

**Decision:** Start with `commission_entries` only. The `commission_splits` table will be added in Phase 4 if NAICOM Form 72B/C require per-recipient breakdown. The polymorphic `reference_type`/`reference_id` columns on `commission_entries` provide enough context to reconstruct splits if needed later.

### Q2: Deprecation Marking

**Decision:** Phase 5. All `@deprecated` annotations will be added during cleanup, after all readers have been switched to the ledger.

### Q3: CalculateCommission Job — Remove Dispatches

**Decision:** Option C. In Phase 3, replace the stub `CalculateCommission` dispatches with real event dispatches (`PolicyCreated`, etc). Remove the stub job file in Phase 5.

### Q4: Tenant Scoping

**Decision:** Option A. `CommissionEntry` uses `BelongsToTenant` trait with a direct `tenant_id` column. This is consistent with all other models in the app and avoids N+1 queries through the policy relationship.

### Q5: PolicyAmendment Commission Backfill

**Decision:** Option B/C combined. Flag all amendments with premium changes for manual review; do NOT attempt automated backfill of ENDORSEMENT entries from historical JSON data. A flag report is generated listing each amendment and recommending manual entry. Going forward, amendments will dispatch `PolicyAmended` events.

### Q6: PlacementService.convertToPolicy — Commission Source

**Decision:** Option A. Sum of `placement_markets.commission_amount` for all markets on the placement. The lead market's commission is the primary value; other market commissions are additional.

### Q7: Zero-Value Entries

**Decision:** Option B. Allow zero-amount entries for audit trail completeness (e.g., cancelled policy with 0 commission). The CHECK constraint is optional and left to Phase 5 if business rules require it.

### Q8: Posting Date Convention

**Decision:** Option C. Both dates are used:
- `posting_date` = business date (effective date for policies, issued date for notes, cancellation date for cancellations, effective date for endorsements)
- `created_at` = system timestamp for audit trail

### Q9: Net Commission vs Gross Commission

**Decision:** Option C. `CommissionQueryService` provides both methods:
- `getNetCommission()` = SUM of all entries
- `getGrossCommission()` = SUM of POLICY + RENEWAL entries only

Reports can choose the appropriate method.

### Q10: Event-Driven vs Direct Invocation

**Decision:** Option B (event-driven). Business services dispatch domain events. Event listeners handle commission posting. This decouples commission logic from business logic and makes it easy to add new sources later.

---

## 15. Estimated Impact

| Metric | Estimate |
|--------|----------|
| **New files** | ~20 (Migration ×2, Model ×2, Enum, Service ×2, Event ×6, Listener ×6, Test files ×5) |
| **Modified files** | ~20 (Controllers, Business Services, NAICOM forms, ReportService, DashboardController, Policy model) |
| **Deleted files** | 2 (stub jobs: `CalculateCommission`, `UpdateNaicomReport`) |
| **Engineer-days** | ~12–15 days |
| **New tests** | ~40–50 |
| **Database changes** | 2 new tables (`commission_entries`, `commission_entry_audits`) |
| **Risk of regression** | Medium (reports will differ until backfill completes; parallel validation mitigates) |
| **Break in existing APIs** | None (backward compatible; existing columns remain untouched) |
| **Data migration downtime** | ~5 minutes for backfill (depends on record volume) |
| **Frontend changes** | None (no UI changes required) |

---

## 16. NAICOM & Placement Analysis

### Summary of Findings

| Service | Reads Commission From | Impact of Refactor |
|---------|---------------------|-------------------|
| `NaicomForm72AService` | Form 72C rows (in-memory) | Indirect — fixed when 72C is fixed |
| `NaicomForm72BService` | `placement_markets.co_broker_commission`, `reporting_broker_commission` | 🔴 Currently returns 0 for policies without placement |
| `NaicomForm72CService` | `placement_markets.co_broker_commission`, `reporting_broker_commission` | 🔴 Currently returns 0 for policies without placement |
| `NaicomCommissionRecognitionService` | `placement_markets.reporting_broker_commission` | 🔴 Currently returns 0 for policies without placement+lead market |

### Current NAICOM Bug

Any policy created **without** a full Placement workflow (i.e., direct policies, converted quotes, recorded placed policies without a placement record) gets **zero commission** in all NAICOM reports.

**This is a real bug in production.** The commission ledger refactor will fix it because NAICOM services will read from `commission_entries` which always has data for every policy.

### Should Placement Be Removed?

**No.** Placement remains valid for:
- Multi-insurer scenarios (co-insurance, treaty)
- Broker slip workflow (slips reference placements)
- Regulatory records (some brokers need placement documents)
- PDF document generation

**But** NAICOM should be decoupled from Placement. After the refactor, NAICOM services read from the Commission Ledger, not from PlacementMarket.

### Data Retention Strategy for Placement Markets

| Column | Retain? | Reason |
|--------|---------|--------|
| `placement_markets.commission_amount` | ✅ Display-only | Historical reference, slip PDFs |
| `placement_markets.co_broker_commission` | ✅ Display-only | NAICOM historical split data |
| `placement_markets.reporting_broker_commission` | ✅ Display-only | NAICOM historical split data |
| `broker_slips.commission_amount` | ✅ Display-only | Slip PDF generation |
| `broker_slips.co_broker_commission` | ✅ Display-only | Slip PDF generation |
| `broker_slips.reporting_broker_commission` | ✅ Display-only | Slip PDF generation |

---

## 17. Bugs Found During Analysis

| # | Bug | File | Line | Severity | Fix |
|---|-----|------|------|----------|-----|
| B1 | `convertToPolicy()` sets `commission_amount = 0` | `app/Services/PlacementService.php` | 181 | 🔴 High | Read commission from placement_markets or passed data |
| B2 | NAICOM reports return 0 commission for non-placement policies | `NaicomCommissionRecognitionService.php` | 30-50 | 🔴 High | Read from ledger (Phase 4) |
| B3 | `CalculateCommission` job is a stub — never calculates | `app/Jobs/CalculateCommission.php` | — | 🟡 Medium | Replace with event listeners (Phase 3) |
| B4 | `UpdateNaicomReport` job is a stub — never updates | `app/Jobs/UpdateNaicomReport.php` | — | 🟡 Medium | Replace with direct ledger reads (Phase 4) |
| B5 | `CommissionRule` exists but is never used in any calculation | `app/Models/CommissionRule.php` | — | 🟢 Low | Evaluate if needed; consider deprecating |

### Bug B1 Details: `PlacementService::convertToPolicy()` sets commission to 0

```php
// File: app/Services/PlacementService.php, line ~181
$policy = Policy::create([
    // ... other fields ...
    'commission_amount' => 0, // 🔴 BUG: should be actual commission
]);
```

The placement has `placement_markets` with `commission_amount` set, but the conversion ignores them.

---

## 18. File Inventory

### Files to Create

| File | Phase |
|------|-------|
| `app/Enums/CommissionTransactionType.php` | P1 |
| `database/migrations/xxxx_create_commission_entries_table.php` | P1 |
| `database/migrations/xxxx_create_commission_entry_audits_table.php` | P1 |
| `app/Models/CommissionEntry.php` | P1 |
| `app/Models/CommissionEntryAudit.php` | P1 |
| `app/Services/CommissionPostingService.php` | P1 |
| `app/Services/CommissionQueryService.php` | P1 |
| `app/Events/PolicyCreated.php` | P1 |
| `app/Events/CreditNoteIssued.php` | P1 |
| `app/Events/DebitNoteIssued.php` | P1 |
| `app/Events/PolicyCancelled.php` | P1 |
| `app/Events/PolicyRenewed.php` | P1 |
| `app/Events/PolicyAmended.php` | P1 |
| `app/Listeners/PostPolicyCommissionEntry.php` | P1 |
| `app/Listeners/PostCreditNoteCommissionEntry.php` | P1 |
| `app/Listeners/PostDebitNoteCommissionEntry.php` | P1 |
| `app/Listeners/PostCancellationCommissionEntry.php` | P1 |
| `app/Listeners/PostRenewalCommissionEntry.php` | P1 |
| `app/Listeners/PostEndorsementCommissionEntry.php` | P1 |
| `tests/Feature/Services/CommissionPostingServiceTest.php` | P1 |
| `tests/Feature/Services/CommissionQueryServiceTest.php` | P1 |
| `tests/Unit/Models/CommissionEntryTest.php` | P1 |
| `tests/Unit/Enums/CommissionTransactionTypeTest.php` | P1 |
| `app/Console/Commands/InsuranceBackfillCommissionLedger.php` | P2 |
| `tests/Feature/Console/InsuranceBackfillCommissionLedgerTest.php` | P2 |

### Files to Modify

| File | Change | Phase |
|------|--------|-------|
| `app/Models/Policy.php` | Add `grossCommission()`, `netCommission()`, `earnedCommission()`, `reversedCommission()`, `commissionBalance()` helpers | P1 |
| `app/Providers/EventServiceProvider.php` | Register events + listeners | P1 |
| `app/Services/PolicyIssuanceService.php` | Dispatch `PolicyCreated` event after creation | P3 |
| `app/Services/PlacementService.php` | Fix commission=0 bug + dispatch `PolicyCreated` | P3 |
| `app/Services/CreditNoteService.php` | Dispatch `CreditNoteIssued` after issue | P3 |
| `app/Services/DebitNoteService.php` | Dispatch `DebitNoteIssued` after issue | P3 |
| `app/Services/Policies/CancelPolicyService.php` | Dispatch `PolicyCancelled` after cancel | P3 |
| `app/Services/Policies/RenewPolicyService.php` | Dispatch `PolicyRenewed` after renew | P3 |
| `app/Models/PolicyAmendment.php` | Dispatch `PolicyAmended` after activation | P3 |
| `app/Services/ReportService.php` | Switch all commission reads to `CommissionQueryService` | P4 |
| `app/Http/Controllers/ReportsController.php` | Use `Policy::netCommission()` / `CommissionQueryService` | P4 |
| `app/Http/Controllers/DashboardController.php` | Switch broker dashboard to `CommissionQueryService` | P4 |
| `app/Services/Naicom/NaicomForm72BService.php` | Read from ledger instead of placement_markets | P4 |
| `app/Services/Naicom/NaicomForm72CService.php` | Read from ledger instead of placement_markets | P4 |
| `app/Services/Naicom/NaicomCommissionRecognitionService.php` | Use `$policy->earnedCommission()` | P4 |
| `app/Services/Naicom/NaicomForm72AService.php` | No change needed (reads from 72C output) | — |

### Files to Delete

| File | Phase |
|------|-------|
| `app/Jobs/CalculateCommission.php` | P5 |
| `app/Jobs/UpdateNaicomReport.php` | P5 |

---

## Appendix: CommissionTransactionType Enum

```php
<?php

namespace App\Enums;

enum CommissionTransactionType: string
{
    case Policy = 'Policy';             // + Initial policy creation
    case CreditNote = 'CreditNote';     // - Credit note issued
    case DebitNote = 'DebitNote';       // + Debit note issued
    case Endorsement = 'Endorsement';   // ± Policy amendment
    case Cancellation = 'Cancellation'; // - Policy cancelled
    case Reversal = 'Reversal';         // ± Reversal of prior entry
    case ManualAdjustment = 'ManualAdjustment'; // ± Admin correction
    case Renewal = 'Renewal';           // + Policy renewed
}
```

| Type | Sign | When Used | Effect on Net Commission |
|------|------|-----------|-------------------------|
| `Policy` | + | Initial policy creation | Increases |
| `CreditNote` | - | Credit note issued against policy | Decreases |
| `DebitNote` | + | Debit note issued against policy | Increases |
| `Endorsement` | ± | Policy amendment with premium change | Adjusts |
| `Cancellation` | - | Policy cancelled | Reverses original commission |
| `Reversal` | ± | Reversal of any previous entry | Reverses that entry |
| `ManualAdjustment` | ± | Manual correction by admin | Adjusts |
| `Renewal` | + | Policy renewed | Increases (new commission) |

---

## Appendix: Example Queries

### Net Commission Per Policy

```sql
SELECT policy_id, SUM(amount) as net_commission
FROM commission_entries
WHERE tenant_id = ?
GROUP BY policy_id;
```

### Commission Breakdown for a Single Policy

```sql
SELECT transaction_type, SUM(amount) as total
FROM commission_entries
WHERE policy_id = ?
GROUP BY transaction_type;
```

### Monthly Commission Report

```sql
SELECT DATE_TRUNC('month', posting_date) as month,
       SUM(amount) as total_commission
FROM commission_entries
WHERE tenant_id = ?
  AND posting_date BETWEEN ? AND ?
GROUP BY DATE_TRUNC('month', posting_date)
ORDER BY month;
```

### Validation: Compare Ledger vs Legacy

```sql
SELECT
  p.id as policy_id,
  p.commission_amount as legacy_commission,
  COALESCE(SUM(ce.amount), 0) as ledger_commission,
  CASE
    WHEN ABS(COALESCE(SUM(ce.amount), 0) - p.commission_amount) > 0.01
    THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM policies p
LEFT JOIN commission_entries ce ON ce.policy_id = p.id
WHERE p.tenant_id = ?
GROUP BY p.id, p.commission_amount
HAVING status = 'MISMATCH';
```

### Audit Trail: Entry History

```sql
SELECT
  ce.id,
  cea.action,
  cea.original_amount,
  cea.new_amount,
  cea.reason,
  u.name as changed_by,
  cea.created_at
FROM commission_entry_audits cea
JOIN commission_entries ce ON ce.id = cea.commission_entry_id
JOIN users u ON u.id = cea.changed_by
WHERE ce.policy_id = ?
ORDER BY cea.created_at DESC;
```
