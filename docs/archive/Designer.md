You are building a **Designer page/component** for a multi-tenant insurance SaaS (Insure Pal).  
The Designer will handle **all templates**: Certificates, Invoices, Debit Notes, Credit Notes, and Receipts.  
The goal is to allow tenants to visually design and save templates (similar to a simplified Canva or Figma experience), then render them dynamically with policy/customer data.

### 🛠️ Requirements

1. **Frontend Tech**
    - Use **React + TypeScript + TailwindCSS**.
    - Use **React Konva (Konva.js)** for the design canvas (best balance of flexibility + performance).
    - Use **shadcn/ui** for side panels, tabs, and property editors.
    - Provide a **JSON schema** representation of the design so templates can be saved and reused later.
    - Drag/drop, resize, align, and edit text/images/shapes on the canvas.
    - Allow placeholders (merge fields) like `{{customer_name}}`, `{{policy_number}}`, `{{amount}}`.
    - Left/Right panel layout:
        - **Left**: list of available elements (Text, Rect, Circle, Image, Placeholder fields).
        - **Center**: the Konva canvas (WYSIWYG editor).
        - **Right**: property inspector (edit font, color, position, alignment, size, placeholder binding).
    - Provide **Preview Mode**: renders the final design with sample data.

2. **Backend Tech (Laravel)**
    - Store templates in `document_templates` table:
        - `id`, `name`, `type` (certificate, invoice, receipt, etc.), `design_json`, `tenant_id` e.t.c
    - Add API endpoints:
        - `POST /templates` → create template with `design_json`.
        - `PUT /templates/{id}` → update template.
        - `GET /templates/{id}` → fetch template (JSON config).
    - When generating a document, replace placeholders in `design_json` with actual data, then render to:
        - **PDF** (using backend service like DomPDF or Puppeteer).
        - **HTML preview** (for Inertia/React).

3. **Core Functionality**
    - CRUD templates.
    - Load an existing template into the Designer.
    - Save template JSON config on update.
    - Render previews both in-browser (React Konva) and as static PDFs from backend.
    - Support multi-tenant isolation (each tenant only sees their templates).
    - Extensible to new doc types in the future.

4. **Extra Goals**
    - Ensure snapping + grid lines for cleaner alignment.
    - Undo/redo history.
    - Zoom in/out canvas.
    - Export template JSON schema for versioning.
      <!-- - Later: allow template cloning between tenants. -->

### 🔑 Deliverables

- `Designer.tsx` React component (React Konva canvas + UI panels).
- `useDesignerStore.ts` Zustand/Redux store to manage elements on canvas.
- Backend Laravel controller (`TemplateController`) for saving/loading templates.
- Example migration for `document_templates`.
- Preview component that can load JSON and render a final document.
