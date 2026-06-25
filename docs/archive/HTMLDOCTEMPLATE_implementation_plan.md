# Implement Backend HTML Template Generation for Financial Notes

This plan outlines the steps to introduce a backend-generated HTML/Blade-based PDF template system alongside the existing Konva.js visual designer. This dual-mode setup ensures that users have reliable, professional default layouts for financial documents while retaining the ability to create highly custom designs using the visual editor.

## User Review Required

> [!WARNING]
> **PDF Library Selection**
> The codebase currently uses `Barryvdh\DomPDF\Facade\Pdf` for some preview downloads. We will use this library for the new `HtmlTemplatePdfGenerator` as well. Please confirm if this is the desired PDF generation library, or if you prefer an alternative like Snappy (wkhtmltopdf) or Browsershot (Puppeteer) which have different server dependencies.

> [!IMPORTANT]
> **Data Structure Changes**
> We are adding `mode` and `html_template_key` to the `document_templates` table via a new migration, rather than recreating it.

## Open Questions

**Resolved:**
1. **Seeding Strategy**: Auto-assign these new HTML templates to existing tenants and keep them as system default.
2. **Custom CSS Support**: Support custom CSS per tenant in the future, but not as fully unrestricted CSS now. We will use predefined Blade styles as the stable base, allow dynamic tenant branding (logo, header image, footer image, company colors, address, phone, email, and website). We will add a nullable `css_overrides` JSON field for future extension. Arbitrary raw CSS injection is not allowed for now.

## Proposed Changes

---

### Database & Models

#### [NEW] `database/migrations/[timestamp]_add_mode_and_html_key_to_document_templates_table.php`
- Add `mode` string column (defaulting to `'designer'`).
- Add `html_template_key` string column (nullable).
- Add `slug` string column (nullable) if not already present.
- Add `template_config` json column (nullable) for specific HTML template settings.

#### [MODIFY] `app/Models/DocumentTemplate.php`
- Add new columns to `$fillable`.
- Add scopes `scopeHtmlMode($query)` and `scopeDesignerMode($query)`.
- Update `casts` for `template_config`.

---

### Services & Configuration

#### [NEW] `config/document-templates.php`
- Registry defining available HTML templates (e.g., `debit_note.classic`, `receipt.modern`).
- Each entry will contain label, type, view_path, and supported placeholders.

#### [NEW] `app/Services/Documents/TenantBrandingService.php`
- Helper service to resolve tenant branding (logo, signature, stamp, company details).
- Includes logic to convert stored images (local/S3) to Base64 to prevent broken image paths in generated PDFs.

#### [NEW] `app/Services/Documents/FinancialNotePayloadMapper.php`
- Service to extract and map data from `DebitNote`, `CreditNote`, `Invoice`, etc., into a normalized flat array for Blade templates, formatting dates and currencies appropriately.

#### [NEW] `app/Services/Documents/HtmlTemplatePdfGenerator.php`
- Core service that accepts the mapped payload, fetches the appropriate Blade view based on `html_template_key`, injects branding via `TenantBrandingService`, and generates the PDF using DomPDF.
- Stores the PDF in the appropriate tenant vault location and returns the file path.

---

### Blade Templates

#### [NEW] `resources/views/pdf/templates/layouts/financial-note.blade.php`
- Base layout containing full-width stretching logic for header/footer, typography settings, and safe print CSS.

#### [NEW] `resources/views/pdf/templates/debit-notes/classic.blade.php`
- Implementation of the classic debit note design.
#### [NEW] `resources/views/pdf/templates/credit-notes/classic.blade.php`
- Implementation of the classic credit note design.
#### [NEW] `resources/views/pdf/templates/invoices/classic.blade.php`
- Implementation of the classic invoice design.
#### [NEW] `resources/views/pdf/templates/receipts/classic.blade.php`
- Implementation of the classic receipt design.

---

### Controllers

#### [MODIFY] `app/Http/Controllers/DebitNoteController.php` (and equivalent financial controllers)
- Update `generateDebitNote` (and similar methods) to branch logic based on `$template->mode`:
  - If `mode === 'designer'`, keep the existing validation requiring `debit_note_pdf`.
  - If `mode === 'html'`, bypass the PDF upload requirement, generate the PDF server-side using `HtmlTemplatePdfGenerator`, and update the record.

#### [NEW] `app/Http/Controllers/DocumentTemplatePreviewController.php`
- Controller to handle live HTML preview in the browser for the newly registered HTML templates.

#### [MODIFY] `app/Http/Controllers/DocumentTemplateController.php`
- Update validation in `store` and `update` to allow `mode` and `html_template_key`.

---

### Frontend (React/Inertia)

#### [MODIFY] `resources/js/pages/debit-notes/GenerateDebitNote.tsx` (and equivalents)
- Check `selectedTemplate.mode`.
- If `mode === 'html'`, hide the Konva canvas and display an iframe pointing to the backend HTML preview route.
- Modify `handleGenerate` so that if `mode === 'html'`, it submits the form without capturing a canvas blob.

#### [MODIFY] `resources/js/pages/DocumentToolkit/Templates/Form.tsx` (or equivalent template creation form)
- Add a toggle/select for Template Mode: "Visual Designer" or "Backend HTML Template".
- If "HTML" is selected, show a dropdown populated by `config('document-templates')` to select the specific layout, and hide the Konva designer.

---

### Seeder

#### [NEW] `database/seeders/HtmlDocumentTemplatesSeeder.php`
- Seeds the system default HTML templates for all financial document types so they are available immediately.

---

## Verification Plan

### Automated Tests
- Run `php artisan test --filter DocumentTemplate` to ensure template creation with the new fields works.
- Write/Run unit tests for `HtmlTemplatePdfGenerator` and `FinancialNotePayloadMapper` to verify payload conversion and PDF instantiation.

### Manual Verification
- Create a new template and set its mode to HTML.
- Generate a Debit Note from the UI.
  - Verify that the Konva generation bypasses appropriately and the request succeeds.
  - Download the generated PDF and confirm the Blade layout renders correctly with the tenant logo.
- Generate a Debit Note using a legacy Visual Designer template to ensure the existing Konva workflow remains unbroken.
