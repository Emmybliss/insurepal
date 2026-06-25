I currently have a Laravel + Inertia React TypeScript app with Konva.js canvas-based document/template design already running.

I want you to integrate a second document generation option: BACKEND HTML TEMPLATE GENERATION.

Goal:
Keep the existing Konva.js designer intact, but add a reliable backend-generated HTML/PDF template mode for financial notes such as Debit Notes, Credit Notes, Receipts, Invoices, and Policy Schedules and certificates.

Core requirement:
There should now be two template modes:

1. designer

- Existing Konva.js canvas/template system.
- Do not break or remove it.

2. html

- Backend Blade/HTML-based templates.
- Tenant header and footer images should be loaded dynamically from the database.
- Header image should stretch to full document width.
- Footer image should stretch to full document width.
- Financial note body should be generated from structured Blade templates with dynamic placeholders.
- The generated PDF should match the backend HTML layout, not depend on canvas screenshots.

Implement the system cleanly and production-ready.

Required backend changes:

1. Add template mode support
   Update the document_templates table/model if needed to support:

- type: debit_note, credit_note, receipt, invoice, policy_schedule, certificate, etc.
- mode: designer or html
- name
- slug
- is_default
- tenant_id
- html_template_key or view_path
- config JSON field for template settings
- status: active/inactive

If migration already exists, add a safe migration instead of recreating the table.

2. Create backend HTML template registry
   Create a service or config file that registers available HTML templates.

Example:

config/document-templates.php

It should define templates like:

- debit_note.classic
- debit_note.modern
- credit_note.classic
- receipt.classic
- policy_schedule.classic

Each item should include:

- label
- type
- view path
- preview image optional
- supported placeholders

3. Create Blade templates
   Create Blade views for financial note templates.

Example structure:

resources/views/pdf/templates/debit-notes/classic.blade.php
resources/views/pdf/templates/debit-notes/modern.blade.php
resources/views/pdf/templates/credit-notes/classic.blade.php
resources/views/pdf/templates/receipts/classic.blade.php

Each Blade template should:

- include tenant header image if available
- include tenant footer image if available
- stretch header/footer to full page width
- include proper print/PDF CSS
- avoid broken image paths by using absolute server paths or base64 conversion where needed
- render structured note data
- support currency formatting
- support date formatting
- avoid overflowing tables
- be clean, professional, and insurance/finance suitable

4. Tenant branding helper
   Create a helper/service that resolves:

- tenant header image URL/path
- tenant footer image URL/path
- tenant logo
- company name
- address
- phone
- email
- website

It should support local storage and future S3-compatible storage using Laravel Storage.

Do not hardcode public paths.

5. PDF generation service
   Create a service like:

app/Services/Documents/HtmlTemplatePdfGenerator.php

It should accept:

- tenant
- template
- document type
- payload data
- output mode: preview/download/store

It should:

- resolve correct Blade view from template registry
- inject tenant branding
- inject document payload
- generate PDF using the existing PDF library in the app if available
- if multiple PDF libraries exist, detect current usage and integrate consistently
- store generated PDFs in the existing document vault/storage system if available
- return file path, URL, or streamed download depending on use case

Important:
Do not replace current Konva generation service.
Create a parallel backend HTML generator and route generation through the correct generator based on template mode.

6. Controller logic
   Update the relevant financial note generation controllers.

When generating a debit note or credit note:

- find the tenant’s selected/default template for that document type
- if mode is designer, use existing Konva/canvas generator
- if mode is html, use HtmlTemplatePdfGenerator
- if no tenant template exists, fall back to a system default HTML template

The decision logic should be clean and centralized, not scattered everywhere.

7. Template selection UI
   Update the Inertia React TypeScript UI to allow tenants/admins to:

- choose document type
- choose template mode: HTML Template or Designer Template
- select one of the available HTML templates
- preview HTML template
- set template as default
- activate/deactivate template

Do not remove the current designer UI.
Add an option such as:

“Use Backend HTML Template”
“Use Visual Designer Template”

For HTML templates, show cards like:

- Classic Debit Note
- Modern Debit Note
- Minimal Debit Note

8. Preview support
   Add preview route/controller action for backend HTML templates.

The preview should render either:

- HTML preview in browser, or
- generated PDF preview

Use mock/sample financial note data when no real document is provided.

9. Placeholder/data mapping
   Create a clean payload mapper for financial notes.

Example service:

app/Services/Documents/FinancialNotePayloadMapper.php

It should map models into template-safe data:

- note number
- issue date
- due date
- insured name
- customer name
- customer address
- policy number
- class of business
- period of insurance
- sum insured
- gross premium
- commission
- net premium
- fees
- VAT
- total payable
- payment status
- tenant details
- prepared by
- authorized signature if available

Blade templates should not contain complex business logic.

10. Database/default seeding
    Add seeders for system default HTML templates.

Seed at least:

- Classic Debit Note
- Modern Debit Note
- Classic Credit Note
- Classic Receipt
- Classic Policy Schedule

System templates should be reusable by all tenants.
Tenant-specific selected defaults should reference/copy them cleanly.

11. Keep compatibility
    Do not break:

- existing Konva templates
- existing generated PDFs
- existing saved document settings
- current header/footer upload system
- document vault
- financial note generation routes
- tenant isolation
- authorization policies

12. Security and validation
    Ensure:

- tenants can only manage their own templates
- system templates are read-only unless super admin
- no arbitrary Blade view path injection
- only registered template keys can be used
- uploaded images are validated
- document generation respects tenant ownership

13. Expected UX flow
    Tenant goes to Document Templates settings.

They can choose:

Debit Note Template

- Backend HTML Template
    - Classic
    - Modern
    - Minimal
- Visual Designer Template
    - existing Konva templates

They set one as default.

When a debit note is generated, the system automatically uses the default selected template mode.

14. Coding style
    Follow the current project structure and conventions.
    Use Laravel service classes, Form Requests where appropriate, policies where appropriate, clean controllers, and typed React components.
    Keep code modular and maintainable.

Before coding:

- inspect the current document template models, migrations, controllers, services, PDF generation flow, routes, and React pages
- identify existing naming conventions
- reuse existing storage/document vault patterns
- do not duplicate logic unnecessarily

After coding:

- run relevant tests or explain if no tests exist
- run PHP/Laravel static checks if available
- ensure TypeScript builds
- provide a summary of changed files
- mention any follow-up migrations or commands needed

Important implementation principle:
HTML template generation is now the reliable default for financial notes.
Konva designer remains available for advanced/custom visual layouts.
