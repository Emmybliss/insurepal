Here’s a **high-quality, production-grade prompt** you can use with AI tools (Lovable, Cursor, ChatGPT, etc.) to build this properly inside InsurePal.

This is not fluff — this is structured to get you real output.

---

## 🔧 FULL IMPLEMENTATION PROMPT

You are a senior fintech software architect and full-stack engineer.

I am building an insurance management platform called **InsurePal** using:

- Backend: Laravel (API-first)
- Frontend: React (TypeScript) with Inertia.js
- Database: MySQL

I want to implement a **complete payment and wallet system** inside the platform.

---

## 🎯 OBJECTIVE

Design and implement a scalable, secure system that includes:

1. Payment Integration
2. Wallet System (multi-tenant: brokers, agents, customers)
3. Transaction Ledger (audit-proof)
4. Commission Splitting Logic
5. Financial Reporting foundation

---

## 💳 PAYMENT INTEGRATION

Integrate with Paystack (primary) with clean abstraction for future providers.

### Features:

- Pay insurance premiums via:
    - Card
    - Bank transfer

- Payment status tracking:
    - pending, success, failed, reversed

- Webhook handling (VERY IMPORTANT)
- Automatic receipt generation (PDF-ready data structure)
- Link payments to:
    - policy_id
    - customer_id
    - broker_id

---

## 👛 WALLET SYSTEM DESIGN

Each user type has a wallet:

- Brokers
- Agents
- Customers (optional but recommended)

### Wallet fields:

- id
- user_id
- balance (decimal, high precision)
- currency (default NGN)
- status (active, frozen)

### Wallet Rules:

- NO direct balance edits
- All changes must come from transactions
- Wallet must always be derivable from ledger

---

## 📒 TRANSACTION LEDGER (CRITICAL)

Create a double-entry-like ledger system.

### Transactions table:

- id
- reference (unique)
- type (credit, debit)
- amount
- status (pending, completed, failed)
- source (payment, commission, withdrawal, refund)
- wallet_id
- related_entity_id (policy/payment)
- metadata (JSON)
- created_at

### Rules:

- Every wallet change MUST create a transaction
- Transactions must be immutable (no updates after success)
- Use references for traceability

---

## 💰 COMMISSION SPLITTING LOGIC

When a payment is successful:

Example:

- Customer pays ₦100,000 premium

Split automatically:

- Insurance Company → 70%
- Broker → 20%
- Platform (InsurePal) → 10%

### Requirements:

- Configurable commission structure (per policy or global)
- Store commission rules in DB
- Automatically trigger wallet credits:
    - Credit broker wallet
    - Credit platform wallet
    - Mark insurer payable (optional ledger entry)

---

## 🔁 PAYMENT FLOW

1. User initiates payment
2. Payment record created (pending)
3. Redirect to Paystack
4. Paystack webhook confirms payment
5. Verify transaction server-side
6. Update payment status → success
7. Trigger:
    - Wallet credits
    - Commission splitting
    - Ledger entries
    - Receipt generation

---

## 🧾 RECEIPTS & RECORDS

- Generate structured receipt data:
    - payer
    - policy
    - breakdown (premium, commission, fees)

- Store as JSON (PDF rendering later)

---

## 🔐 SECURITY REQUIREMENTS

- Verify ALL Paystack webhooks (signature validation)
- Prevent double-crediting (idempotency keys)
- Use database transactions for all financial operations
- Lock wallet rows during updates (avoid race conditions)

---

## 📊 OPTIONAL (BUT RECOMMENDED)

- Wallet withdrawal system (with approval flow)
- Transaction filters (date range, type, status)
- Admin financial dashboard
- Daily reconciliation job

---

## 🧱 OUTPUT REQUIRED

Provide:

1. Database schema (Laravel migrations)
2. Eloquent models + relationships
3. Service classes:
    - PaymentService
    - WalletService
    - CommissionService

4. Webhook controller (Paystack)
5. Example API endpoints
6. Frontend flow (React/Inertia)
7. Pseudocode for:
    - Payment success handling
    - Commission distribution

8. Best practices for scaling this system

---

## ⚠️ IMPORTANT

- This is a FINANCIAL system — correctness > cleverness
- Prioritize data integrity, traceability, and auditability
- Avoid shortcuts like directly updating wallet balances
- Design for future expansion (multi-currency, multiple payment providers)

---

Build this like a production fintech system, not a prototype.

---
