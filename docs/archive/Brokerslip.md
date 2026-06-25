# InsurePal Broker’s Slip Module — Analysis, Planning and Design Prompt

You are a senior Laravel SaaS architect, insurance brokerage systems analyst, product designer and React/TypeScript engineer.

Your task is to analyse the existing InsurePal codebase and the attached broker’s slip samples, then design an implementation-ready plan for a complete Broker’s Slip and Insurance Placement module.

Do not begin implementation yet.

First inspect the existing codebase, understand the current quote, customer, insurer, policy, policy product, premium, commission, document, approval and PDF systems, and then propose the best architecture.

---

# 1. Application context

InsurePal is a multi-tenant insurance operations SaaS built with:

## Backend

* Laravel 12
* PHP 8.2+
* MySQL
* Inertia.js
* Spatie Laravel Permission
* Tenant-scoped data using `tenant_id`
* Existing customers, insurers, brokers, policy products, quotes, policies, debit notes, credit notes, claims, documents and reports

## Frontend

* React
* TypeScript
* Inertia.js
* Tailwind CSS
* shadcn/ui
* Existing table, form, modal, drawer, wizard, dashboard and approval patterns

## Documents

Inspect the project for existing use of:

* Dompdf
* Browsershot
* React PDF
* PhpSpreadsheet
* document templates
* tenant letterheads
* header and footer images
* signatures
* stamps
* watermarks
* QR codes
* document versioning
* PDF storage
* document approval

---

# 2. Reference broker’s slip

Analyse this attached PDF:

```text
/mnt/data/Neta brokerslip.pdf
```

The PDF contains four sample broker’s slips:

1. Fire and Special Perils
2. Burglary Insurance
3. Marine Cargo
4. Private Motor Comprehensive

Inspect every page and document:

* shared fields;
* class-specific fields;
* header and footer structure;
* tenant branding;
* logo placement;
* watermark;
* NCRIB logo;
* directors or management footer;
* title;
* field labels;
* spacing;
* typography;
* signature placement;
* amount formatting;
* premium calculations;
* commission calculation;
* period presentation;
* insurer details;
* proposer or insured details;
* risk details;
* claim payment condition.

Treat the PDF as a structural and visual reference, not as the only possible broker’s slip format.

Identify inconsistencies, spelling errors, formatting limitations and missing professional document controls.

---

# 3. Primary business objective

Design a Broker’s Slip module that allows an insurance broker to:

1. Create a placement from a quote, proposal, policy or new business record.
2. Select one or more insurers.
3. capture shared and class-specific risk details.
4. calculate premium, commission and net premium.
5. select clauses, warranties, conditions and exclusions.
6. generate a professional broker’s slip.
7. submit the slip for internal review and approval.
8. issue and send it to an insurer.
9. track the insurer’s response.
10. revise and reissue the slip.
11. convert an accepted placement into a policy.
12. preserve every issued version for audit purposes.

The intended workflow is:

```text
Customer or Prospect
    ↓
Quote or Proposal
    ↓
Insurance Placement
    ↓
Select Insurer or Insurers
    ↓
Prepare Broker’s Slip
    ↓
Internal Review
    ↓
Approval
    ↓
Issue and Send to Insurer
    ↓
Accepted / Countered / Declined
    ↓
Policy Issuance
    ↓
Debit Note
    ↓
Premium and Commission Accounting
    ↓
NAICOM Reporting
```

The Broker’s Slip must not be implemented as a disconnected PDF form.

It must be part of the complete insurance placement workflow.

---

# 4. Codebase analysis

Before recommending any new database tables or services, inspect the existing implementation.

Review at least:

```text
app/Models
app/Enums
app/Services
app/Actions
app/Repositories
app/Jobs
app/Events
app/Listeners
app/Observers
app/Policies
app/Http/Controllers
app/Http/Requests
app/Notifications
app/Mail
app/Support
app/Traits
app/Exports
database/migrations
database/seeders
routes
resources/js
resources/views
storage/app/templates
tests
composer.json
package.json
config
```

Search specifically for:

* Quote
* Proposal
* Customer
* Insured
* Insurer
* Underwriter
* Policy
* PolicyProduct
* PolicyClass
* PolicyType
* Risk item
* Vehicle
* Property
* Marine cargo
* Sum insured
* Premium
* Rate
* Commission
* VAT
* Fees
* Debit note
* Credit note
* Document template
* Letterhead
* Header
* Footer
* Signature
* Stamp
* Watermark
* Approval
* Audit log
* PDF
* QR code
* Document number
* Email
* Notification
* Tenant settings

For every reusable component, report:

1. File path
2. Model or class name
3. Current purpose
4. Relevant fields and relationships
5. Whether it can support the Broker’s Slip module
6. Required extensions
7. Risks of modification
8. Whether it should be reused, extended or left unchanged

Do not duplicate existing concepts unnecessarily.

---

# 5. Core domain decision

Determine whether the Broker’s Slip should be generated directly from:

* a quote;
* a policy;
* a new placement entity;
* or a hybrid workflow.

The preferred architecture is expected to be:

```text
Quote
    ↓
Placement
    ↓
Placement Market
    ↓
Broker’s Slip
    ↓
Insurer Response
    ↓
Accepted Placement
    ↓
Policy
```

Evaluate this against the actual InsurePal codebase.

Explain why a Broker’s Slip should normally belong to a placement rather than directly to a final policy.

Consider:

* a quote being sent to several insurers;
* different rates from different insurers;
* different commission rates;
* negotiations;
* counter-offers;
* coinsurance;
* lead insurer;
* participating insurers;
* declined insurers;
* revised slips;
* accepted terms;
* policy conversion.

---

# 6. Shared broker’s slip fields

Analyse and design the common fields required across insurance classes.

The shared fields should include, where applicable:

```text
Slip number
Placement number
Quote reference
Document version
Issue date
Receiving insurer
Insurer branch
Insurer address
Insurer contact person
Insured or proposer
Customer type
Policy type
Class of business
Policy product
Cover start date
Cover end date
Currency
Total sum insured or value
Rate
Rate basis
Gross premium
Commission rate
Commission amount
Co-broker commission
Reporting broker commission
Fees
Taxes
Discount
Net premium due to insurer
Claim payment condition
Clauses
Warranties
Exclusions
Special conditions
Prepared by
Reviewed by
Approved by
Authorised signatory
Signature
Stamp
Status
```

Determine which fields already exist in the codebase.

For every field provide:

| Field | Existing source | Required calculation | Missing data | Recommendation |
| ----- | --------------- | -------------------- | ------------ | -------------- |

---

# 7. Class-specific data design

The system must support different insurance classes without creating a separate rigid form for every product.

Analyse the best schema-driven approach.

## Fire and Special Perils

Possible fields:

* Property insured
* Building description
* Contents description
* Movable assets
* Risk location
* Occupancy
* Construction type
* Building value
* Contents value
* Machinery value
* Total sum insured
* Special perils
* Excess
* Fire protection
* Claims history

## Burglary

Possible fields:

* Property or contents insured
* Risk location
* Nature of premises
* Security arrangements
* Alarm system
* Guarding arrangement
* Contents value
* Stock value
* Maximum value at risk
* Excess
* Claims history

## Marine Cargo

Possible fields:

* Cargo description
* Cargo value
* Voyage
* Port of loading
* Port of discharge
* Country of origin
* Destination
* Mode of conveyance
* Vessel or vehicle details
* Institute Cargo Clause
* Packing method
* Shipment period
* Basis of valuation
* Excess
* Transit conditions

## Motor

Possible fields:

* Vehicle make
* Vehicle model
* Registration number
* Chassis number
* Engine number
* Year of manufacture
* Body type
* Vehicle use
* Seating capacity
* Vehicle value
* Cover type
* Excess
* Accessories
* Vehicle schedule

Evaluate whether InsurePal’s existing dynamic product fields can be reused.

Recommend a schema such as:

```json
{
    "broker_slip_fields": [
        {
            "key": "risk_location",
            "label": "Risk Location",
            "type": "textarea",
            "required": true,
            "section": "risk_details",
            "show_on_document": true,
            "sort_order": 1
        }
    ]
}
```

The schema should support:

* text;
* textarea;
* number;
* money;
* percentage;
* date;
* select;
* multi-select;
* checkbox;
* table or repeating items;
* file attachment;
* calculated values;
* conditional fields.

Do not recommend separate hard-coded React pages unless necessary.

---

# 8. Proposed data architecture

Inspect existing tables before proposing changes.

Evaluate whether the following concepts are required.

## Placements

A placement represents insurance business being presented to the insurance market.

Possible fields:

```text
id
tenant_id
placement_number
quote_id
customer_id
policy_type_id
policy_class_id
policy_product_id
currency
proposed_start_date
proposed_end_date
total_sum_insured
status
created_by
approved_by
created_at
updated_at
```

## Placement markets

A placement market represents an insurer approached for the risk.

Possible fields:

```text
id
tenant_id
placement_id
insurer_id
insurer_branch_id
contact_id
is_lead
participation_percentage
offered_rate
rate_basis
gross_premium
commission_rate
commission_amount
net_premium
status
sent_at
response_date
response_notes
```

## Broker’s slips

Possible fields:

```text
id
tenant_id
placement_id
placement_market_id
slip_number
template_id
version
currency
sum_insured
rate
rate_basis
gross_premium
commission_rate
commission_amount
co_broker_commission
reporting_broker_commission
fees
taxes
discount
net_premium
period_start
period_end
claim_payment_condition
status
issued_at
issued_by
reviewed_by
approved_by
signed_by
pdf_path
checksum
created_at
updated_at
```

## Broker’s slip items

Used for vehicles, buildings, cargo, equipment and other scheduled risks.

Possible fields:

```text
id
tenant_id
broker_slip_id
item_type
description
identifier
location
quantity
sum_insured
rate
rate_basis
premium
metadata
sort_order
```

## Broker’s slip clauses

Possible fields:

```text
id
tenant_id
broker_slip_id
clause_type
title
content
is_standard
sort_order
```

## Broker’s slip versions

Possible fields:

```text
id
tenant_id
broker_slip_id
version
snapshot_json
pdf_path
checksum
created_by
created_at
```

Do not assume these exact tables are required.

Reuse existing quote, policy, risk item, document version and approval structures where appropriate.

For every proposed table or field provide:

* purpose;
* data type;
* nullable status;
* foreign keys;
* indexes;
* tenant scope;
* unique constraints;
* relationship;
* migration risk;
* existing data migration requirement.

Do not write migrations during this planning task.

---

# 9. Premium calculation design

The Broker’s Slip must support different premium calculation methods.

Evaluate support for:

```text
percentage
per_mille
fixed_amount
per_unit
tiered
minimum_premium
negotiated
manual
```

## Percentage rate

```text
Gross Premium = Sum Insured × Rate ÷ 100
```

## Per-mille rate

```text
Gross Premium = Sum Insured × Rate ÷ 1,000
```

## Commission

```text
Commission Amount = Gross Premium × Commission Rate ÷ 100
```

## Basic net premium

```text
Net Premium = Gross Premium − Commission Amount
```

The financial structure should also support:

```text
Gross premium
Broker commission
Co-broker commission
Reporting broker commission
VAT
Policy fee
Stamp duty
Levy
Discount
Other charge
Net premium due to insurer
```

Determine whether the exact formula should be configurable by product or insurer.

Use decimal-safe calculations.

Do not use PHP floating-point arithmetic.

Inspect whether the project currently uses:

* BCMath;
* Brick Money;
* MoneyPHP;
* decimal value objects;
* database decimal casts.

Recommend the safest option consistent with the current codebase.

---

# 10. Calculation override rules

Insurance placements may involve negotiated rates and premiums.

The system should calculate automatically but allow authorised users to override:

* rate;
* gross premium;
* commission rate;
* commission amount;
* fees;
* net premium.

Every override must preserve:

```text
Calculated value
Override value
Difference
Reason
User
Date and time
Approver
Approval date
```

Recommend which overrides should require approval.

Do not allow silent changes to an issued slip.

---

# 11. Broker’s slip creation workflow

Design a step-by-step wizard.

## Step 1 — Source

Allow creation from:

* Existing quote
* Existing proposal
* Existing policy
* New placement

Recommend the preferred route.

## Step 2 — Customer and insured

Select:

* Customer
* Insured
* Proposer
* Contact person
* Address

Support cases where proposer and insured are different.

## Step 3 — Insurance product

Select:

* Policy type
* Policy class
* Policy product
* Cover type

Load the correct dynamic fields.

## Step 4 — Insurer

Select:

* Insurer
* Branch
* Contact person
* Insurer address
* Lead insurer
* Participation percentage

Support several insurers where required.

## Step 5 — Risk details

Render class-specific fields and repeating risk items.

## Step 6 — Financial terms

Enter or calculate:

* Sum insured
* Rate
* Rate basis
* Gross premium
* Commission
* Fees
* Taxes
* Net premium

Show a live financial breakdown.

## Step 7 — Clauses and conditions

Allow users to select from a clause library:

* Coverage clauses
* Warranties
* Exclusions
* Subjectivities
* Claim payment conditions
* Special conditions

Allow controlled custom clauses.

## Step 8 — Branding and signatory

Select:

* Broker’s slip template
* Letterhead
* Watermark
* Signatory
* Signature
* Stamp
* Footer

## Step 9 — Preview and validation

Show an A4 preview.

Validate all required data and calculations.

## Step 10 — Review and approval

Workflow:

```text
Draft
→ Pending Review
→ Changes Requested
→ Approved
→ Issued
```

## Step 11 — Send to insurer

Allow:

* PDF download
* Email
* Copy link
* Mark as manually sent

## Step 12 — Insurer response

Capture:

```text
Accepted
Accepted with conditions
Counter-offer
More information requested
Declined
Withdrawn
```

---

# 12. Frontend UI/UX design

Design the module using existing InsurePal design conventions.

Suggested navigation:

```text
Business
└── Placements
    ├── All Placements
    ├── Drafts
    ├── In Market
    ├── Accepted
    ├── Declined
    └── Bound

Documents
└── Broker’s Slips
    ├── Draft
    ├── Pending Review
    ├── Issued
    ├── Superseded
    └── Withdrawn
```

## Placement list page

Columns may include:

```text
Placement number
Insured
Class
Sum insured
Insurers approached
Current status
Created by
Created date
Actions
```

## Broker’s slip list page

Columns may include:

```text
Slip number
Placement number
Insured
Insurer
Class
Gross premium
Commission
Net premium
Version
Status
Issue date
Actions
```

## Broker’s slip detail page

Recommended sections:

```text
Overview
Risk Details
Financial Terms
Clauses
Insurer
Versions
Activity
Emails
Responses
Related Policy
```

## Creation form

Recommend either:

* a full-page stepper;
* or a multi-section form with sticky navigation.

Choose the approach that best fits InsurePal’s existing patterns.

## Preview

The preview should include:

* A4 page preview
* Zoom controls
* Page navigation
* Refresh preview
* Download draft
* Validation messages
* Submit for review
* Approve
* Issue

Do not build a Canva-style document editor.

Use structured forms and controlled templates.

---

# 13. PDF template design

Design a professional broker’s slip template inspired by the attached sample, but improved for modern digital use.

## Header

Include:

* Broker logo
* Broker legal name
* RC number
* NCRIB number
* Address
* Phone
* Email
* Website
* Tagline
* Horizontal divider

## Document identity

Include:

```text
BROKER’S SLIP
Slip Number
Placement Number
Version
Issue Date
Status
```

## Main body

Use a clean two-column label and value layout.

Possible sections:

```text
Insurer Details
Insured Details
Insurance Details
Risk Details
Coverage Period
Financial Summary
Clauses and Conditions
Approval and Signature
```

## Financial summary

Use a clear table:

| Description    |  Rate | Amount |
| -------------- | ----: | -----: |
| Sum Insured    |       |  ₦0.00 |
| Gross Premium  | 0.00% |  ₦0.00 |
| Commission     | 0.00% |  ₦0.00 |
| Fees and Taxes |       |  ₦0.00 |
| Net Premium    |       |  ₦0.00 |

## Footer

Include:

* authorised signatory;
* signature;
* company stamp;
* page number;
* directors or management text;
* NCRIB logo;
* QR verification code;
* document checksum or verification reference.

## Watermarks

Possible watermarks:

```text
DRAFT
PENDING APPROVAL
ISSUED
SUPERSEDED
WITHDRAWN
```

## Multi-page support

Support:

* first-page summary;
* risk schedules;
* vehicle schedules;
* property schedules;
* cargo schedules;
* clauses;
* warranties;
* exclusions;
* supporting schedules.

Do not compress long schedules into one page.

---

# 14. PDF generation strategy

Inspect the project’s current PDF system.

Compare:

## Dompdf

Advantages:

* simple Laravel integration;
* works for straightforward layouts;
* low infrastructure requirements.

Limitations:

* weaker CSS and page-break support;
* inconsistent complex layout rendering.

## Browsershot or Chromium

Advantages:

* stronger HTML and CSS rendering;
* better page-break handling;
* more accurate web-to-PDF output.

Limitations:

* requires Node and Chromium;
* more server configuration.

Recommend the best approach based on the current deployment environment.

Suggested Blade structure:

```text
resources/views/pdf/broker-slips/
    base.blade.php
    standard.blade.php
    motor.blade.php
    property.blade.php
    marine.blade.php
    burglary.blade.php
    schedules/
        vehicle-schedule.blade.php
        property-schedule.blade.php
        cargo-schedule.blade.php
        clauses.blade.php
```

Keep shared branding and page structure inside a base template.

---

# 15. Tenant branding

The Broker’s Slip must be tenant-specific.

Analyse or propose settings for:

```text
Legal company name
Trading name
Logo
RC number
NCRIB number
Address
Phone numbers
Email
Website
Tagline
Letterhead
Header image
Footer image
Watermark
NCRIB logo
Directors footer
Default claim payment condition
Default clauses
Authorised signatories
Signature images
Company stamp
```

Do not hard-code NETA information.

---

# 16. Signatory and signature security

Signature images are sensitive business assets.

Design permissions for:

```text
broker-slips.create
broker-slips.edit
broker-slips.review
broker-slips.approve
broker-slips.issue
broker-slips.sign
broker-slips.send
broker-slips.withdraw
broker-slips.view-versions
```

Users must not be able to use another staff member’s signature without permission.

Every issued document must record:

* prepared by;
* reviewed by;
* approved by;
* signed by;
* issue date;
* signature version;
* document checksum.

---

# 17. Document numbering

Design a configurable numbering format.

Examples:

```text
BS/2026/000001
NIB/BS/MOTOR/2026/000001
BS/{YEAR}/{SEQUENCE}
BS/{TENANT_CODE}/{YEAR}/{SEQUENCE}
```

The numbering system must be:

* tenant-scoped;
* unique;
* concurrency-safe;
* configurable;
* immutable after issuance.

Versions should be separate from the document number:

```text
Slip Number: BS/2026/000124
Version: 1
Version: 2
Version: 3
```

---

# 18. Versioning and immutability

Every issued slip must be immutable.

If changes are required:

1. create a new draft revision;
2. preserve the prior issued version;
3. update the version number;
4. regenerate the PDF;
5. mark the old version as superseded where appropriate.

Store a complete snapshot including:

```text
Customer details
Insurer details
Risk details
Financial details
Clauses
Branding
Signatory
Signature
Template version
PDF path
Checksum
```

Later changes to the customer, insurer, tenant branding or product must not silently alter previously issued PDFs.

---

# 19. Insurer response and negotiation

Design an insurer-response workflow.

Capture:

```text
Response status
Response date
Responding officer
Insurer reference
Offered rate
Offered premium
Offered commission
Participation percentage
Conditions
Counter-offer notes
Attachments
Recorded by
```

For a counter-offer, allow the broker to:

* accept;
* reject;
* revise the slip;
* send a new version;
* approach another insurer.

Preserve the full negotiation timeline.

---

# 20. Coinsurance and multiple insurers

Design support for:

* one insurer taking 100%;
* lead insurer;
* participating insurers;
* insurer shares;
* separate slips per insurer;
* shared placement;
* different rates;
* different commission rates;
* insurer-specific clauses;
* combined total participation validation.

Validate:

```text
Total accepted participation ≤ 100%
```

Where 100% placement is required, warn when accepted participation is below 100%.

Each insurer should receive only the information appropriate to its own placement terms where necessary.

---

# 21. Policy conversion

An accepted placement should be convertible into a policy without re-entering data.

Carry forward:

```text
Customer
Insured
Insurer
Policy class
Policy product
Risk items
Cover dates
Sum insured
Rate
Gross premium
Commission
Net premium
Clauses
Participation
Attachments
```

Define which accepted terms become authoritative during policy conversion.

Prevent accidental policy duplication.

---

# 22. Connection to financial and NAICOM reporting

The Broker’s Slip should provide source data for:

* Policy
* Debit note
* Premium receipt
* Commission
* Remittance
* NAICOM Form 7.2B
* NAICOM Form 7.2C

However, the Broker’s Slip itself must not be treated as proof of payment or remittance.

The financial modules must remain the source of truth for:

* premium received;
* premium remitted;
* commission received;
* VAT;
* outstanding balances.

---

# 23. Validation rules

Design validations with severity levels:

```text
Critical
Warning
Informational
```

Possible validations:

## General

* Tenant profile incomplete
* Missing broker logo
* Missing RC or NCRIB number
* Missing slip number
* Missing insurer
* Missing customer or insured
* Missing insurance class
* Missing period

## Dates

* End date before start date
* Invalid cover duration
* Issue date after cover expiry
* Missing inception date

## Risk

* Missing class-specific required field
* No risk items
* Risk item without value
* Risk item totals do not equal total sum insured

## Financial

* Missing currency
* Negative premium
* Invalid rate
* Commission above allowed limit
* Commission amount does not match rate
* Net premium does not reconcile
* Participation-adjusted premium does not reconcile

## Approval

* No reviewer
* No approver
* No authorised signatory
* User lacks signature permission

## Document

* Missing template
* Missing PDF
* Duplicate issued number
* Issued document edited without revision

For each validation specify:

| Code | Severity | Condition | Message | Resolution | Blocks issuance? |
|---|---|---|---|---:|

---

# 24. Audit and activity history

Track:

```text
Placement created
Insurer added
Slip generated
Slip edited
Calculation overridden
Submitted for review
Changes requested
Approved
Issued
Downloaded
Emailed
Insurer responded
Counter-offer recorded
New version created
Slip superseded
Slip withdrawn
Placement converted to policy
```

Every activity should include:

* user;
* timestamp;
* tenant;
* affected record;
* old values;
* new values;
* reason where required.

---

# 25. Email delivery

Design an email workflow for sending an issued Broker’s Slip.

Store:

```text
Recipient
CC
BCC
Subject
Message
Slip version
Attachment
Sent by
Sent at
Delivery status
Failure reason
```

Use the project’s existing mail and notification system.

Allow the user to select an insurer contact associated with the insurer record.

Do not allow drafts to be sent as issued documents without a visible draft watermark.

---

# 26. Required deliverables

Produce a structured planning document containing:

## A. Executive summary

Explain:

* current codebase readiness;
* major reusable modules;
* major gaps;
* recommended architecture;
* recommended implementation order.

## B. Existing codebase inventory

| Area | Existing implementation | Paths | Reusable? | Changes required |
| ---- | ----------------------- | ----- | --------: | ---------------- |

## C. Attached document analysis

For each PDF page describe:

* insurance class;
* fields;
* calculations;
* shared structure;
* class-specific structure;
* visual structure;
* weaknesses;
* recommended improvements.

## D. Field mapping matrix

| Broker’s Slip field | Existing source | Calculation | Gap | Recommendation |
| ------------------- | --------------- | ----------- | --- | -------------- |

## E. Recommended data model

For every table and field provide:

* purpose;
* type;
* relationship;
* index;
* tenant scope;
* validation;
* migration requirement.

Do not create migrations yet.

## F. Domain architecture

List proposed:

* models;
* enums;
* services;
* actions;
* queries;
* policies;
* jobs;
* events;
* notifications;
* PDF renderers.

## G. Workflow specification

Describe:

* creation;
* review;
* approval;
* issuance;
* sending;
* insurer response;
* revisions;
* policy conversion.

## H. Calculation specification

Provide formulas, rounding rules and override controls.

## I. UI/UX specification

Provide:

* routes;
* controllers;
* Inertia pages;
* components;
* forms;
* tables;
* previews;
* validation interfaces;
* approval screens.

## J. PDF design specification

Provide:

* page structure;
* Blade templates;
* styles;
* page-break rules;
* schedule handling;
* branding;
* signature;
* footer;
* QR verification.

## K. Permissions and security

Document all required permissions and tenant-isolation rules.

## L. Versioning and audit strategy

Explain immutable issued documents, snapshots, superseding and checksums.

## M. Testing plan

Include:

* unit tests;
* feature tests;
* tenant-isolation tests;
* calculation tests;
* PDF tests;
* approval tests;
* versioning tests;
* coinsurance tests;
* email tests.

## N. Phased implementation roadmap

For every phase provide:

* objective;
* backend work;
* frontend work;
* migrations;
* tests;
* dependencies;
* acceptance criteria;
* risks.

## O. Open questions

List all issues requiring confirmation from:

* insurance broker;
* accountant;
* compliance officer;
* product owner;
* existing code owner.

---

# 27. Recommended implementation phases

Assess and refine this suggested roadmap.

## Phase 1 — Codebase alignment

* Analyse existing quotes, policies and documents
* Identify reusable models and services
* Confirm placement architecture
* Define required fields and relationships

## Phase 2 — Placement foundation

* Placement
* Placement markets
* Insurer participation
* Placement statuses
* Source quote relationship

## Phase 3 — Broker’s Slip data entry

* Shared fields
* Dynamic class-specific fields
* Risk schedules
* Financial calculation
* Clause library

## Phase 4 — PDF generation

* Template system
* Tenant branding
* Signatory
* Watermark
* Multi-page schedules
* PDF preview

## Phase 5 — Review and approval

* Submission
* Change requests
* Approval
* Signature authorization
* Issuance

## Phase 6 — Versioning and audit

* Immutable snapshots
* PDF checksums
* Revisions
* Superseding
* Activity history

## Phase 7 — Insurer communication

* Email
* Insurer contacts
* Responses
* Counter-offers
* Attachments

## Phase 8 — Multiple insurers and coinsurance

* Lead insurer
* Participants
* Shares
* Insurer-specific slips
* Participation validation

## Phase 9 — Policy conversion

* Convert accepted placement
* Carry forward risks and financial terms
* Prevent duplication

## Phase 10 — Testing and rollout

* Automated tests
* Existing data migration
* Pilot tenant
* User acceptance testing
* Production deployment

---

# 28. Constraints

Follow these rules:

1. Do not implement code during this task.
2. Do not create migrations yet.
3. Inspect the codebase before recommending new structures.
4. Do not duplicate existing quote, policy or document systems.
5. Do not hard-code NETA branding.
6. Do not build a separate React page for every insurance product without justification.
7. Do not build a Canva-style editor.
8. Use structured fields and controlled templates.
9. Do not use floating-point arithmetic for money.
10. Do not allow issued documents to change silently.
11. Do not permit untracked financial overrides.
12. Do not allow cross-tenant access.
13. Do not allow unrestricted access to signature images.
14. Do not treat the slip as proof of payment.
15. Do not store only the latest document version.
16. Preserve every issued version.
17. Clearly identify assumptions.
18. Follow existing project conventions where sound.
19. Prefer incremental extension over a rewrite.
20. Report exact file paths reviewed.

---

# 29. Final architecture recommendation

At the end of the analysis, compare these options:

## Option A — Generate Broker’s Slips directly from quotes

Suitable for a basic, single-insurer process.

## Option B — Add a placement layer between quote and policy

Suitable for insurer selection, negotiation, versions, counter-offers, coinsurance and policy conversion.

## Option C — Generate slips directly from policies

Suitable only where the document is produced after policy creation.

Compare them using:

* implementation complexity;
* insurance workflow accuracy;
* negotiation support;
* multiple insurer support;
* document versioning;
* auditability;
* integration with existing modules;
* future scalability.

Choose one option based on the actual codebase.

The expected recommendation is likely Option B, but do not choose it without verifying the existing InsurePal architecture.

The final planning document must be detailed enough for another coding agent to implement the approved Broker’s Slip module without rediscovering the codebase or business workflow.
