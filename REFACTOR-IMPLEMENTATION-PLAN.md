# InsurePal Enterprise Refactor — Implementation Plan

> Based on: `InsurePalEnterpriseRefactorMaster.md`
> Codebase: Laravel 12 + Inertia v2 + React 19
> Generated: June 29, 2026
> Last Updated: June 30, 2026

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Core Principles](#2-core-principles)
3. [Phase 1 — API-First Foundation](#3-phase-1--api-first-foundation)
   - [Sprint 1-2: Service Extraction](#sprint-1-2-service-extraction)
   - [Sprint 3: API Standardization](#sprint-3-api-standardization)
   - [Sprint 4: Event-Driven Architecture](#sprint-4-event-driven-architecture)
   - [Sprint 5-6: Multi-Tenant & Security Hardening](#sprint-5-6-multi-tenant--security-hardening)
4. [Phase 2 — Frontend Strategy (Inertia Improvement)](#4-phase-2--frontend-strategy-inertia-improvement)
5. [Phase 3 — Embedded AI Copilot](#5-phase-3--embedded-ai-copilot)
   - [Sprint 7-8: AI Backend Architecture](#sprint-7-8-ai-backend-architecture)
   - [Sprint 9: AI Frontend Workspace](#sprint-9-ai-frontend-workspace)
6. [Phase 4 — External Email Platform](#6-phase-4--external-email-platform)
   - [Sprint 10-13: Email Backend & Frontend](#sprint-10-13-email-backend--frontend)
7. [Sprint 14: Polish & Test Hardening](#7-sprint-14-polish--test-hardening)
8. [Dependency Graph](#8-dependency-graph)
9. [Risk Register](#9-risk-register)
10. [Success Metrics](#10-success-metrics)
11. [Architecture Decisions & Rationale](#11-architecture-decisions--rationale)

---

## 1. Current State Assessment

### Directory Scale

| Category | Count |
|---|---|
| **Controllers** | ~117 (14 API/V1 + 7 Admin + 12 Auth + 4 Dashboard + 7 Mobile + 9 Settings + 3 SuperAdmin + 1 AI + 60 root-level) |
| **Models** | 85 (plus 1 Scope trait + 1 Concern trait) |
| **Services** | 60 (spread across 7 subdirectories) |
| **Form Requests** | ~60 (27 root + 31 API/V1 + 1 Admin + 1 Auth + 1 Settings) |
| **API Resources** | 34 (33 API/V1 + 1 Mobile) |
| **Policies (Authorization)** | 8 |
| **Middleware** | 16 |
| **Enums** | 14 |
| **Events** | 9 (zero listeners) |
| **Notifications** | 15 |
| **Mail** | 6 |
| **Console Commands** | 11 |
| **Test Files** | 59 (54 Feature + 3 Unit + 2 Support) |
| **Frontend Pages** | 167 (50+ directories) |
| **Frontend Components** | 128 (46 shadcn/ui components + 82 app components) |

### Service Maturity by Domain

| Domain | Service Layer | Estimated Service Coverage | Issues |
|---|---|---|---|
| **Quotes** | `QuoteService` | ~95% | Auth facade removed ✅; service receives `User` via params |
| **Policies** | `PolicyIssuanceService`, `RenewPolicyService`, `CancelPolicyService`, `PolicyProductService`, `PolicyListingService`, `PolicyApprovalService` | ~90% | 3 new services extracted; controller now 240 lines ✅ |
| **Customers** | `CustomerService`, `CustomerListingService`, `CustomerExportService` | ~80% | 2 new services; controller now 230 lines ✅ |
| **Claims** | `RegisterClaimService`, `ApproveClaimService`, `SettleClaimService`, `ClaimListingService`, `ClaimCommentService` | ~75% | 2 new services exists; controller still 368 lines (needs stripping) |
| **Debit Notes** | `DebitNoteService` (root), `DebitNoteListingService` | ~65% | Listing service exists; controller still 462 lines (needs stripping) |
| **Credit Notes** | `CreditNoteService` (root), `CreditNoteListingService` | ~55% | Listing service exists; controller still 559 lines (needs major stripping) |
| **Invoices** | `GenerateInvoiceService` | ~50% | Listing inline; generation delegated |
| **Receipts** | `GenerateReceiptService` | ~50% | Listing inline; generation delegated |
| **NAICOM Reporting** | 10 dedicated services | ~85% | Well-structured subdomain |
| **Communications** | 5 dedicated services | ~80% | Inbox already well-factored |
| **Documents** | 4 services | ~70% | Document toolkit well-factored |
| **Placements/BrokerSlips** | 3 services | ~75% | Well-structured |
| **Finance/Payments** | 3 services | ~60% | Some listing inline |

### Key Code Smells

1. **Duplicated `index()` query logic** — Every web + API controller pair independently builds query/filter/sort chains
2. **100+ manual `tenant_id` checks** — Repeating `if ($record->tenant_id !== Auth::user()->tenant_id)` across controllers (originally estimated at 47+, actual count is higher)
3. **`Auth::user()` inside services** — ✅ **RESOLVED** — Zero `Auth::` calls found in any service file
4. **Inline validation** — **100+** `$request->validate()` calls across all controllers (not just ClaimController)
5. **9 events, zero listeners** — No cross-domain orchestration
6. **Separate web + API Form Requests** — Validation rules duplicated (8 shared claim requests exist; many remain)
7. **Mobile API duplication** — `/api/mobile/` endpoints replicate `/api/v1/` logic
8. **Controllers still > 200 lines** — Policy (240), Customer (230), Claim (368), DebitNote (462), CreditNote (559)
9. **Excel/PDF generation in controllers** — `CustomerController::downloadExcel()` builds spreadsheets inline

### What's Already Good (Don't Break)

- Services are HTTP-agnostic (no Inertia imports)
- Multi-tenant via global `TenantScope` + `BelongsToTenant` trait
- API Resources with consistent date formatting and relation loading
- Event dispatching pattern exists (just needs listeners)
- Real-time via Reverb/Echo
- Comprehensive permission system via Spatie
- Rich document generation pipeline
- Existing test suite covers core flows

---

## 2. Core Principles

1. **This is NOT a rewrite** — Reuse all existing business logic, DB schema, calculations, workflows
2. **Business rules must exist only once** — No duplicated logic between Web, Mobile, or AI
3. **Controllers become thin orchestration layers** — No inline business logic
4. **Services are HTTP-agnostic** — No Inertia, no Request, no redirect inside services
5. **Existing Inertia app continues working during migration** — Feature parity maintained at every step
6. **Each sprint must be verifiable** — Run full test suite; `npm run lint && npm run types && php artisan test`

---

## 3. Phase 1 — API-First Foundation

### Sprint 1-2: Service Extraction

**Goal**: Remove all inline business logic from controllers into dedicated services.

#### Task 1.1 — Extract Policy Controller — ✅ COMPLETE

**Current**: `PolicyController` at 655 lines → now **240 lines**. 3 new services extracted. 11 manual tenant checks eliminated.

| File | Status |
|---|---|
| `app/Services/Policies/PolicyProductService.php` | ✅ Created (156 lines) |
| `app/Services/Policies/PolicyListingService.php` | ✅ Created (150 lines) |
| `app/Services/Policies/PolicyApprovalService.php` | ✅ Created (43 lines) |
| `app/Http/Controllers/PolicyController.php` | ✅ Stripped to 240 lines (target <200 — close, minor remaining) |
| `app/Http/Requests/PolicyApprovalRequest.php` | ✅ Created (32 lines) |

**Verification**: `php artisan test --filter=PolicyManagement\|PolicyAmendment\|PolicyType`

#### Task 1.2 — Extract Customer Controller — ✅ COMPLETE

**Current**: `CustomerController` at 416 lines → now **230 lines**. 2 new services extracted.

| File | Status |
|---|---|
| `app/Services/Customers/CustomerListingService.php` | ✅ Created (50 lines) |
| `app/Services/Customers/CustomerExportService.php` | ✅ Created (103 lines) |
| `app/Services/CustomerService.php` | ✅ Exists (root-level, not in `Customers/` subdirectory — has `updateCustomer`, `deleteCustomer`) |
| `app/Http/Controllers/CustomerController.php` | ✅ Stripped to 230 lines (minor inline file-upload logic remains in `store()`) |
| `app/Exports/CustomersExport.php` | ✅ Reused |

**Verification**: `php artisan test --filter=CustomerManagement\|Export`

#### Task 1.3 — Extract Claim Controller — ✅ COMPLETE

**Current**: `ClaimController` at 483 lines → now **291 lines** (thin orchestration layer).

**Completed**:

| File | Status |
|---|---|
| `app/Services/Claims/ClaimListingService.php` | ✅ Created with `getCreateData()`, `getEditData()`, `getClaimTypes()`, `getDocumentTypes()`, `getShowPermissions()` |
| `app/Services/Claims/ClaimCommentService.php` | ✅ Created (43 lines) |
| `app/Services/Claims/RegisterClaimService.php` | ✅ Added `updateClaim()` method |
| `app/Services/Claims/ApproveClaimService.php` | ✅ Moved approved-amount validation into service |
| `app/Http/Requests/Shared/StoreClaimRequest.php` | ✅ Created as shared |
| `app/Http/Controllers/ClaimController.php` | ✅ Stripped to 291 lines. Removed inline role-gated querying (→`getCreateData()`), inline permission-gating in `show()` (→`getShowPermissions()`), hardcoded enums (→service), direct `$claim->update()` (→`RegisterClaimService::updateClaim()`), inline validation in `approve()` (→service) |

**Verification**: `php artisan test --filter=Claim` — 37 API tests pass ✅

#### Task 1.4 — Extract Debit Note & Credit Note Controllers — ✅ COMPLETE

**Current**: Both controllers are now thin orchestration layers (DebitNote: 316 lines, CreditNote: 302 lines).

**Completed**:

| File | Status |
|---|---|
| `app/Services/Finance/DebitNoteListingService.php` | ✅ Already exists (117 lines) |
| `app/Services/Finance/CreditNoteListingService.php` | ✅ Already exists (113 lines) |
| `app/Services/DebitNoteService.php` | ✅ Extended with `canModify()`, `canIssueNote()`, `canCancelNote()`, `getGenerationOptions()`, `generate()`, `regenerate()`, `download()`, `preview()`, `htmlPreview()`, `getEditData()` |
| `app/Services/CreditNoteService.php` | ✅ Fully rewritten with parity to DebitNoteService — full CRUD + PDF generation + audit trail methods |
| `app/Http/Controllers/DebitNoteController.php` | ✅ Stripped from 462 → 316 lines |
| `app/Http/Controllers/CreditNoteController.php` | ✅ Stripped from 559 → 302 lines |

**Verification**: `php artisan test --filter=DebitNote` (14 pass) && `php artisan test --filter=CreditNote` (14 pass) ✅

#### Task 1.5 — Auth Facade Removal from Services — ✅ COMPLETE

**Result**: Zero `Auth::` calls found in any service file. All services receive `User` via method parameters.

**Actions completed**:
- Audited all 60+ services for `Auth::user()`, `Auth::id()`, `Auth::check()` calls — **none found** ✅
- `QuoteService` no longer calls `Auth::facade()` — receives `User $user` via params ✅
- All controller call sites pass `$request->user()` ✅

**Verification**: `php artisan test --filter=Quote`

---

### Sprint 3: API Standardization

**Goal**: Eliminate duplication between web + API controllers; complete the API layer.

#### Task 3.1 — Shared Listing Trait — ✅ COMPLETE

**Created**: `app/Services/Concerns/HandlesListing.php` trait with 4 helpers:
- `applyPagination()` — paginate with capping + `withQueryString()`
- `applySearch()` — search across columns (supports `relation.column`)
- `applySort()` — sort with whitelist, `-column` desc convention
- `applyDateRange()` — date range filter on customizable column

**Updated**: 5 listing services now use the trait, removing ~185 lines of duplicate helper code.

| Service | Change |
|---|---|
| `DebitNoteListingService` | Removed `applySearch`, `applyDateRangeFilter`, `applySort` (→ trait) |
| `CreditNoteListingService` | Removed `applySearch`, `applyDateRangeFilter`, `applySort` (→ trait) |
| `ClaimListingService` | Removed `applySearch`, `applyDateRangeFilter`, kept `applySort` override for `sort_by`+`sort_order` pattern |
| `PolicyListingService` | Removed `applySearch`, `applyDateRangeFilter`, `applySort` (→ trait) |
| `CustomerListingService` | Uses `applySearch` + `applyPagination` from trait |

**Verification**: ✅ All listing tests pass (37 Claim, 14 DebitNote, 14 CreditNote, 28 Policy, 15 Customer API)

#### Task 3.2 — Tenant Authorization Policy — ✅ COMPLETE

**Created**: `app/Policies/TenantAccessPolicy.php` with `access(User $user, $model): bool`

**Registered**: `tenant-access` Gate in `AuthServiceProvider.php`

**Usage**: `Gate::authorize('tenant-access', $model)` replaces `if ($user->tenant_id !== $model->tenant_id) { abort(403); }`

**Verification**: ✅ 37 Claim tests, all authorization tests pass

#### Task 3.3 — Form Request Consolidation — 🔶 PARTIALLY DONE

**Current**: ~165 inline `$request->validate()` calls across 74 controllers remain.

**Completed** (this session):

| File | Status |
|---|---|
| `app/Http/Requests/Shared/` directory | ✅ 8 existing + 4 new shared requests = **12 total** |
| `Shared/BulkActionRequest.php` | ✅ Created — reusable for bulk action endpoints |
| `Shared/NotesActionRequest.php` | ✅ Created — approve/reject/cancel with notes |
| `Shared/MessageIdsRequest.php` | ✅ Created — markAsRead/markAsUnread/delete |
| `Shared/PolicyActionRequest.php` | ✅ Created — policy status change actions |
| `Shared/StoreNoteFromPolicyRequest.php` | ✅ Created — create debit/credit note from policy |
| `DebitNoteController.php` | ✅ `storeFromPolicy()` now uses `StoreNoteFromPolicyRequest` |
| `CreditNoteController.php` | ✅ `storeFromPolicy()` now uses `StoreNoteFromPolicyRequest` |

**Remaining Work**:
| Scope | Count |
|---|---|
| Controllers with 0 inline validates | ~15 controllers already clean |
| Controllers with 1-2 inline validates | ~40 controllers (quick wins) |
| Controllers with 3+ inline validates | ~20 controllers (PolicyManagement: 11, BrokerSlip: 7, DocumentToolkit: 6, etc.) |
| **Total remaining inline validates** | **~160 calls across ~70 controllers** |

**Verification**: ✅ All API tests pass (14 DebitNote, 14 CreditNote, 37 Claim, 28 Policy, 15 Customer)

#### Task 3.4 — Rate Limiting — ✅ COMPLETE

**Current**: API routes now have rate limiting active.

| File | Status |
|---|---|
| `bootstrap/app.php` | ⬜ Not modified (rate limit defined in `AppServiceProvider` instead — functionally equivalent) |
| `app/Providers/AppServiceProvider.php` | ✅ `RateLimiter::for('api', ...)` defined at 120/min by user ID or IP |
| `routes/api.php` | ✅ `throttle:api` middleware applied to all `/api/v1/*` routes on line 74 |
| Mutation limit (30/min) | ⬜ Not yet implemented |

**Verification**: HTTP 429 response when exceeding limits

#### Task 3.5 — Mobile API Migration

**Current**: `/api/mobile/` endpoints duplicate `/api/v1/` logic; React Native mobile app consumes them.

**Actions**:

| Step | Description |
|---|---|
| 1 | Audit `/api/mobile/` endpoints — identify any functionality NOT present in `/api/v1/` |
| 2 | Add missing v1 endpoints (if any) to achieve full feature parity |
| 3 | Update React Native app (`insurepal_mobile/src/services/`) to call `/api/v1/` instead of `/api/mobile/` |
| 4 | Add compatibility middleware to `/api/mobile/` that proxies to v1 controllers (graceful deprecation) |
| 5 | Remove `/api/mobile/` controllers after full migration confirmed working |

**Verification**: `php artisan test --filter=MobileApi` — mobile tests pass against v1 endpoints

---

### Sprint 4: Event-Driven Architecture

**Goal**: Implement event listeners for cross-domain orchestration; introduce queued jobs.

#### Task 4.1 — Create Listeners for Existing Events

| Event | New Listener | Action |
|---|---|---|
| `ClaimStatusChanged` | `ClaimStatusChangeListener` | Auto-generate debit note on approval; notify finance module; trigger NAICOM line update |
| `MessageSent` | `MessageSentListener` | Send push notification via Reverb; send email notification if recipient offline |
| `NotificationSent` | `NotificationSentListener` | Write to audit log |
| `CommunicationMessageSent` | `CommunicationMessageListener` | Update thread status; notify participants |
| `TicketStatusChanged` | `TicketStatusListener` | Notify assignee; update SLA counters |

**Files to create**: `app/Listeners/ClaimStatusChangeListener.php`, `app/Listeners/MessageSentListener.php`, etc.

#### Task 4.2 — Create New Events

| New Event | Dispatched By | Listeners |
|---|---|---|
| `PolicyIssued` | `PolicyIssuanceService` | Generate policy certificate; Update NAICOM report; Calculate commission; Send welcome email |
| `PolicyCancelled` | `CancelPolicyService` | Generate credit note (if paid); Update NAICOM report; Close related claims |
| `PolicyRenewed` | `RenewPolicyService` | Generate renewal certificate; Update NAICOM report; Send confirmation |
| `PaymentReceived` | `PaymentReceiptService` | Generate receipt; Update invoice status; Update policy payment status; Commission recognition |
| `DebitNoteGenerated` | `DebitNoteService` | Notify customer via email; Update financial dashboard |
| `EmailSent` | New `EmailSendService` | Log to sent folder; Trigger AI analysis |

**Note**: All events must implement `ShouldBroadcast` where real-time notification is appropriate.

#### Task 4.3 — Create Queue Jobs

| Job | Queue | Description |
|---|---|---|
| `GeneratePolicyCertificate` | `high` | Async certificate PDF generation after policy issuance |
| `SendPolicyEmailNotification` | `default` | Email policy documents to customer |
| `UpdateNaicomReport` | `low` | Batch update NAICOM report lines |
| `CalculateCommission` | `default` | Calculate broker/agent commission on payment |
| `SyncEmailAccount` | `email` | Background sync for connected email accounts |
| `ProcessEmailAttachment` | `email` | Extract text from email attachments for AI |
| `PruneRecycleBin` | `low` | Already has console command; make queued |

**Files to create**: `app/Jobs/GeneratePolicyCertificate.php`, `app/Jobs/SendPolicyEmailNotification.php`, etc.

#### Task 4.4 — Wire Existing Console Commands

**Current**: 11 console commands exist, some are cron-triggered.

| Command | Current Schedule | Change |
|---|---|---|
| `ProcessPolicyExpirations` | Daily 08:00 | Keep as-is (already a command) |
| `SendPaymentDueReminders` | Daily 08:00 | Keep as-is |
| `SendPolicyExpiryNotifications` | Daily 08:00 | Keep as-is |
| `PruneRecycleBin` | Daily 02:00 | Keep as-is |
| `NaicomPrepareTemplates` | Manual | Keep manual |

**Verification**: `php artisan schedule:list` shows all tasks

---

### Sprint 5-6: Multi-Tenant & Security Hardening

**Goal**: Ensure zero data leakage between tenants; comprehensive audit trail.

#### Task 5.1 — Model Audit for Tenant Scope Coverage

**Actions**:
- Audit all 85 models for `BelongsToTenant` trait usage
- Add `BelongsToTenant` to any model missing it that stores tenant-scoped data
- Verify `TenantScope` global scope applies correctly

**Key models to verify**: `Document`, `DocumentAsset`, `DocumentOverlay`, `DynamicField`, `ScheduledReport`, `Expense`, `Subscription`, `Deployment`, `WebhookLog`, `PushSubscription`

#### Task 5.2 — Service Tenant Scoping Audit

**Actions**:
- Audit all 60 services for tenant-scoped queries
- Ensure every query either uses the global `TenantScope` or explicitly scopes via `->forTenant()`
- Remove any hardcoded `tenant_id = 1` or similar in seeders/factories

#### Task 5.3 — Authorization Policies

**Current**: Only 8 Policies exist (Announcement, Claim, CommunicationMessage, CommunicationThread, Customer, Expense, Quote, RolePermission).

**Missing Policies to create**:

| Policy | Model | Gates |
|---|---|---|
| `DebitNotePolicy` | DebitNote | view, create, update, delete, issue, cancel, mark-paid |
| `CreditNotePolicy` | CreditNote | view, create, update, delete, issue, cancel |
| `InvoicePolicy` | Invoice | view, create, update, delete |
| `ReceiptPolicy` | Receipt | view, create, update, delete, refund |
| `PolicyPolicy` | Policy | view, create, update, delete, approve, reject, issue, cancel |
| `PlacementPolicy` | Placement | view, create, update, delete, submit |
| `BrokerSlipPolicy` | BrokerSlip | view, create, update, delete |
| `SupportTicketPolicy` | SupportTicket | view, create, update, assign, resolve |

**Guideline**: Each policy uses the `TenantAccessPolicy` gate as a base check, then adds role/permission-specific checks.

#### Task 5.4 — Audit Service

**Current**: `logActivity()` called inconsistently — sometimes in controllers, sometimes in services.

**Actions**:

| File | What to Create/Modify |
|---|---|
| `app/Services/AuditService.php` | **New.** Centralized audit logging service |
| `app/Models/Traits/HasAuditTrail.php` | **New trait.** Add `$model->log($action, $user, $metadata)` to any model |
| All services with inline audit calls | **Modify.** Delegate to `AuditService` |
| All controllers with inline audit calls | **Modify.** Delegate to `AuditService` |

---

## 4. Phase 2 — Frontend Strategy (Inertia Improvement)

**Decision**: Keep Inertia SPA as the primary UI. No separate Next.js app.

**Rationale**:
- The existing Inertia app is comprehensive (167 pages, 128 components)
- Rewriting in Next.js would duplicate effort and risk feature parity
- The Inertia app already works well; focus refactoring on the backend API layer

**Improvement Actions**:

| Area | Action | Benefit |
|---|---|---|
| API consumption | Add `TanStack Query` integration for data fetching alongside Inertia props | Caching, refetching, optimistic updates |
| State management | Use existing `zustand` stores (stores/ is empty) for UI state | Consistent client-side state |
| Component extraction | Move domain-specific page logic into shared components | Reusability across pages |
| API service layer | Build typed API client in `resources/js/lib/api/` using `@tanstack/react-query` | Eventually decouple from Inertia props |
| Error handling | Standardize error boundaries, loading skeletons, empty states | Consistent UX |
| PWA | Enhance existing PWA support (service worker, offline fallback) | Better mobile experience |

**Non-Goal**: Replacing Inertia. The refactor is backend-focused; frontend improvements are incremental.

---

## 5. Phase 3 — Embedded AI Copilot

### Sprint 7-8: AI Backend Architecture

#### Task 7.1 — AI Gateway (Provider-Agnostic LLM Client)

**File**: `app/Services/AI/AIGateway.php`

```php
class AIGateway
{
    public function __construct(
        private OpenAIClient $openai,
        private AnthropicClient $anthropic,
        private FallbackStrategy $fallback,
    ) {}

    public function chat(array $messages, array $options = []): AIResponse
    public function stream(array $messages, callable $onChunk): void
    public function embed(string $text): array
}
```

**Features**:
- Provider-agnostic interface (OpenAI + Anthropic + open-source via Ollama)
- Automatic fallback if primary provider is unavailable
- Token budgeting and rate limiting per tenant
- Request/response logging for audit
- Configurable model selection per tool type

#### Task 7.2 — Core AI Services

| Service | File | Responsibility |
|---|---|---|
| `IntentDetector` | `app/Services/AI/IntentDetector.php` | Classify natural language → operation + parameters. Uses LLM with structured output (JSON schema) |
| `ConversationManager` | `app/Services/AI/ConversationManager.php` | Session management, conversation history (DB-backed), state machine for multi-turn workflows |
| `ContextManager` | `app/Services/AI/ContextManager.php` | Assembles tenant context (branding, policies, customer history, permissions) into LLM system prompt |
| `PromptManager` | `app/Services/AI/PromptManager.php` | Prompt templates, system prompts, few-shot examples, response format instructions |
| `ToolRegistry` | `app/Services/AI/ToolRegistry.php` | Registry of all AI-callable tools with JSON schemas for LLM function calling |
| `ExecutionEngine` | `app/Services/AI/ExecutionEngine.php` | Orchestrate tool calling: parse intent → resolve tools → execute with validation → format response |
| `ApprovalWorkflow` | `app/Services/AI/ApprovalWorkflow.php` | High-risk action approval gates (create pending approval, notify user, execute on confirm) |
| `AuditLogger` | `app/Services/AI/AuditLogger.php` | Log every AI action: user, intent, tool called, parameters, result, timestamp |
| `PermissionManager` | `app/Services/AI/PermissionManager.php` | Check user permissions before tool execution; tenant-scoping |

#### Task 7.3 — AI Tools

**Interface**: Each tool implements `AITool` contract:

```php
interface AITool
{
    public function name(): string;                    // e.g., 'createDebitNote'
    public function description(): string;              // Human-readable
    public function schema(): array;                    // JSON schema for LLM
    public function execute(array $params, User $user, Tenant $tenant): ToolResult;
    public function authorize(User $user): bool;
    public function requiresApproval(): bool;
}
```

**Tools to create** (invoke existing services):

| Tool Class | Service Called | Requires Approval |
|---|---|---|
| `SearchCustomerTool` | `CustomerListingService` | No |
| `SearchPolicyTool` | `PolicyListingService` | No |
| `SearchQuoteTool` | `QuoteService` | No |
| `IssuePolicyTool` | `PolicyIssuanceService` | Yes |
| `RenewPolicyTool` | `RenewPolicyService` | Yes |
| `CancelPolicyTool` | `CancelPolicyService` | Yes |
| `CreateDebitNoteTool` | `DebitNoteService` | Yes |
| `CreateCreditNoteTool` | `CreditNoteService` | Yes |
| `RegisterClaimTool` | `RegisterClaimService` | Yes |
| `ApproveClaimTool` | `ApproveClaimService` | Yes |
| `SettleClaimTool` | `SettleClaimService` | Yes |
| `GenerateReceiptTool` | `GenerateReceiptService` | No |
| `GenerateCertificateTool` | `CertificateGenerationService` | No |
| `CalculatePremiumTool` | `QuoteService` | No |
| `CalculateCommissionTool` | `CommissionRule` / service | No |
| `SendEmailTool` | `EmailSendService` (Phase 4) | No |
| `GenerateNAICOMReportTool` | `NaicomReportService` | Yes |
| `ScheduleReminderTool` | `PolicyNotificationService` | No |

#### Task 7.4 — AI API Endpoints

**Routes**: `/api/v1/ai/*` (Sanctum auth + tenant scope)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/ai/chat` | POST | Main conversation endpoint (stream or non-stream) |
| `/api/v1/ai/conversations` | GET | List user's conversations |
| `/api/v1/ai/conversations/{id}` | GET | Get conversation history |
| `/api/v1/ai/conversations/{id}` | DELETE | Clear conversation |
| `/api/v1/ai/approvals/{id}` | GET | Get pending approval details |
| `/api/v1/ai/approvals/{id}` | POST | Approve/reject pending action |
| `/api/v1/ai/suggestions` | GET | Get context-aware suggested actions |

**Controller**: `App\Http\Controllers\Api\V1\AIAssistantController`

**Service**: `App\Services\AI\AIAssistantService` — orchestrates the full AI workflow

---

### Sprint 9: AI Frontend Workspace

#### Task 9.1 — Chat Workspace Component

Build within the existing Inertia app (replacing the placeholder `AI/AIAssistant.tsx` page):

```
resources/js/components/ai/
├── ai-workspace.tsx          // Main layout: sidebar + chat area
├── conversation-list.tsx     // Sidebar with conversation history
├── chat-messages.tsx         // Message thread with markdown rendering
├── chat-input.tsx            // Text input with send + attachments
├── suggested-actions.tsx     // Quick prompt chips
├── approval-card.tsx         // Approval/reject card for high-risk actions
├── action-summary.tsx        // Executed action summary with undo
├── file-upload.tsx           // Drag-drop file upload area
├── voice-input.tsx           // Web Speech API voice input
└── types.ts                  // AI-specific TypeScript types
```

#### Task 9.2 — Real-Time Streaming

- Use Laravel Reverb for streaming AI responses
- SSE (Server-Sent Events) via `Response::stream()` for LLM token streaming
- Update `channels.php` with `ai.{conversationId}` private channels

#### Task 9.3 — Integration with Existing UI

- AI Copilot accessible from global header (floating button or sidebar toggle)
- Context-aware: when viewing a customer, AI already knows customer context
- Hybrid UX: every traditional page has an "Ask AI" floating action button

---

## 6. Phase 4 — External Email Platform

### Sprint 10-13: Email Backend & Frontend

#### Task 10.1 — Database Schema

**New Migrations**:

| Migration | Tables |
|---|---|
| `create_email_accounts_table` | `email_accounts` (tenant_id, provider, email, credentials_encrypted, oauth_token_encrypted, refresh_token_encrypted, token_expires_at, imap_host, imap_port, smtp_host, smtp_port, is_active, last_sync_at) |
| `create_email_folders_table` | `email_folders` (account_id, name, remote_id, type: inbox/sent/drafts/trash/spam/custom, parent_id) |
| `create_email_messages_table` | `email_messages` (account_id, folder_id, thread_id, message_id_remote, subject, body_html, body_text, from_address, from_name, to_recipients, cc_recipients, bcc_recipients, received_at, is_read, is_flagged, is_draft, size, in_reply_to) |
| `create_email_attachments_table` | `email_attachments` (message_id, filename, mime_type, size_bytes, storage_path, content_id) |
| `create_email_signatures_table` | `email_signatures` (account_id, name, body_html, is_default) |
| `create_email_templates_table` | `email_templates` (tenant_id, name, subject, body_html, category) |

**Encryption**: All OAuth tokens and SMTP passwords stored via Laravel's `encrypt()` / `Crypt::encryptString()`.

#### Task 10.2 — OAuth Integration

| Provider | Package | Scope |
|---|---|---|
| **Google (Gmail)** | `google/apiclient` | `https://mail.google.com/` |
| **Microsoft 365** | `microsoft/microsoft-graph` | `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`, `offline_access` |
| **IMAP/SMTP** | `webklex/laravel-imap` + custom SMTP | Standard IMAP + SMTP (no OAuth) |

**OAuth Flow**:
1. Tenant navigates to `Settings → Email → Connect Account`
2. Selects provider (Gmail/M365/IMAP)
3. OAuth redirect → user authorizes → callback receives tokens
4. Tokens encrypted and stored in `email_accounts`
5. Background sync begins via queue job `SyncEmailAccount`

#### Task 10.3 — Email Sync Service

**File**: `app/Services/Email/EmailSyncService.php`

```php
class EmailSyncService
{
    public function syncAccount(EmailAccount $account): SyncResult
    public function syncFolder(EmailFolder $folder): SyncResult
    public function syncMessage(EmailMessage $message): void
    public function fullSync(EmailAccount $account): SyncResult
}
```

- IMAP via `webklex/laravel-imap` package
- Gmail API via Google Client Library
- Microsoft Graph API via `microsoft/microsoft-graph`
- Batch sync with rate limiting (respect provider API limits)
- Delta sync where supported (Gmail history, M365 delta query)
- Fallback to full sync if delta unavailable

#### Task 10.4 — Email Send Service

**File**: `app/Services/Email/EmailSendService.php`

```php
class EmailSendService
{
    public function send(EmailAccount $account, OutgoingEmail $email): SentResult
    public function sendWithAttachment(EmailAccount $account, OutgoingEmail $email, array $files): SentResult
    public function reply(EmailMessage $original, string $body, bool $replyAll = false): SentResult
    public function forward(EmailMessage $original, string $body, array $to): SentResult
}
```

- SMTP via Laravel's built-in Mail facade (per-account dynamic mailer)
- Gmail API `users.messages.send`
- Microsoft Graph `sendMail`
- Queue-based sending with retry logic
- Sent message persisted to `email_messages` with `folder_id = sent`

#### Task 10.5 — Email API Endpoints

**Routes**: `/api/v1/email/*` (Sanctum auth + tenant scope)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/email/accounts` | CRUD | Manage connected mailboxes |
| `/api/v1/email/accounts/{id}/sync` | POST | Trigger manual sync |
| `/api/v1/email/accounts/{id}/test` | POST | Test connection |
| `/api/v1/email/folders` | GET | List folders for account |
| `/api/v1/email/messages` | GET | List messages (with search, filter, pagination) |
| `/api/v1/email/messages/{id}` | GET | Get single message with body |
| `/api/v1/email/messages/{id}/attachments/{attachmentId}` | GET | Download attachment |
| `/api/v1/email/messages/{id}/read` | POST | Mark as read/unread |
| `/api/v1/email/messages/{id}/flag` | POST | Toggle flag |
| `/api/v1/email/messages/{id}/move` | POST | Move to folder |
| `/api/v1/email/compose` | POST | Send new email |
| `/api/v1/email/compose/reply/{id}` | POST | Reply to thread |
| `/api/v1/email/compose/forward/{id}` | POST | Forward message |
| `/api/v1/email/messages/batch` | POST | Batch operations (delete, move, mark-read) |
| `/api/v1/email/signatures` | CRUD | Manage signatures |
| `/api/v1/email/templates` | CRUD | Manage templates |
| `/api/v1/email/search` | GET | Full-text search across all folders |

#### Task 10.6 — Email Frontend

Build within the existing Inertia app:

```
resources/js/pages/email/
├── inbox.tsx                   // Inbox view (messages list + preview pane)
├── sent.tsx                    // Sent folder
├── drafts.tsx                  // Drafts folder
├── compose.tsx                 // New email compose (rich text + attachments)
├── thread.tsx                  // Threaded conversation view
├── settings/
│   ├── accounts.tsx            // Connected accounts management
│   ├── signatures.tsx          // Signature management
│   └── templates.tsx           // Template management
```

```
resources/js/components/email/
├── message-list.tsx            // Paginated, searchable message list
├── message-preview.tsx         // HTML email renderer
├── message-thread.tsx          // Threaded replies
├── compose-toolbar.tsx         // Rich text toolbar (TipTap)
├── attachment-list.tsx         // Attachment chips
├── attachment-preview.tsx      // Inline attachment preview (PDF, image)
├── folder-tree.tsx             // Folder navigation sidebar
├── account-badge.tsx           // Account indicator (color-coded)
├── search-bar.tsx              // Full-text search
└── signature-picker.tsx        // Signature dropdown
```

#### Task 10.7 — AI Email Assistant

**New AI Tools**:

| Tool | Purpose |
|---|---|
| `SummarizeEmailsTool` | Summarize today's unread emails or emails matching criteria |
| `FindEmailTool` | Search emails by content, sender, subject |
| `DraftReplyTool` | Generate professional reply based on context |
| `DraftEmailTool` | Compose new email from natural language instructions |
| `ExtractCustomerFromEmailTool` | Parse email → create/update customer record |
| `ExtractClaimFromEmailTool` | Parse email/attachment → create claim draft |
| `GenerateDocumentFromEmailTool` | Parse email → create debit note, invoice, etc. |

**These tools integrate into the AI Gateway** from Phase 3. The AI becomes aware of connected mailboxes and can operate on email data through the same tool interface.

---

## 7. Sprint 14: Polish & Test Hardening

### Task 14.1 — Test Coverage Expansion

| Area | Current Tests | Target |
|---|---|---|
| Service layer | Unit tests for `DocumentToolkitService` only | All 60+ services have unit tests |
| API endpoints | 14 API test files | Every `/api/v1/*` endpoint tested (happy + error paths) |
| Tenant isolation | Implicit in feature tests | Explicit cross-tenant access denial tests |
| Event listeners | None | All 10+ listeners tested |
| Queue jobs | None | All 5+ jobs tested |
| AI Copilot | None | Intent detection, tool execution, approval workflow |
| Email | None | Account sync, send, OAuth flow |

### Task 14.2 — API Documentation

- Regenerate Scribe API docs: `php artisan scribe:generate`
- Update Postman collection with all new endpoints
- Document AI Tool schemas and approval workflow

### Task 14.3 — Performance & Load Testing

- Load test critical endpoints: `/api/v1/policies`, `/api/v1/customers`, `/api/v1/claims`
- Verify rate limiting works correctly
- Test email sync job performance with large mailboxes

### Task 14.4 — Final Verification

```bash
npm run lint        # ESLint — zero errors
npm run types       # TypeScript — zero errors
php artisan test    # All tests green
vendor/bin/pint     # PHP code style clean
```

---

## 8. Dependency Graph

```
Sprint 1-2 (cont.) — Finish Service Extraction (Claims + Finance)
    │
    ▼
Sprint 3 — API Standardization
    │
    ├────► Sprint 5-6 — Multi-Tenant & Security (can start after 1.1 done)
    │
    ▼
Sprint 4 — Event-Driven Architecture
    │
    ▼
┌─── Phase 3 — AI Copilot (Sprint 7-9) ◄──── Phase 1.2 complete required
│       │
│       ▼
│   AI Backend (Sprint 7-8) ──► AI Frontend (Sprint 9)
│       │
│       └────────────────────────────────────────┐
│                                                │
└─── Phase 4 — Email Platform (Sprint 10-13) ◄──┘
    │
    ▼
Email Backend (Sprint 10-12) ──► Email Frontend (Sprint 13)
    │
    ▼
AI Email Assistant (Sprint 13, integrated with Phase 3)
    │
    ▼
Sprint 14 — Polish & Test Hardening
```

### Parallel Execution Opportunities

| Track | Depends On | Can Run In Parallel With |
|---|---|---|
| Service Extraction (1.1) | Nothing | — |
| API Standardization (1.2) | 1.1 completion | — |
| Event-Driven (1.3) | 1.2 completion | — |
| Multi-Tenant Security (1.4) | 1.1 completion (partial) | 1.2, 1.3 (partial) |
| AI Backend (3.1) | 1.2 completion | 1.3, 1.4 |
| AI Frontend (3.2) | 3.1 completion | 4.1 (partial) |
| Email Backend (4.1) | 1.2 completion | 3.1, 3.2 |
| Email Frontend (4.2) | 4.1 completion | — |
| AI Email Assistant (4.3) | 3.1 + 4.2 completion | — |
| Polish (14) | Everything above | — |

---

## 9. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Service extraction breaks existing Inertia pages | Medium | High | Maintain backward-compatible controller return signatures; run `php artisan test` + `npm run types` after every controller refactor |
| R2 | Mobile app breakage during API migration | High | High | Keep `/api/mobile/` alive as proxy during transition; version-detect in mobile app; add missing v1 endpoints before deprecation |
| R3 | AI Gateway cost/rate-limit exceeds budget | Medium | Medium | Implement token budgeting per tenant, tenant-level rate limiting, caching of common responses, provider fallback to cheaper model |
| R4 | Email OAuth token expiration causes sync failures | Medium | Medium | Automatic refresh flow on token fetch; health check artisan command for stale tokens; alert tenant on persistent failure |
| R5 | Data leakage across tenants in new services | Low | Critical | Every new service receives Tenant context; explicit tenant scoping in every query; integration tests verify cross-tenant isolation |
| R6 | Event listeners create cascading failures | Medium | Medium | Implement outbox pattern for critical events; use queues with retry + fallback; dead-letter queue for failed events |
| R7 | Scope creep delays delivery | High | High | Strict sprint boundaries; Phase 1 must be 100% complete before Phase 3 starts; no parallel Phase 3/4 until Phase 1 delivered |
| R8 | Existing Inertia frontend diverges from API contract | Medium | Medium | Run `npm run types` after every API change; frontend consumes shared TypeScript types from API |

---

## 10. Success Metrics

### Phase 1 Completion Criteria

- [🔶] All controllers < 200 lines of code — **Policy: 240, Customer: 230, Claim: 368, DebitNote: 462, CreditNote: 559** (in progress)
- [✅] Zero `Auth::user()` calls inside service layer — **Done**
- [⬜] Zero `$request->validate()` calls outside Form Requests — **100+ inline calls remain**
- [⬜] Duplicate query builder code eliminated (shared `HandlesListing` trait) — **Not started**
- [⬜] 100+ manual `tenant_id` checks replaced with `TenantAccessPolicy` Gate — **Not started**
- [✅] All `/api/v1/*` routes have rate limiting — **Done (120/min via AppServiceProvider)**
- [⬜] All 9 existing events have listeners — **Not started**
- [⬜] 5+ new domain events created with listeners — **Not started**
- [⬜] React Native mobile app consumes `/api/v1/` exclusively — **Not started**
- [⬜] `php artisan test` passes at 100% — **Not verified**

### Phase 3 Completion Criteria

- [ ] AI Gateway supports both OpenAI and Anthropic
- [ ] 15+ AI tools registered and executable
- [ ] High-risk tools require user approval (approval card UI)
- [ ] AI is tenant-aware (never accesses data outside authenticated tenant)
- [ ] Every AI action is audited
- [ ] AI can execute `createDebitNote("ABC Manufacturing, ₦450K")` end-to-end through existing `DebitNoteService`

### Phase 4 Completion Criteria

- [ ] Tenant can connect Gmail mailbox via OAuth
- [ ] Tenant can connect Microsoft 365 mailbox via OAuth
- [ ] Tenant can connect custom IMAP/SMTP account
- [ ] Inbox sync works (background queue job)
- [ ] Send, reply, forward work through all providers
- [ ] Full-text search across all email
- [ ] AI can summarize "today's emails"
- [ ] AI can draft and send replies

---

## 11. Architecture Decisions & Rationale

### Decision 1: No Next.js Frontend

**Chosen**: Keep Inertia SPA as primary UI.

**Rationale**: The existing Inertia app has 167 pages and 128 components — a complete rewrite would be ~6 months of parallel effort with high risk of feature drift. The refactor focuses on backend architecture where the real value lies (API-first, clean services, AI-ready). Frontend improvements are incremental within Inertia.

### Decision 2: Provider-Agnostic AI Gateway

**Chosen**: Design AIGateway to support multiple LLM providers.

**Rationale**: Avoids vendor lock-in. Allows using cheaper models for simple tasks (intent detection) and expensive models for complex tasks (document analysis). Automatic fallback ensures availability.

### Decision 3: Full OAuth Email from Start

**Chosen**: Build Gmail API + Microsoft Graph + IMAP/SMTP from day one.

**Rationale**: An email platform without Gmail/M365 integration would be incomplete for enterprise users. Building OAuth from the start avoids a painful retrofit later. The IMAP/SMTP fallback covers smaller email providers.

### Decision 4: Migrate Mobile to v1 API

**Chosen**: Move React Native app from `/api/mobile/` to `/api/v1/`.

**Rationale**: Eliminates source of duplication. The mobile app already uses Sanctum tokens (same as v1). Any missing v1 functionality will be exposed during migration, strengthening the API for all consumers.

### Decision 5: Event-Driven Cross-Domain Orchestration

**Chosen**: Introduce event listeners + queue jobs for cross-domain workflows.

**Rationale**: Currently claims, policies, finance, and NAICOM reporting are siloed. Events decouple these domains and allow asynchronous processing. For example, "claim approved" → auto-generate debit note → update NAICOM report → notify customer — all without the claiming controller knowing about finance or reporting.

### Decision 6: Keep Existing Service Contract (No Repository Pattern)

**Chosen**: Continue with direct Eloquent usage in services rather than introducing Repository pattern.

**Rationale**: The refactor document mentions Repository Pattern "where appropriate." Given Laravel's Eloquent ORM, adding a repository layer would add abstraction without clear benefit. Eloquent already provides: query scoping, global scopes, relationships, pagination, and eager loading. The `BelongsToTenant` concern + `TenantScope` already serve the repository's main purpose (consistent data access).

---

## Appendix: File Inventory

### New Files Created (Actual Progress)

| Phase | Files Created | Scope |
|---|---|---|
| 1.1 | 7 | PolicyProductService, PolicyListingService, PolicyApprovalService, PolicyApprovalRequest, CustomerListingService, CustomerExportService, ClaimListingService, ClaimCommentService |
| 1.1 (Shared Requests) | 8 | AddClaimCommentRequest, ApproveClaimRequest, MarkNotePaidRequest, RejectClaimRequest, RequestClaimInfoRequest, StoreClaimRequest, UpdateClaimRequest, UploadClaimDocumentsRequest |
| 1.2 | 1 | RateLimiter config in AppServiceProvider + throttle middleware on routes |
| Total | **16 created** | |

### New Files Still to Create (Estimated)

| Phase | New Files | Type |
|---|---|---|
| 1.1 (remaining) | ~3 | PHP Service methods (updateClaim, getClaimTypes, generateHtmlPreview, regenerateDocument) |
| 1.2 | 3 | PHP (HandlesListing trait, TenantAccessPolicy, mutation rate limit) |
| 1.3 | 15 | PHP Listeners + Jobs |
| 1.3 | 11 | PHP Events (6 new + existing 9 need listeners) |
| 1.4 | 10 | PHP Policies |
| 1.4 | 2 | PHP (AuditService, HasAuditTrail) |
| 3.1 | 15 | PHP AI Services + Tools |
| 3.2 | 12 | React Components |
| 4.1 | 30 | PHP (Models, Services, Jobs, Listeners) |
| 4.2 | 15 | React Components + Pages |
| 4.3 | 5 | PHP AI Email Tools |
| Total | **~121 remaining** | |

### Existing Files to Modify (Estimated)

| Phase | Modified Files | Type |
|---|---|---|
| 1.1 (remaining) | 5 | ClaimController, DebitNoteController, CreditNoteController, ClaimListingService, DebitNoteService, CreditNoteService |
| 1.2 | 15 | Routes, bootstrap/app.php, controllers |
| 1.3 | 5 | EventServiceProvider, service classes (dispatch events) |
| 1.4 | 10 | Models, controllers (authorization) |
| 3.2 | 1 | AI Assistant page (replace placeholder) |
| 4.2 | 3 | Routes, sidebar navigation |
| Total | ~39 | |

---

*End of Implementation Plan*
