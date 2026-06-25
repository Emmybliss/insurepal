# DB Image & Logo Field Consolidation

## Problem Summary

Right now, image/logo data is scattered and duplicated across unrelated tables. The `TenantController` (Admin) uploads a logo into `tenant_kycs.profile_image_path` instead of `tenants.logo`. The `CustomerKycController` stores a profile photo inside the KYC table. The `customers` table has no `logo` field at all. The goal is to enforce one canonical rule:

| Field | Owns |
|---|---|
| `tenants.logo` | Tenant company official logo |
| `customers.logo` | Customer business/company logo (corporate) |
| `users.avatar` | Signed-in user personal profile image |
| `tenant_kycs` | Compliance documents only (no images) |
| `customer_kycs` | Compliance documents only (no images) |

---

## Current State Audit

### What exists today

| Table | Problem field | Should go to |
|---|---|---|
| `tenant_kycs` | `profile_image_path` | **Remove** — was used as tenant logo in admin CRUD |
| `customer_kycs` | `profile_image_path` | **Remove** — belongs in `users.avatar` |
| `customers` | *no logo field* | **Add** `logo` column |
| `users` | `avatar` ✅ already present | Already correct — just not fully wired |
| `tenants` | `logo` ✅ already present | Already correct — just not fully used |

### Key problem areas in code

- **`Admin\TenantController::store/update`** — uploads logo into `tenant_kycs.profile_image_path` instead of `tenants.logo`
- **`CustomerKycController::update` & `customerUpdate`** — stores profile image in `customer_kycs.profile_image_path` instead of `users.avatar`
- **`BrokerKyc.tsx`** — renders `kyc.profile_image_path` as a profile avatar (should be `users.avatar`)
- **`TenantRequest`** — validates `profile_image` field pointing to KYC; needs renaming to `logo` pointing to `tenants.logo`
- **`customers` table** — missing `logo` column for corporate customer logos
- **TypeScript types** — `CustomerKyc` type still carries `profile_image_path`

---

## Proposed Changes

### Phase 1 — Database Migrations

#### [NEW] `drop_profile_image_from_kyc_tables`
Remove `profile_image_path` from both KYC tables:
```php
Schema::table('customer_kycs', fn($t) => $t->dropColumn('profile_image_path'));
Schema::table('tenant_kycs', fn($t) => $t->dropColumn('profile_image_path'));
```

#### [NEW] `add_logo_to_customers_table`
Add corporate logo field to customers:
```php
Schema::table('customers', fn($t) => $t->string('logo')->nullable()->after('company_name'));
```

---

### Phase 2 — Eloquent Models

#### [MODIFY] [CustomerKyc.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Models/CustomerKyc.php)
- Remove `profile_image_path` from `$fillable`

#### [MODIFY] [TenantKyc.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Models/TenantKyc.php)
- Remove `profile_image_path` from `$fillable`

#### [MODIFY] [Customer.php](file:///c:/Users/MINDINTEL LTD/Herd/insurepal-AI-SAAS/app/Models/Customer.php)
- Add `logo` to `$fillable`

---

### Phase 3 — Backend Controllers

#### [MODIFY] [TenantController.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Controllers/Admin/TenantController.php)

**`store()`**: Change to upload logo directly to `tenants.logo` instead of creating a KYC record:
```php
// BEFORE
if ($request->hasFile('profile_image')) {
    $path = $request->file('profile_image')->store('tenant_profiles', 'public');
    $tenant->kyc()->create(['profile_image_path' => $path]);
}

// AFTER
if ($request->hasFile('logo')) {
    if ($tenant->logo) {
        Storage::disk('public')->delete($tenant->logo);
    }
    $tenant->update(['logo' => $request->file('logo')->store('tenants/logos', 'public')]);
}
```

**`update()`**: Same change — move from `kyc.profile_image_path` to `tenants.logo`.

#### [MODIFY] [TenantRequest.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Requests/Admin/TenantRequest.php)
- Rename field from `profile_image` → `logo`
- Keep validation rule: `'logo' => 'nullable|image|max:2048'`

#### [MODIFY] [CustomerKycController.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Controllers/CustomerKycController.php)

**`update()` (Admin path)**: Remove `profile_image` handling entirely from this controller. Optionally redirect to a dedicated avatar upload endpoint on the User model.

**`customerUpdate()` (Customer portal path)**: Remove `profile_image` handling. If a profile image is uploaded here by a customer, it should instead be saved to `users.avatar` via the `ProfileController`.

Remove validation rule `'profile_image' => ...` from both methods.

#### [MODIFY] [ProfileController.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Controllers/Settings/ProfileController.php) — `update()`
- Extend the `update()` method to accept and handle an `avatar` file upload, storing it to `users/avatars/` and saving to `users.avatar`

#### [MODIFY] [CustomerController.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Controllers/CustomerController.php)
- Add `logo` field handling for corporate customers in `store()` and `update()` methods
- Store to `customers/logos/` disk path

---

### Phase 4 — Validation Requests

#### [MODIFY] [TenantRequest.php](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/app/Http/Requests/Admin/TenantRequest.php)
- Rename `profile_image` → `logo` in rules and any `prepareForValidation` logic

#### [MODIFY] `ProfileUpdateRequest.php`
- Add `avatar` as an accepted file field

---

### Phase 5 — React / TypeScript Frontend

#### [MODIFY] [core.ts](file:///c:/Users/MINDINTEL%20LTD/Herd/insurepal-AI-SAAS/resources/js/types/core.ts)
- In `CustomerKyc` type: remove `profile_image_path`
- In `TenantKyc` type: remove `profile_image_path`
- In `Customer` type: add `logo?: string | null`

#### [MODIFY] `Admin/Tenants/Create.tsx` & `Admin/Tenants/Edit.tsx`
- Rename upload input field from `profile_image` → `logo`
- Update label: "Company Logo" (not "Profile Image")
- Display current logo from `tenant.logo` (not `tenant.kyc.profile_image_path`)

#### [MODIFY] `settings/BrokerKyc.tsx`
- Remove the profile image section entirely from the KYC form
- Profile image management belongs in the general profile settings page

#### [MODIFY] `settings/profile.tsx`
- Add avatar upload section: display `user.avatar`, allow uploading a new one

#### [MODIFY] `customers/kyc.tsx` & `customer-portal/kyc.tsx`
- Remove `profile_image` field from KYC forms
- Profile image is managed separately via user profile settings

#### [MODIFY] `customers/Create.tsx` & `customers/Edit.tsx` (if applicable)
- Add `logo` upload input for corporate customers

---

## Execution Strategy (Ordered)

> [!IMPORTANT]
> Execute in this exact order to avoid broken references between layers.

```
1. DB Migrations        → establish the correct schema first
2. Eloquent Models      → reflect schema in PHP models
3. Validation Requests  → update rules to match new field names
4. Backend Controllers  → wire up new upload paths
5. TypeScript Types     → fix frontend type contracts
6. React Pages          → update UI to match new field names & display logic
```

---

## Open Questions

> [!IMPORTANT]
> **Existing data**: The `tenant_kycs.profile_image_path` and `customer_kycs.profile_image_path` columns may contain file paths for existing records. Before dropping these columns, should we **migrate existing data**?
> - Option A: Copy `tenant_kycs.profile_image_path` → `tenants.logo` for all existing tenants (recommended)
> - Option B: Drop and accept that previously uploaded images are orphaned (storage files untouched, just DB reference lost)

> [!IMPORTANT]
> **`customers.logo`** — should it be added for all customer types (individual + corporate), or constrained only to corporate? The doc says "corporate customers" have a business logo. For individual customers, a logo field makes no business sense. Recommend: add the column but only expose the upload UI for corporate type.

> [!NOTE]
> `CertificateSettingsController` uses a separate `company_logo_path` key stored in `certificate_settings` — this is a **separate system** for document branding and is **out of scope** for this refactor. It already works independently.

---

## Verification Plan

### Automated
- Run `php artisan migrate` and confirm no errors
- Run `php artisan test` (if tests exist for KYC/tenant flows)

### Manual Browser Testing
1. **Admin → Tenants → Create**: Upload a logo → confirm it appears in `tenants.logo` (not KYC)
2. **Admin → Tenants → Edit**: Upload a new logo → confirm old file is deleted, new file saved to `tenants.logo`
3. **Admin → Tenants → Show**: Confirm logo displayed from `tenant.logo`
4. **Customer KYC page**: Confirm no profile image field is present
5. **Settings → Profile**: Confirm avatar upload works and saves to `users.avatar`
6. **Customer portal KYC**: Confirm no profile image field present
7. **Settings → BrokerKyc**: Confirm profile image section removed
