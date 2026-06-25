 Build Public API + Embeddable Insurance Widget (with Paystack Integration) for Insure Pal SaaS
You are designing this for a Laravel + Inertia + React TypeScript SaaS, multi-tenant (super_admin → underwriter → broker → customer).
Objective:
Extend Insure Pal into a full public API plus embeddable widget that any client can plug into their website to sell insurance products, create customers, issue policies, and process payments using Paystack.

Key Requirements
1. Authentication

Implement API authentication using:

API Keys per tenant

Optional OAuth 2.0 (future-proof)

Endpoints must check:

X-Tenant-Key

X-API-KEY

Rate limiting per tenant.

2. API Endpoints
Customer Endpoints

POST /api/v1/customers – create customer

GET /api/v1/customers/{id}

GET /api/v1/customers – list with filters

Policy Product Endpoints

GET /api/v1/products – list tenant's available insurance products

GET /api/v1/products/{id} – details, pricing, required fields

Policy Issuance Endpoints

POST /api/v1/policies/quote

Returns premium, fees, taxes

POST /api/v1/policies/issue

Issues policy after successful Paystack payment verification

Creates debit note & receipts automatically

Webhook Handling

/api/v1/payments/webhook/paystack

Must verify signature

Update policy status after payment

Generate PDF receipt automatically

3. Paystack Payment Integration (CRITICAL)
Flow

Widget/API calls:
POST /api/v1/payments/initiate
Body:

amount

email

policy_product_id

metadata (customer_id, tenant_id, product_id)

Insure Pal backend creates a Paystack transaction using secret key.

API returns:

authorization_url

reference

After payment:

Paystack sends webhook to Insure Pal

Insure Pal verifies payment

On success:

Issue policy

Generate receipt

Notify tenant/admin

Widget redirects user to “Payment Successful — Policy Issued” page.

4. Embeddable Widget (Script Tag)
Script embed

Clients should paste in their website:

<script src="https://cdn.insurepal.app/widget.js"
        data-tenant="TENANT_ID"
        data-product="PRODUCT_ID">
</script>

Widget Features

Product selection

Customer details form

Dynamic premium calculation

Paystack inline payment popup

Policy issuance confirmation screen

Beautiful UI (React + Tailwind using build tools)

Widget Security

Never expose secret keys

All calculations validated server-side

Widget communicates via secure API calls

5. Tenant Dashboard Additions

Inside Insure Pal:

New pages

API Keys page (generate, rotate, revoke keys)

Website Integration Guide

Widget customization:

Primary color

Logo

Header text

Allowed domains

6. Multi-Client Logic

Each tenant gets:

Their own API key

Their own Paystack secret/public keys

Their own product catalog

Their own embedded widget instances

Their own policy prefix & receipt numbering

7. Security

Domain whitelisting

API throttling

Signed webhook verification

Strict CORS rules per tenant

Validation for all form input

8. Documentation

Generate a full API reference:

OpenAPI/Swagger

Code samples (JS, Laravel, Wordpress, Python, Node)

Widget setup guide

Webhook testing samples

DEVELOPMENT PRIORITIES
must optimize for:

SaaS scalability

strict tenant separation

preserving InsurePal as the single source of truth

making integration simple but controlled

preventing bypass of subscription logic

protecting recurring revenue model

Deliverables

Complete API controllers

Middleware for tenant auth

Paystack integration service

Webhook controller

React-based widget

CDN build pipeline (Vite)

Testing suite

Full documentation

Migration scripts