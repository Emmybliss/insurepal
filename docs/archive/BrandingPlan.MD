## **TASK: Build a PDF Visual Overlay Composer module inside an existing SaaS (InsurePal)**

You are working inside an **existing multi-tenant SaaS application**.

### **Tech Stack**

- Backend: Laravel 12.x, PHP 8.2+
- Frontend: Inertia.js + React (TypeScript)
- UI: TailwindCSS + Shadcn UI
- Storage: Local + S3-compatible
- Auth: Laravel Breeze
- Permissions: Spatie Laravel Permission

---

# 🎯 **GOAL**

Implement a **PDF Visual Overlay Composer** that allows users to:

1. Upload an existing PDF (e.g. exported from MS Word)
2. Visually preview the PDF
3. Overlay elements:
    - Signature (draggable)
    - Stamp (draggable)
    - Letterhead (fixed top)
    - Footer (fixed bottom)
    - Watermark (centered, non-draggable)

4. Drag and position overlays visually
5. Generate a new PDF with overlays applied
6. Save result to **Document Vault** or download locally

---

# ⚠️ **CRITICAL RULES**

- DO NOT attempt to edit PDF text
- DO NOT rebuild PDFs from scratch
- ALWAYS preserve original uploaded file
- Overlays must be applied as a rendering layer
- System must be multi-tenant safe

---

# 🧩 **MODULE STRUCTURE**

---

## **1. DATABASE DESIGN**

Create the following tables:

### `documents`

- id
- tenant_id
- user_id
- name
- original_file_path
- processed_file_path (nullable)
- status (draft | processed)
- metadata (json)
- timestamps

---

### `document_overlays`

- id
- document_id
- type (signature | stamp | watermark | header | footer)
- page_number (nullable for global)
- position_x
- position_y
- width
- height
- rotation
- content (image path or text)
- settings (json)
- timestamps

---

### `document_assets`

- id
- tenant_id
- type (signature | stamp | letterhead | footer)
- name
- file_path
- timestamps

---

## **2. BACKEND (Laravel)**

---

### Controllers

#### `DocumentController`

- upload()
- index()
- show()
- delete()

#### `OverlayController`

- store()
- update()
- delete()

#### `DocumentProcessingController`

- generateFinalPdf()

---

### Services

#### `PdfOverlayService`

Responsible for:

- loading original PDF
- applying overlays
- generating final PDF

Use:

- `pdf-lib` (Node bridge OR frontend export)
  OR
- `setasign/fpdi` (fallback backend option)

---

### Storage

- Store original and processed separately

```
/storage/app/tenants/{tenant_id}/documents/
```

---

## **3. FRONTEND (React + Inertia)**

---

### Pages

#### `Documents/Index.tsx`

- list uploaded documents

#### `Documents/Upload.tsx`

- upload PDF

#### `Documents/Editor.tsx` ⭐ (CORE FEATURE)

---

## **4. PDF EDITOR UI (IMPORTANT)**

Use:

- `pdfjs-dist` → render PDF pages
- `react-rnd` or `dnd-kit` → drag/resize overlays

---

### Editor Layout

```
[Toolbar]
- Add Signature
- Add Stamp
- Toggle Watermark
- Toggle Header/Footer
- Save
- Generate PDF

[Canvas]
- Render PDF pages
- Overlay draggable elements
```

---

## **5. OVERLAY SYSTEM**

Each overlay object:

```ts
type Overlay = {
    id: string;
    type: 'signature' | 'stamp' | 'watermark' | 'header' | 'footer';
    page: number | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    content: string;
};
```

---

### Behavior Rules

#### Signature & Stamp

- draggable
- resizable
- assigned to specific page

#### Header/Footer

- fixed position
- repeated on all pages

#### Watermark

- centered
- low opacity
- rotated (e.g. -30deg)
- applied globally

---

## **6. EXPORT / PDF GENERATION**

---

### Preferred Approach (Frontend-first)

Use:

- `pdf-lib`

Steps:

1. Load original PDF
2. Loop through pages
3. Apply overlays:
    - watermark
    - header/footer
    - signature/stamp

4. Export as new PDF
5. Send to backend for storage

---

### Alternative (Backend fallback)

Use:

- `FPDI`

---

## **7. DOCUMENT VAULT INTEGRATION**

After generation:

User can:

- Download PDF
- Save to Vault

Update:

- `processed_file_path`
- `status = processed`

---

## **8. MULTI-TENANCY RULES**

- Users can only access documents within their tenant
- Assets (signatures, stamps) are tenant-specific
- All queries must be scoped by `tenant_id`

---

## **9. SECURITY**

- Validate file type (PDF only)
- Limit file size
- Sanitize uploads
- Prevent unauthorized document access

---

## **10. OPTIONAL (IF TIME PERMITS)**

- Version history
- Undo/redo overlay positions
- Auto-save editor state
- Email document directly after generation

---

# 🎯 **DELIVERABLES CLAUDE MUST GENERATE**

1. Full database migrations
2. Laravel models + relationships
3. Controllers + routes
4. React pages (Upload, Editor, Index)
5. Overlay drag/drop implementation
6. PDF export logic
7. Storage integration
8. Clean UI using Shadcn + Tailwind
9. Example usage flow

---

# ⚡ **DEVELOPMENT PRIORITY**

1. Upload + preview PDF
2. Render pages with PDF.js
3. Drag signature/stamp
4. Apply watermark
5. Export PDF
6. Save to backend

---

# 🚀 FINAL INSTRUCTION

Build this as a **modular feature inside the existing InsurePal SaaS**, following best practices for:

- multi-tenancy
- scalability
- clean architecture
- maintainability

---

**Do NOT skip steps. Build module-by-module with clear separation of concerns.**
