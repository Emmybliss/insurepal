Claude Prompt — Claims Management System (Multi-Tenant)

Goal:
Implement a comprehensive claims management module that enables Underwriters, Brokers, and Customers to file, process, track, and manage insurance claims according to their tenant roles and relationships — with full audit trails, document uploads, notifications, and reporting.

🏗️ Stack Context

Backend: Laravel 12.x, PHP 8.2+, MySQL

Frontend: Inertia.js + React (TypeScript), Shadcn UI, TailwindCSS

Auth: Laravel Breeze + Socialite (Google & Microsoft)

Multi-tenancy: Spatie + custom tenant context middleware

Roles: Super Admin | Underwriter | Broker | Customer

PDF/Docs: laravel-dompdf + react-pdf

Notifications: Laravel Echo + Pusher/Soketi + Email fallback

Payments: Paystack for billing

⚙️ Core Functionality

1. Claim Creation & Submission

Customers and Brokers can initiate claims tied to existing policies.

Claims must reference a policy_id, insured party, and incident details.

File uploads: allow multiple attachments (photos, reports, PDFs, etc.).

Auto-generate claim reference numbers (e.g. CLM-2025-00001).

Claims default to status = Pending Review.

Allow claim drafts before submission.

2. Claim Workflow & Processing

Underwriters can:

View all claims submitted under their policies or their associated brokers’ customers.

Assign internal reviewers or assessors.

Approve, reject, or request additional info from the claimant.

Record approval notes and attach claim settlement documents.

Brokers can:

Submit claims on behalf of their customers.

View claim progress and communicate with Underwriters through internal messaging threads.

Upload supplementary documents during “Review Requested” stage.

Customers can:

Submit personal claims.

View claim status updates, upload additional files, and receive notifications.

3. Claim Status Lifecycle

Use a consistent state machine:

Draft → Submitted → Under Review → Approved → Rejected → Settled → Closed

Each transition should trigger:

Activity log entry (who changed what and when)

Notification (to relevant party)

Optional email alert

4. Claim Messaging & Notes

Threaded comments under each claim (similar to inbox module)

Mentions support (@username) for collaboration

Visible only to the related tenants (e.g. Broker ↔ Underwriter, Customer ↔ Broker)

Attach files to messages

5. Documents & Evidence

Secure upload and storage of supporting documents

Allowed file types: pdf, jpg, png, docx

Claims have a “Documents” tab showing all uploaded items with metadata (uploader, date, type)

Generate claim summary PDF including claim details, decision notes, and attachments list

6. Claim Analytics & Reports

Underwriter dashboard:

Claims by status (bar chart)

Average claim processing time

Total claims amount paid (sum)

Claims by policy type/class

Broker dashboard:

Claims submitted on behalf of customers

Claims approved vs rejected ratio

Claims still pending

Super Admin:

System-wide claims report (export to PDF/Excel)

Claims volume per tenant

Outstanding claims and payout summaries

7. Notifications

Real-time updates for all major actions:

New claim submission

Status update

Additional info requested

Claim approved or rejected

Integrate Laravel Notifications + Echo for in-app + email delivery

8. Permissions & Access Rules

Super Admin: View all claims across tenants (read-only)

Underwriter: Manage and process all claims linked to its policies or associated brokers

Broker: Submit/view claims for own customers

Customer: Submit and track personal claims only

Enforce via Spatie roles + policy() gates

9. Claim Schema (Suggested)

claims

id

tenant_id

policy_id

customer_id

claim_reference

claim_type (e.g. accident, theft, damage, etc.)

incident_date

incident_description

claim_amount

status (enum: draft, submitted, under_review, approved, rejected, settled, closed)

decision_notes

reviewer_id (user who processed)

approved_amount

metadata (json)

timestamps

claim_documents

id

claim_id

uploaded_by

file_path

file_name

file_type

uploaded_at

claim_comments

id

claim_id

author_id

body

attachments (json nullable)

created_at

🧩 Integration Points

Connect to internal messaging system for notifications and claim discussion

Integrate claim documents with Document Management System

Include claim summaries in Reporting Module (PDF/Excel export)

Trigger AI Risk/Fraud Detection (optional later phase)

🧠 Optional AI Add-ons (Future)

AI Risk Assessor: automatically analyze uploaded documents and flag inconsistencies.

AI Summary Generator: summarize claim documents and history.

Fraud Probability Score: using rule-based or ML heuristics.

✅ Deliverables

Claim model, migration, seeder

ClaimController (CRUD + Workflow transitions)

ClaimDocument and ClaimComment models

ClaimPolicy for access control

Claim dashboard UI (per tenant type)

Notification + activity logging system integration

PDF export (Claim Summary)

API endpoints for mobile app use later
