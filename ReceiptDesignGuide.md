
## Prompt — InsurePal Receipt Body Design

> **Task: Redesign the InsurePal insurance payment receipt body using the attached NETA Insurance Brokers receipt as the visual reference.**
>
> The attached receipt is a **design reference for the BODY ONLY**. Do not recreate, modify, or hard-code the NETA header, NETA logo, company address, contact information, or branded footer.
>
> InsurePal already has its own dynamic **tenant/company header and footer** system. The new receipt body must be inserted **between the existing header and footer**.

### 1. Overall Design Direction

Create a clean, professional, print-ready insurance payment receipt with:

* White background.
* Black text.
* Black/gray borders.
* No blue, green, teal, or other accent colors in the body.
* Corporate/minimal appearance.
* Strong typography hierarchy.
* Plenty of whitespace.
* Thin, subtle borders.
* Clear separation between customer/payment information and the payment table.
* A4-compatible layout.
* Suitable for PDF generation and physical printing.

The **only colors allowed inside the receipt body are:**

```text
#000000
#222222
#444444
#666666
#999999
#CCCCCC
#FFFFFF
```

Do not introduce tenant brand colors into the body. Tenant branding should remain confined to the existing header/footer.

---

# 2. Receipt Body Structure

The body should follow this hierarchy:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ PAYMENT RECEIPT                         Receipt No: XXXXX   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤  Customer Name:        [Customer Name]                   │
│                                                             │
│ 📍  Address:              [Customer Address]                │
│                                                             │
│ 📅  Date:                 [Payment Date]                    │
│                                                             │
│ 💳  Payment Method:       [Payment Method]                  │
│                                                             │
│ 🧾  Reference No:         [Transaction Reference]           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Description                              Amount             │
│ ──────────────────────────────────────────────────────────  │
│ Insurance Premium                        ₦XXX,XXX.00        │
│                                                             │
│ ──────────────────────────────────────────────────────────  │
│ Total Paid                               ₦XXX,XXX.00        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Amount in Words:                                            │
│ [Amount in words]                                           │
│                                                             │
│                                                             │
│ ──────────────────────────────────────────────────────────  │
│                                                             │
│ Thank you!                             [Signature]          │
│ for your trust and support.          Authorised Signatory   │
│                                      [Company Name]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The actual implementation should be more polished than this wireframe.

---

# 3. Receipt Title

At the beginning of the body, create a two-column title row.

### Left

Large:

**PAYMENT RECEIPT**

Use a bold, professional sans-serif font.

Recommended:

```css
font-size: 24px–30px;
font-weight: 700;
letter-spacing: 0.02em;
color: #000;
```

### Right

Display:

```text
Receipt No: [receipt_number]
```

inside a subtle bordered rectangular container.

Example:

```text
Receipt No: NIBL/2026/000123
```

The receipt number should come from InsurePal's actual receipt/payment model and **must not be hard-coded**.

---

# 4. Customer & Payment Information

Create a clean vertical information section similar to the reference.

Each row should contain:

### Row 1

**Customer Name:**
`[customer name]`

### Row 2

**Address:**
`[customer address]`

### Row 3

**Date:**
`[payment date]`

### Row 4

**Payment Method:**
`[payment method]`

### Row 5

**Reference No:**
`[transaction/reference number]`

Use a consistent three-column structure:

```text
[Icon]    [Label]             [Dynamic Value]
```

For example:

```text
👤        Customer Name:      ABC Nigeria Ltd
📍        Address:            23 Alexandra Crescent, Abuja
📅        Date:               23 Sep 2026
💳        Payment Method:     Bank Transfer
🧾        Reference No:       TRF-20260923-001
```

### Important

The icons should be **monochrome black/gray**, preferably using the application's existing icon library such as Lucide.

Do not use colored icons.

If the existing InsurePal PDF renderer has issues with SVG icons, use a clean typographic layout instead of introducing unreliable image assets.

---

# 5. Payment Table

Create the main payment table beneath the customer/payment information.

The table should have:

```text
Description                              Amount
------------------------------------------------
Insurance Premium                       ₦XXX,XXX.00
------------------------------------------------
Total Paid                              ₦XXX,XXX.00
```

### Header

Use:

* Black text.
* Very light gray or white background.
* Thin border.
* Bold typography.

Do **not** use a blue header like the reference's earlier version.

### Description column

Left aligned.

Example:

```text
Insurance Premium – Motor Insurance
```

or dynamically:

```text
Insurance Premium – [Policy Type]
```

### Amount column

Right aligned.

Use proper currency formatting based on the transaction currency.

Examples:

```text
₦500,000.00
$5,000.00
€5,000.00
```

Do not hard-code USD.

---

# 6. Total Paid

Make the **Total Paid** row visually prominent without using color.

Use:

```text
font-weight: 700;
font-size: slightly larger than normal;
border-top: 1px solid #777;
```

The amount should be right aligned.

Example:

```text
Total Paid                              ₦500,000.00
```

Do not use a colored background.

A very subtle gray background such as `#F7F7F7` is acceptable if needed for visual separation.

---

# 7. Amount in Words

Below the payment table:

```text
Amount in Words:

Five Hundred Thousand Naira Only
```

The label should be bold.

The actual amount in words should be generated dynamically from the transaction amount.

Do not hard-code:

```text
Five Thousand United States Dollars Only
```

The implementation should use the actual transaction currency and amount.

---

# 8. Divider

Place a thin horizontal divider below the amount-in-words section.

Use:

```css
border-top: 1px solid #999;
```

Do not use a colored divider.

---

# 9. Thank-You / Signature Area

Create a two-column bottom section.

### Left

Display:

```text
Thank you!

for your trust and support.
```

"Thank you!" can use a subtle handwritten/script font **if an appropriate existing font is already available**.

Otherwise use a clean italic serif/sans-serif treatment rather than introducing an external dependency.

### Right

Create:

```text
                    [Signature]

             ______________________
                Authorised Signatory

              [Tenant/Company Name]
```

The signature should be dynamically supplied if InsurePal supports stored signatures.

Otherwise leave a clean signature line.

Do not generate a fake signature.

---

# 10. InsurePal Dynamic Data

The design must be completely data-driven.

Do not hard-code:

* NETA Insurance Brokers Ltd.
* Mindintel Tech Ltd.
* Receipt number.
* Date.
* Address.
* Payment method.
* Transaction reference.
* Insurance product.
* Policy number.
* Amount.
* Currency.
* Amount in words.

Use the existing InsurePal models/resources/data passed into the receipt view.

The receipt should work for **every InsurePal tenant**, including:

```text
Broker
Underwriter
```

and any future supported tenant type.

---

# 11. Important InsurePal Branding Rule

The receipt should have this architecture:

```text
┌───────────────────────────────────────┐
│ EXISTING DYNAMIC TENANT HEADER        │
│ Logo | Company Name | Address | etc.  │
├───────────────────────────────────────┤
│                                       │
│       NEW BLACK & WHITE BODY          │
│                                       │
│ Payment Receipt                       │
│ Customer Information                  │
│ Payment Information                   │
│ Payment Table                         │
│ Total                                 │
│ Amount in Words                       │
│ Thank You / Signature                 │
│                                       │
├───────────────────────────────────────┤
│ EXISTING DYNAMIC TENANT FOOTER        │
│ Branding / contact / Powered by ...   │
└───────────────────────────────────────┘
```

**Do not allow the body styling to override the header or footer branding.**

---

# 12. Print/PDF Requirements

The receipt must be optimized for:

* A4 PDF.
* Physical printing.
* Browser print.
* InsurePal PDF generation.
* Headless Chrome/Browsershot if that is what the existing implementation uses.

Ensure:

```css
print-color-adjust: exact;
-webkit-print-color-adjust: exact;
```

but do not depend on background colors for the body design.

The body should still look professional when printed on a black-and-white printer.

Avoid:

* excessive shadows
* gradients
* large colored backgrounds
* unnecessary decorative elements
* excessive rounded cards
* large empty spaces
* UI-style components that look like a web dashboard

This should look like **formal corporate stationery**, not a web application screen.

---

# 13. Responsive / PDF Layout

Prioritize the PDF/A4 version.

The receipt should:

* fit naturally within one A4 page for normal transactions;
* prevent the payment table from splitting awkwardly;
* keep the signature section together;
* prevent individual table rows from breaking across pages;
* maintain consistent margins;
* remain readable when printed.

Use appropriate CSS such as:

```css
page-break-inside: avoid;
break-inside: avoid;
```

where appropriate.

---

# 14. Visual Reference Rule

Use the attached NETA receipt as the **layout reference**, particularly for:

* title positioning;
* receipt number placement;
* vertical customer/payment information;
* icon + label + value arrangement;
* payment table;
* amount-in-words section;
* horizontal divider;
* thank-you section;
* signature placement;
* overall whitespace and proportions.

However, **do not copy the NETA branding** into InsurePal's generic receipt template.

The final result should feel like the same design family while remaining an original InsurePal document template.

---

# 15. Final Design Goal

The final receipt should communicate:

**Professional → Official → Minimal → Trustworthy → Insurance/Financial Document**

It should resemble a professionally designed corporate payment receipt rather than an invoice generated from a generic admin dashboard.

Most importantly:

> **Header = tenant branded**
> **Body = strictly black & white**
> **Footer = tenant branded / InsurePal branded**

Keep these three sections architecturally and stylistically independent.

---

### One additional recommendation for InsurePal

Because you're building this as a **multi-tenant insurance SaaS**, I would make the body a reusable receipt component rather than creating a NETA-specific receipt.

Something along these lines conceptually:

```tsx
<ReceiptDocument>
    <ReceiptHeader tenant={tenant} />

    <ReceiptBody
        receipt={receipt}
        customer={customer}
        policy={policy}
        payment={payment}
    />

    <ReceiptFooter tenant={tenant} />
</ReceiptDocument>
```

That way, NETA can have the exact receipt you showed, while another broker automatically gets **the same professional body layout with their own header/footer and their own transaction data**.
