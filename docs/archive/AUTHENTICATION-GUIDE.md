# Spatie Laravel Permission Authentication Guide

This guide explains how to use the new Spatie Laravel Permission-based authentication system in your Insure Pal application.

## Overview

The authentication system has been updated from a simple `role` column to use the powerful **Spatie Laravel Permission** package, which provides:

- **Role-based access control (RBAC)** with granular permissions
- **Multiple roles per user**
- **Direct permission assignment**
- **Tenant-aware permissions** (coming soon)
- **Cached permission checks** for performance

## Available Roles

### System Roles
- **super_admin**: Platform administrator with full system access
- **underwriter**: Insurance underwriter with full tenant management
- **broker**: Insurance broker with customer management capabilities
- **underwriter_staff**: Staff member in an underwriter organization
- **broker_staff**: Staff member in a broker organization
- **customer**: End customer with limited portal access

### Permission Modules

The system includes comprehensive permissions organized by modules:

1. **Customer Management**: `view_customers`, `create_customers`, `edit_customers`, `delete_customers`
2. **Quote Management**: `view_quotes`, `create_quotes`, `edit_quotes`, `approve_quotes`
3. **Policy Management**: `view_policies`, `create_policies`, `renew_policies`, `cancel_policies`
4. **Financial Management**: `view_financial_notes`, `create_debit_notes`, `process_payments`
5. **Reports & Analytics**: `view_reports`, `generate_reports`, `view_naicom_reports`
6. **User Management**: `view_users`, `create_users`, `manage_roles`, `invite_users`
7. **Settings**: `view_settings`, `edit_settings`, `manage_integrations`
8. **Communication**: `view_messages`, `send_messages`, `broadcast_messages`
9. **Super Admin**: `manage_tenants`, `view_platform_analytics`, `manage_system_settings`

## Backend Usage

### User Model Methods

```php
// Check roles
$user->hasRole('underwriter');
$user->hasAnyRole(['broker', 'underwriter']);
$user->hasAllRoles(['staff', 'active']);

// Check permissions
$user->can('create_customers');
$user->hasPermissionTo('edit_quotes');
$user->hasAnyPermission(['view_reports', 'generate_reports']);

// Helper methods
$user->isSuperAdmin();
$user->isUnderwriter();
$user->isBroker();
$user->isStaff();
$user->getPrimaryRoleName();
$user->getAllPermissions();
```

### Assigning Roles & Permissions

```php
// Assign roles
$user->assignRole('underwriter');
$user->assignRole(['broker', 'staff']);

// Remove roles
$user->removeRole('staff');

// Sync roles (replaces all existing roles)
$user->syncRoles(['underwriter', 'admin']);

// Direct permissions (rare)
$user->givePermissionTo('special_access');
```

### Policy & Middleware Usage

```php
// In controllers
$this->authorize('create', Customer::class);
Gate::allows('edit_customers');

// Route middleware
Route::middleware(['role:underwriter'])->group(function () {
    // Routes for underwriters only
});

Route::middleware(['permission:create_customers'])->group(function () {
    // Routes requiring customer creation permission
});
```

## Frontend Usage

### Hooks

#### `useAuth()` Hook
```typescript
import { useAuth } from '@/hooks/use-permissions';

function MyComponent() {
    const auth = useAuth();

    if (auth.isSuperAdmin) {
        // Super admin content
    }

    if (auth.can('create_customers')) {
        // Show create button
    }

    return <div>Welcome {auth.user?.name}</div>;
}
```

#### `usePermissions()` Hook
```typescript
import { usePermissions } from '@/hooks/use-permissions';

function CustomerList() {
    const permissions = usePermissions();

    const canEdit = permissions.can('edit_customers');
    const canDelete = permissions.can('delete_customers');
    const hasAnyCustomerAccess = permissions.hasAnyPermission([
        'view_customers', 'create_customers'
    ]);

    return (
        <div>
            {canEdit && <EditButton />}
            {canDelete && <DeleteButton />}
        </div>
    );
}
```

### Permission Components

#### `<Can>` Component
```tsx
import { Can } from '@/components/auth/permission-guard';

<Can permission="create_customers">
    <CreateCustomerButton />
</Can>

<Can
    permission={['edit_customers', 'delete_customers']}
    fallback={<p>Access denied</p>}
>
    <CustomerActions />
</Can>
```

#### `<HasRole>` Component
```tsx
import { HasRole } from '@/components/auth/permission-guard';

<HasRole role="underwriter">
    <UnderwriterDashboard />
</HasRole>

<HasRole role={['broker', 'underwriter']}>
    <TenantManagementPanel />
</HasRole>
```

#### `<PermissionGuard>` Component
```tsx
import { PermissionGuard } from '@/components/auth/permission-guard';

<PermissionGuard
    permission="edit_customers"
    role="underwriter"
    requireAll={true}
    fallback={<AccessDenied />}
>
    <AdvancedCustomerEditor />
</PermissionGuard>
```

## Migration Steps

### 1. Run the Setup Script
```bash
# Windows
setup-spatie-auth.bat

# Or manually:
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan migrate
php artisan config:clear
```

### 2. Update Your Components

Replace old role checks:
```typescript
// Old way ❌
if (user.role === 'underwriter') {
    // ...
}

// New way ✅
if (auth.hasRole('underwriter')) {
    // ...
}
```

Replace permission checks:
```typescript
// Old way ❌
if (user.role === 'super_admin') {
    // Show admin menu
}

// New way ✅
if (auth.can('manage_tenants')) {
    // Show admin menu
}
```

### 3. Update Type Definitions

The `User` interface has been updated:

```typescript
interface User {
    // ... other fields
    roles: Role[];              // Array of role objects
    permissions: string[];       // Array of permission names
    primary_role: string;       // Primary role name
    can: UserPermissions;       // Pre-computed permission checks
}
```

## Performance Considerations

- **Permissions are cached** by Spatie for performance
- **Pre-computed permission checks** are included in the `user.can` object to avoid repeated database queries
- **Eager loading** of roles and permissions in Inertia middleware

## Security Features

- **Tenant isolation**: Permissions are scoped per tenant where applicable
- **Guard-based permissions**: Web guard used for web routes
- **Database-driven**: All roles and permissions stored in database
- **Cacheable**: Permission checks are cached for performance

## Testing

```php
// In tests
$user = User::factory()->create();
$user->assignRole('underwriter');

$this->assertAuthenticatedAs($user)
     ->get('/dashboard')
     ->assertOk();

// Test permissions
$this->assertTrue($user->can('create_customers'));
$this->assertFalse($user->can('manage_tenants'));
```

## Troubleshooting

### Clear Permission Cache
```bash
php artisan permission:cache-reset
```

### Check User Roles & Permissions
```php
// Debug user permissions
dd($user->roles->pluck('name'));
dd($user->permissions->pluck('name'));
dd($user->getAllPermissions()->pluck('name'));
```

### Permission Not Working
1. Ensure the permission exists in the database
2. Check if the role has the permission assigned
3. Clear permission cache
4. Verify the user has the correct role

## Next Steps

1. **Remove** the example files when done:
   - `resources/js/components/auth/auth-example.tsx`
   - `AUTHENTICATION-GUIDE.md`

2. **Implement** tenant-based permissions for multi-tenancy

3. **Add** API guards for API routes if needed

4. **Create** custom permissions for specific business logic

---

For more information, see the [Spatie Laravel Permission documentation](https://spatie.be/docs/laravel-permission/).