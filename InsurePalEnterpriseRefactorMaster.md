# InsurePal Enterprise Refactor – Master Architecture Prompt

You are acting as the Lead Software Architect and Senior Full Stack Engineer for InsurePal, an Enterprise Insurance Operating System.

## Objective

Perform a complete architectural refactor of the existing Laravel + Inertia React codebase into a modern API-first Insurance Operating System that is scalable, AI-native, mobile-ready, multi-tenant, and enterprise-grade.

This is NOT a rewrite from scratch.

Reuse existing business logic, database schema, calculations, workflows, and insurance rules whenever possible, but refactor the architecture to achieve clean separation of concerns and long-term maintainability.

The final product must become an Insurance Operating System with an Embedded AI Copilot rather than simply an insurance management application.

---

# Core Architectural Principles

Follow these principles throughout the refactor:

* Domain Driven Design (DDD)
* SOLID Principles
* Clean Architecture
* Service Layer Pattern
* Repository Pattern where appropriate
* API First Design
* Event Driven Architecture where beneficial
* Multi-Tenant by Design
* AI-Ready Architecture
* Mobile First API
* Testable Components
* Strict Type Safety
* Reusable Business Logic

Business rules must exist only once.

No duplicated logic between Web, Mobile or AI.

---

# PHASE 1 — API First Foundation

Remove business logic from:

* Controllers
* React Components
* Inertia Pages

Move logic into dedicated Application Services.

Examples:

Finance

* CreateDebitNoteService
* CreateCreditNoteService
* GenerateReceiptService
* GenerateInvoiceService
* ReverseTransactionService

Policies

* IssuePolicyService
* RenewPolicyService
* CancelPolicyService
* ApprovePolicyService
* GenerateCertificateService

Claims

* RegisterClaimService
* ApproveClaimService
* SettleClaimService

Customers

* CreateCustomerService
* UpdateCustomerService

Reports

* GenerateNAICOMReportService
* GenerateCommissionReportService
* GenerateProductionReportService

Notifications

* NotificationService
* EmailService
* SMSService

Every business action must execute through Services.

Controllers become thin orchestration layers only.

---

# Build REST API

Introduce

/api/v1/

with proper versioning.

Implement:

* API Resources
* Form Requests
* Policies
* Authorization
* Validation
* Pagination
* Filtering
* Sorting
* Search
* Rate Limiting

Standardize every response.

No business logic inside controllers.

---

# Separate Inertia

Extract every Inertia-specific concern.

No service should know Inertia exists.

Business layer must become UI-independent.

The current Inertia application should continue working during migration until feature parity is achieved.

---

# PHASE 2 — Modern Frontend

Build a completely separate frontend using Next.js (App Router) with TypeScript.

Requirements:

* Consume only Laravel REST APIs
* No direct database access
* No duplicated business logic
* Authentication via Sanctum
* TanStack Query
* Zustand for client state
* Server Components where appropriate
* Tailwind CSS
* shadcn/ui
* Responsive Design
* Dark Mode
* PWA Support

Modules:

Dashboard

Customers

Policies

Finance

Claims

Reports

Analytics

Settings

Notifications

User Management

Tenant Management

Email

AI Copilot

Every page must consume APIs only.

---

# PHASE 3 — Embedded AI Copilot

InsurePal includes a built-in conversational AI Copilot.

The AI is not merely a chatbot.

It is a secure operational assistant capable of executing insurance workflows through natural language.

The AI interface must resemble familiar conversational applications while remaining enterprise-focused.

Users should feel as if they are chatting with an experienced insurance operations officer.

Hybrid User Experience

Every operation should be achievable in two ways.

Example:

Traditional

Finance → Debit Notes → New Debit Note

Conversational

"Create a debit note for ABC Manufacturing for ₦450,000 and email it after approval."

Both paths execute the same backend services.

Conversational Workflow

The AI should:

Understand natural language.
Ask follow-up questions when information is missing.
Remember conversation context.
Explain planned actions.
Request approval for high-risk operations.
Execute approved actions through backend services.
Present results conversationally while also opening the corresponding UI page when appropriate.

Example:

User:

"Generate a debit note for ABC Manufacturing."

AI:

"I found ABC Manufacturing.

The premium amount is missing.

What premium should I use?"

AI Workspace

The AI interface should include:

Conversation history

Suggested actions

Quick prompts

Voice input

File upload

Drag-and-drop documents

Approval cards

Action summaries

Recent activities

Notifications

The AI should coexist with traditional navigation—not replace it.

AI Internal Architecture

Create:

AI Gateway

Intent Detection

Conversation Manager

Context Manager

Prompt Manager

Tool Registry

Execution Engine

Approval Workflow

Audit Logger

Permission Manager

AI Tools

The AI must never manipulate database tables directly.

Instead, expose internal tools such as:

searchCustomer()

searchPolicy()

issuePolicy()

createDebitNote()

createCreditNote()

registerClaim()

generateReceipt()

generateCertificate()

generatePDF()

generateExcel()

generateNAICOMReport()

calculatePremium()

calculateCommission()

renewPolicy()

sendEmail()

scheduleReminder()

Every tool invokes existing application services.

Tenant Awareness

The AI automatically understands:

Tenant

Company Branding

Logo

Letterhead

Header

Footer

Authorized Signatories

Branch

Currency

Policy Number Format

Document Number Format

Commission Rules

VAT Rules

NAICOM Requirements

Broker Rules

Underwriter Rules

Permissions

User Role

Conversation Context

Policy History

Customer History

The AI must never access data outside the authenticated tenant.

AI Safety

Every AI action must be:

Validated

Authorized

Tenant-scoped

Audited

Permission-checked

Logged

High-risk actions require explicit user approval.

The AI must never execute arbitrary SQL or bypass business rules.

The AI should ask follow-up questions whenever information is missing.

---

# PHASE 4 — External Email Platform

Create a complete Email module similar to Outlook.

Support plug-and-play integration with:

Gmail

Microsoft 365

Exchange

IMAP

SMTP

POP3 (optional)

Custom Webmail

Each tenant can connect multiple mailboxes.

Features:

Inbox

Sent

Drafts

Trash

Spam

Folders

Search

Attachments

Threaded Conversations

Reply

Reply All

Forward

Scheduling

Signatures

Templates

Labels

Read Receipts

Notifications

Background Synchronization

Email Queue

OAuth where supported.

Encrypted credential storage.

Automatic synchronization.

---

# AI Email Assistant

The AI must understand every connected mailbox.

Examples:

"Summarize today's emails."

"Reply professionally."

"Find every email mentioning renewal."

"Draft a quote response."

"Generate a debit note from this email."

"Convert this email into a customer."

"Create a claim from the attached PDF."

The AI should extract structured information from:

Emails

PDFs

Word documents

Excel

Images

Scanned insurance documents

and automatically suggest workflows.

---

# Mobile Ready

The API must be fully reusable for:

React Native

Desktop

Future Partner Integrations

Third-party APIs

Everything must work without modifying business logic.

---

# Multi-Tenant

Every service must automatically respect tenant boundaries.

AI must never access another tenant's data.

Every AI context is tenant-aware.

Every query is tenant-scoped.

---

# Security

Implement:

Role Based Access Control

Permission Checks

Audit Logs

Action History

Rate Limiting

Encrypted Secrets

Secure API Tokens

Approval Workflows

No AI action may bypass business rules.

---

# Expected Deliverables

Before modifying code:

1. Analyze the complete codebase.
2. Produce a dependency graph.
3. Identify tightly coupled components.
4. Produce a migration roadmap.
5. Explain risks.
6. Refactor incrementally without breaking existing functionality.
7. After each module, verify feature parity with the current implementation before proceeding.

The goal is to evolve InsurePal into a scalable, enterprise-grade Insurance Operating System whose backend serves Web, Mobile, AI Copilot, and future integrations from a single, reusable domain layer.
