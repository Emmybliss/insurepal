# InsurePal NAICOM Forms 7.2A–7.2C Analysis and Implementation Planning

You are a senior Laravel SaaS architect, insurance accounting systems analyst, regulatory reporting specialist, and React/TypeScript engineer.

Your task is to thoroughly analyse the existing InsurePal codebase and the supplied NAICOM reporting Excel templates, then produce a detailed, implementation-ready strategy for generating the following Nigerian insurance broker regulatory reports:

* NAICOM Form 7.2A
* NAICOM Form 7.2B
* NAICOM Form 7.2C

Do not begin implementation yet.

First inspect the existing codebase, identify what is already available, determine the missing financial and reporting components, and propose the safest implementation approach.

---

# 1. Application context

InsurePal is a multi-tenant insurance operations SaaS built with:

## Backend

* Laravel 12
* PHP 8.2+
* MySQL
* Inertia.js
* Spatie Laravel Permission
* Multi-tenant architecture using `tenant_id`
* Existing policy, customer, broker, insurer, debit note, credit note, receipt, claim, commission, document and reporting-related modules

## Frontend

* React
* TypeScript
* Inertia.js
* Tailwind CSS
* shadcn/ui
* React Hook Form or the project’s existing form pattern
* Existing dashboard, tables, filters, exports and approval workflows

## Reporting/export

Inspect the project to determine which libraries are already installed or used for:

* Excel generation
* CSV export
* PDF generation
* financial calculations
* background jobs
* audit logs
* document storage

For exact NAICOM Excel generation, evaluate the use of:

* PhpSpreadsheet
* Maatwebsite Laravel Excel
* or the project’s existing Excel library

Prefer PhpSpreadsheet for final regulatory template population where preserving exact workbook structure, merged cells, styles, formulas, borders, print areas and page setup is necessary.

---

# 2. NAICOM Excel files to analyse

Inspect the following uploaded workbooks:

```text
/mnt/data/NAICOM FORM 7.2A.xlsx
/mnt/data/NAICOM FORM 7.2B.xlsx
/mnt/data/FORM 7.2A FORM 7.2B FORM 7.2C.xlsx
```

The combined workbook is expected to contain:

* Form 7.2C
* Form 7.2B
* Form 7.2A

Do not assume the sheet names, order, formulas or column positions. Inspect and document them.

For every workbook and sheet, analyse:

* Sheet names
* Reporting form represented
* Header rows
* Data starting rows
* Column letters
* Column headings
* Merged cells
* Formula cells
* Total rows
* Monthly sections
* Date formats
* Number formats
* Currency formats
* Border styles
* Fonts and alignment
* Page orientation
* Print areas
* Repeated print rows
* Hidden rows or columns
* Data validation
* Named ranges
* Existing sample data
* Blank placeholders
* Hard-coded totals
* Inconsistent or malformed values
* Relationships between Forms 7.2A, 7.2B and 7.2C

Treat the workbooks as structural references, not automatically as correct accounting authorities.

Identify spreadsheet inconsistencies such as:

* hard-coded totals;
* formulas that do not cover all rows;
* text values inside amount columns;
* dates saved as text;
* malformed amounts;
* inconsistent commission calculations;
* premium values that fail to reconcile;
* missing values;
* duplicated policies;
* typing errors;
* unsupported assumptions.

Do not copy spreadsheet errors into application business logic.

---

# 3. Primary objective

Design a reporting architecture where Forms 7.2A, 7.2B and 7.2C are generated from validated InsurePal operational and financial records.

The reports must not be produced through manual spreadsheet data entry.

The intended transaction chain is:

```text
Policy
→ Debit Note
→ Premium Receipt
→ Receipt Allocation
→ Premium and Commission Allocation
→ Clients’ Account Ledger
→ Remittance
→ Bank Reconciliation
→ NAICOM Report Generation
→ Validation
→ Approval
→ Locked Report Snapshot
→ Excel Export
```

Analyse whether the existing codebase currently supports this complete chain.

Where it does not, identify the missing modules and recommend the minimum safe additions.

---

# 4. Codebase analysis requirements

Before proposing new tables or services, inspect the existing implementation.

Review at least the following:

```text
app/Models
app/Services
app/Actions
app/Repositories
app/Enums
app/Jobs
app/Events
app/Listeners
app/Observers
app/Policies
app/Http/Controllers
app/Http/Requests
app/Exports
app/Imports
app/Support
app/Traits
database/migrations
database/seeders
routes
resources/js
tests
composer.json
package.json
config
```

Search specifically for existing entities or concepts related to:

* tenants;
* insurance brokers;
* underwriters;
* insurers;
* customers;
* policies;
* policy periods;
* policy numbers;
* policy products;
* policy classes;
* sums insured;
* gross premiums;
* net premiums;
* debit notes;
* credit notes;
* receipts;
* payment methods;
* payments made directly to insurers;
* premium allocations;
* client bank accounts;
* bank transactions;
* bank reconciliation;
* commission rates;
* commission amounts;
* co-brokers;
* reporting brokers;
* VAT;
* claims;
* returned premiums;
* deposits;
* remittances;
* currencies;
* exchange rates;
* reporting periods;
* report approval;
* report locking;
* audit logs;
* spreadsheet exports;
* financial decimal handling.

For each relevant existing component, document:

1. File path.
2. Table or class name.
3. Purpose.
4. Relevant fields and relationships.
5. Whether it can support the NAICOM report directly.
6. Required changes.
7. Risks of modifying it.
8. Whether it should be reused, extended or replaced.

Do not create duplicate concepts where an existing implementation can be extended safely.

---

# 5. Form 7.2B analysis

Treat Form 7.2B as the detailed statement of business generated during the reporting half-year.

Analyse and map each spreadsheet column to InsurePal data.

The expected concepts may include:

* Reporting month
* Serial number
* Name of insured
* Name of insurer
* Policy number
* Cover commencement date
* Cover expiry date
* Sum insured
* Premium paid directly to insurer
* Local premium paid to broker
* Foreign premium paid to broker
* Total gross premium
* Net premium
* Payment method
* Date premium was received
* Premium received by broker
* Total commission or fee income
* Commission due to co-brokers
* Commission due to reporting broker
* Earned commission
* Deferred commission

Confirm the actual workbook columns instead of relying only on this expected list.

For every Form 7.2B field, provide:

```text
NAICOM column
Exact Excel column
Existing InsurePal source
Existing table and field
Required calculation
Required relationship
Missing data
Recommended new field or table
Validation rule
```

Investigate and propose rules for:

```text
Total commission
= Co-broker commission + Reporting-broker commission
```

```text
Reporting-broker commission
= Earned commission + Deferred commission
```

Determine whether the following relationship is always valid or requires configuration:

```text
Gross premium
= Net premium + Total commission
```

Consider:

* VAT;
* fees;
* foreign business;
* co-broker arrangements;
* direct insurer payments;
* instalment payments;
* endorsements;
* cancellations;
* returned premiums;
* credit notes;
* multiple insurers;
* coinsurance;
* policy adjustments.

## Earned and deferred commission

Analyse the correct architecture for commission recognition.

A possible straight-line approach is:

```text
Earned commission
= Reporting broker commission
  × elapsed covered days
  ÷ total policy coverage days
```

```text
Deferred commission
= Reporting broker commission − Earned commission
```

Do not implement this automatically without documenting:

* reporting cutoff date;
* recognition date;
* policy inception date;
* policy expiry date;
* cancelled policy treatment;
* endorsements;
* leap-year treatment;
* rounding;
* fully earned policies;
* unearned commission;
* accounting overrides.

Recommend whether the system needs a configurable `commission_recognition_date`, recognition method, or manual authorised adjustment.

---

# 6. Form 7.2C analysis

Treat Form 7.2C as a remittance and outstanding-liability report.

Expected concepts may include:

* Month
* Insured
* Policy number
* Insurer
* Cover period
* Total premium or claim received
* Premium due to insurer
* Deposit received into clients’ account
* Return premium due
* Claim amount due
* VAT due
* Commission due to co-brokers
* Commission due to reporting broker
* Remittance date
* Paying clients’ bank account
* Premium remitted
* Claim, return premium or deposit remitted
* VAT remitted
* Commission remitted
* Outstanding premium
* Outstanding claim, return premium or deposit
* Outstanding VAT
* Outstanding commission

Confirm the real columns in the workbook.

For every Form 7.2C field, provide:

```text
NAICOM column
Exact Excel column
Existing InsurePal source
Calculation rule
Remittance source
Outstanding balance calculation
Missing data
Validation rule
```

Analyse the following calculations:

```text
Outstanding premium
= Premium due to insurer − Premium remitted
```

```text
Outstanding claim/return premium/deposit
= Amount due − Amount remitted
```

```text
Outstanding VAT
= VAT due − VAT remitted
```

```text
Outstanding commission
= Co-broker commission due
  + Reporting-broker commission due
  − Commission remitted
```

Determine how InsurePal should handle:

* partial remittances;
* multiple remittances for one policy;
* one remittance covering multiple policies;
* one receipt covering multiple policies;
* overpayments;
* remittance reversals;
* failed bank transfers;
* foreign currency remittances;
* direct premium payments to insurers;
* remittance fees;
* co-broker commission payments;
* reporting broker commission transfers;
* VAT payments;
* claims received and remitted;
* deposits;
* returned premiums.

Recommend whether Form 7.2C should use:

1. one row per policy;
2. one row per policy and remittance;
3. an aggregated policy row with a supporting remittance schedule.

Choose one and justify it based on auditability and the supplied template.

---

# 7. Form 7.2A analysis

Treat Form 7.2A as a monthly statement of assets and liabilities relating to the broker’s clients’ account.

Determine whether the workbook reports:

* January to June for H1;
* July to December for H2;
* or another configurable reporting period.

Expected asset categories may include:

* Cash in hand
* Cheques in hand
* Clients’ bank account balance
* Total assets

Expected liability categories may include:

* Premium awaiting remittance
* Co-broker commission awaiting remittance
* Reporting broker commission awaiting remittance
* VAT awaiting remittance
* Claims awaiting remittance
* Returned premiums awaiting remittance
* Deposits awaiting remittance
* Other client liabilities
* Total liabilities

Confirm the exact row labels and monthly column layout.

Analyse the required data source for each line.

## Reconciliation rule

The system should enforce:

```text
Total assets = Total liabilities
```

For each reporting month, explain how to calculate:

### Cash in hand

Premium or client-money receipts received in cash but not deposited into a clients’ bank account by month-end.

### Cheques in hand

Cheque receipts received but not cleared into the clients’ bank account by month-end.

### Clients’ bank balance

Reconciled closing balance of all included clients’ bank accounts at month-end.

### Premium awaiting remittance

Premium received and allocated to insurers but not remitted as at month-end.

### Co-broker commission awaiting remittance

Commission due to another broker but not yet paid.

### Reporting broker commission awaiting remittance

Commission belonging to the reporting broker but still held inside the clients’ account.

### VAT awaiting remittance

VAT liability less VAT remitted.

### Other liabilities

Claims, return premiums, deposits and other client funds awaiting payment.

Identify whether the existing codebase has enough transaction history to calculate historical month-end positions.

If not, propose how opening balances and historical migration should work.

---

# 8. Financial ledger assessment

Determine whether InsurePal requires a dedicated clients’ money ledger.

Evaluate the need for tables or equivalent existing structures such as:

```text
client_bank_accounts
client_account_transactions
premium_receipts
receipt_allocations
premium_financial_allocations
remittances
remittance_allocations
bank_reconciliations
bank_reconciliation_lines
financial_adjustments
```

Do not assume these exact table names are required. Reuse existing tables where appropriate.

The recommended ledger must support:

* immutable approved financial entries;
* debit and credit direction;
* source polymorphism;
* policy linkage;
* customer linkage;
* insurer linkage;
* broker linkage;
* transaction date;
* value date;
* currency;
* exchange rate;
* payment method;
* bank reference;
* receipt reference;
* allocation;
* reversal;
* approval;
* reconciliation;
* audit trail;
* multi-tenancy.

Approved financial transactions must not be silently edited or deleted.

Corrections should use:

* reversal entries;
* adjustment entries;
* or versioned amendments.

Recommend the safest accounting model for the current application.

---

# 9. Multi-tenant and security requirements

All reports and financial records must be tenant-scoped.

Analyse:

* tenant global scopes;
* route model binding;
* authorization policies;
* role permissions;
* cross-tenant data leakage risks;
* Super Admin access;
* broker staff access;
* report preparer access;
* reviewer access;
* approver access;
* export access;
* adjustment access.

Propose permissions such as:

```text
naicom-reports.view
naicom-reports.generate
naicom-reports.review
naicom-reports.adjust
naicom-reports.approve
naicom-reports.lock
naicom-reports.export
naicom-reports.submit
naicom-reports.restate
```

Use the project’s existing permission naming convention where one already exists.

---

# 10. Report lifecycle

Recommend a versioned lifecycle such as:

```text
Draft
Generating
Generated
Validation Failed
Under Review
Approved
Locked
Exported
Submitted
Restated
```

Review the project’s existing enums and status systems before introducing new ones.

A generated report must contain a historical snapshot.

Later changes to:

* policies;
* receipts;
* remittances;
* commissions;
* insurer records;
* customer names;
* bank transactions;

must not silently alter an already approved or submitted report.

Evaluate storing report lines using:

* normalised snapshot tables;
* JSON payloads;
* or a combination of both.

Recommend an approach that supports:

* traceability;
* reporting performance;
* drill-down;
* Excel re-export;
* report comparison;
* restatement;
* audit review.

---

# 11. Validation engine

Design a validation framework that runs before report approval.

Classify validations as:

* Critical error
* Warning
* Informational

Possible validations include:

## General

* Missing tenant details
* Missing reporting broker details
* Missing reporting period
* Invalid dates
* Duplicate source records
* Unsupported currencies
* Missing exchange rates

## Policy/business

* Policy without insurer
* Policy without customer
* Policy without policy number
* Policy without cover dates
* Policy expiry before inception
* Missing sum insured
* Missing gross premium
* Missing net premium
* Missing commission allocation

## Receipts

* Receipt without allocation
* Receipt allocated above its amount
* Receipt date outside allowed scope
* Receipt without payment method
* Receipt without bank or cash destination

## Remittances

* Remittance without allocation
* Allocation above remittance amount
* Premium remitted above premium due
* VAT remitted above VAT due
* Commission remitted above commission due
* Negative outstanding balance

## Form 7.2B

* Co-broker plus reporting-broker commission does not equal total commission
* Earned plus deferred commission does not equal reporting-broker commission
* Invalid recognition calculation

## Form 7.2C

* Due and remitted values do not reconcile
* Outstanding amounts are negative
* Remittance date precedes receipt date
* Paying bank account is missing

## Form 7.2A

* Total assets do not equal total liabilities
* Clients’ account is unreconciled
* Missing monthly closing balance
* Unknown opening balance
* Cash or cheque remains uncleared without explanation

For each proposed validation, specify:

```text
Code
Form
Severity
Condition
User-friendly message
Suggested resolution
Whether approval should be blocked
```

---

# 12. Manual adjustments

Design an authorised adjustment process.

Every adjustment must store:

* report run;
* form;
* row or field affected;
* calculated amount;
* adjusted amount;
* difference;
* reason;
* supporting document;
* preparer;
* reviewer;
* approver;
* timestamps.

The original calculated amount must remain preserved.

Manual adjustment must not overwrite the underlying financial ledger without a separate financial transaction or correction process.

Explain which report values may be adjusted and which should require correction at source.

---

# 13. Excel export strategy

The final export should preserve the supplied NAICOM workbook layout as closely as possible.

Propose a versioned template structure such as:

```text
storage/app/templates/naicom/
    form-7.2/
        version-1/
            form-7.2.xlsx
```

The exporter should:

1. Copy the correct template version.
2. Preserve the original template.
3. Populate broker details.
4. Populate reporting period.
5. Insert dynamic rows.
6. Copy row styles and borders.
7. Write real numeric values.
8. Write real Excel date values.
9. Add formulas where appropriate.
10. Update grand-total ranges.
11. Update print areas.
12. Preserve merged cells.
13. Preserve page orientation.
14. Preserve repeated print rows.
15. Save the generated workbook.
16. calculate a checksum.
17. associate the file with the report run.
18. retain export history.

Do not store numbers as formatted strings.

Do not insert placeholders such as:

```text
___
TBA
-
```

into numeric database or Excel cells.

Use Excel number formatting to visually display zero values as dashes where required.

All financial calculations must use decimal-safe arithmetic.

Do not use PHP floating-point calculations for financial totals.

Review whether the project already uses:

* BCMath;
* Brick Money;
* MoneyPHP;
* custom decimal value objects;
* database decimal casts.

Recommend the safest approach consistent with the existing project.

---

# 14. Proposed backend architecture

After inspecting the codebase, recommend the actual classes and locations.

Possible services may include:

```text
NaicomReportService
NaicomForm72AService
NaicomForm72BService
NaicomForm72CService
NaicomValidationService
NaicomReconciliationService
NaicomExcelExportService
NaicomReportSnapshotService
NaicomCommissionRecognitionService
```

These names are suggestions only.

Follow the project’s existing architecture and naming conventions.

Clearly separate:

* data retrieval;
* calculations;
* validation;
* report snapshotting;
* approval;
* export;
* presentation.

Do not put large report calculations directly inside:

* controllers;
* React components;
* export classes;
* Eloquent accessors.

Recommend query objects, actions, services or domain classes that fit the current codebase.

---

# 15. Proposed frontend architecture

Analyse existing React/Inertia page patterns and recommend screens for:

```text
Reports
└── NAICOM Returns
    ├── Report Periods
    ├── Generate Report
    ├── Form 7.2A
    ├── Form 7.2B
    ├── Form 7.2C
    ├── Validation Results
    ├── Adjustments
    ├── Approval History
    ├── Export History
    └── Submission History
```

The preview interface should support:

* report period selection;
* H1/H2 selection;
* reporting year;
* reporting cutoff date;
* commission recognition date;
* included clients’ bank accounts;
* report generation;
* validation summary;
* form tabs;
* monthly grouping;
* filters;
* totals;
* drill-down to source transactions;
* warnings;
* adjustment requests;
* review;
* approval;
* locking;
* Excel download;
* report version comparison.

Every generated figure should be traceable to its source records where practical.

Example drill-down:

```text
Outstanding premium: ₦5,250,000

Sources:
- Policy MTR-2026-001: ₦2,000,000
- Policy FIRE-2026-041: ₦1,750,000
- Policy MAR-2026-012: ₦1,500,000
```

Do not recreate Excel as an editable browser spreadsheet unless there is a strong business reason.

The web interface should be used for:

* review;
* validation;
* reconciliation;
* traceability;
* approval.

The exact official layout should remain in the generated Excel export.

---

# 16. Testing requirements

Produce a complete test strategy.

Include:

## Unit tests

* Form 7.2A calculations
* Form 7.2B calculations
* Form 7.2C calculations
* Earned/deferred commission
* Outstanding amounts
* Date boundaries
* H1/H2 period handling
* Decimal rounding
* Currency conversion
* Reversals
* Adjustments

## Feature tests

* Tenant isolation
* Role authorization
* Report generation
* Validation failure
* Approval
* Locking
* Restatement
* Excel export
* Source drill-down

## Reconciliation tests

* Total assets equal total liabilities
* Receipts equal allocations
* Remittances equal remittance allocations
* Outstanding equals due minus remitted
* Commission components reconcile

## Excel tests

Verify:

* expected sheets exist;
* expected headers exist;
* inserted rows preserve styles;
* formulas cover all generated rows;
* dates are written as dates;
* numbers are written as numbers;
* total cells are correct;
* print areas are correct;
* workbook can be opened successfully.

## Fixture scenarios

Create test scenarios for:

* one fully paid and fully remitted policy;
* partial premium payment;
* direct payment to insurer;
* policy with co-broker;
* foreign currency policy;
* multiple receipts for one policy;
* one receipt for several policies;
* several remittances for one policy;
* one remittance for several policies;
* returned premium;
* claim receipt and claim remittance;
* VAT liability and VAT remittance;
* unearned commission;
* cancelled policy;
* endorsement;
* over-remittance;
* report restatement;
* opening balance migration.

---

# 17. Required deliverables

Produce the analysis as a structured implementation document containing the following sections.

## A. Executive summary

Explain:

* current readiness;
* major gaps;
* recommended architecture;
* principal risks;
* recommended implementation order.

## B. Existing codebase inventory

Provide a table:

| Area | Existing implementation | File paths | Reusable? | Required changes |
| ---- | ----------------------- | ---------- | --------: | ---------------- |

## C. Excel workbook analysis

For each form, provide:

* sheet;
* header range;
* data range;
* totals;
* formulas;
* formatting;
* anomalies;
* dynamic-row requirements.

## D. Field-mapping matrix

Provide separate mapping tables for:

* Form 7.2A
* Form 7.2B
* Form 7.2C

Use columns:

| NAICOM field | Excel location | Existing source | Calculation | Gap | Recommendation |
| ------------ | -------------- | --------------- | ----------- | --- | -------------- |

## E. Gap analysis

Classify gaps as:

* Existing and sufficient
* Existing but requires extension
* Missing and required
* Optional improvement
* Requires accounting or compliance confirmation

## F. Recommended database changes

For every table or field:

* table name;
* field;
* type;
* nullable status;
* indexes;
* foreign keys;
* unique constraints;
* tenant scope;
* purpose;
* migration risk;
* data migration requirement.

Do not write migrations yet.

## G. Domain and service architecture

List proposed:

* models;
* enums;
* services;
* actions;
* queries;
* validators;
* policies;
* jobs;
* events;
* export classes.

Include responsibilities and dependency flow.

## H. Report calculation specification

Provide explicit formulas and pseudocode for all calculations.

## I. Validation specification

Provide the complete validation catalogue.

## J. UI/UX plan

List routes, controllers, Inertia pages, components and user flows.

## K. Excel export plan

Describe exact template population and row insertion strategy.

## L. Security and audit plan

Cover:

* tenant isolation;
* permissions;
* approval;
* locking;
* source traceability;
* adjustment audit trail;
* restatements.

## M. Testing plan

List unit, feature, reconciliation and export tests.

## N. Phased implementation roadmap

Recommend phases such as:

### Phase 1 — Codebase and financial data alignment

* Reuse or extend existing entities
* Resolve missing policy and premium fields
* Introduce required financial allocations

### Phase 2 — Clients’ account ledger

* Client bank accounts
* Receipts
* Allocations
* Remittances
* Reconciliation
* Opening balances

### Phase 3 — Form 7.2B

* Business generated report
* Commission recognition
* Validation
* Preview

### Phase 4 — Form 7.2C

* Due, remitted and outstanding balances
* Remittance traceability
* Validation
* Preview

### Phase 5 — Form 7.2A

* Monthly assets and liabilities
* Clients’ account reconciliation
* Opening and closing balances

### Phase 6 — Approval and audit

* Review
* Adjustments
* Approval
* Locking
* Restatement

### Phase 7 — Excel export

* Template versioning
* Exact workbook population
* Export history

### Phase 8 — Automated tests and rollout

* Test coverage
* Historical data migration
* Pilot tenant
* reconciliation verification
* production deployment

For each phase, list:

* objective;
* backend tasks;
* frontend tasks;
* migrations;
* tests;
* dependencies;
* acceptance criteria;
* risks.

## O. Open questions

List every issue requiring confirmation from:

* accountant;
* insurance broker;
* NAICOM compliance officer;
* product owner;
* existing data owner.

Do not silently invent regulatory or accounting rules.

---

# 18. Constraints

Follow these rules:

1. Do not implement code during this task.
2. Do not generate migrations yet.
3. Do not replace existing modules without proving they are insufficient.
4. Do not duplicate existing database concepts.
5. Do not calculate reports only in React.
6. Do not treat the Excel workbook as the financial source of truth.
7. Do not hard-code sample values.
8. Do not copy spreadsheet mistakes into application logic.
9. Do not use floats for money.
10. Do not permit cross-tenant report access.
11. Do not allow approved reports to change silently.
12. Do not permit untracked manual adjustments.
13. Do not rely only on policy records; include receipts, allocations, remittances and bank reconciliation.
14. Preserve the original uploaded workbooks.
15. Clearly mark assumptions and compliance questions.
16. Follow the existing codebase conventions wherever they are sound.
17. Prefer incremental changes over a dangerous rewrite.
18. Report exact file paths and classes reviewed.

---

# 19. Final recommendation requirement

At the end of the analysis, provide a firm recommendation choosing one of these approaches:

## Option A — Extend the existing financial modules

Choose this where the current receipt, payment, commission and remittance structures are sufficiently robust.

## Option B — Add a dedicated clients’ account sub-ledger

Choose this where current operational tables exist but do not provide the accounting and reconciliation history required by NAICOM reports.

## Option C — Build a broader double-entry accounting ledger

Choose this only if the existing product direction justifies full accounting capabilities beyond regulatory reporting.

Compare the three approaches using:

* implementation complexity;
* regulatory reliability;
* auditability;
* impact on current modules;
* migration risk;
* reporting accuracy;
* future scalability.

Select one approach and justify it based on actual codebase findings, not assumptions.

The analysis must be detailed enough that a second AI coding agent can implement the approved plan without needing to rediscover the application architecture or workbook structure.
