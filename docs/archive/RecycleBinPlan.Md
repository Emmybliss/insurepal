Use this prompt:

````text
Analyze the existing InsurePal Laravel + Inertia React TypeScript codebase and implement a production-ready Recycle Bin / Trash system for soft-deleted records, with automatic permanent deletion after a configurable retention period.

Tech stack:
- Laravel 12
- Inertia.js
- React TypeScript
- Tailwind CSS / Shadcn UI
- MySQL/MariaDB
- Spatie Laravel Permission
- Multi-tenant SaaS structure

Goal:
Add a centralized Recycle Bin feature where deleted records are not immediately permanently removed. They should be soft-deleted, visible in a Recycle Bin page, restorable by authorized users, and permanently deleted automatically after either 14 days or 30 days depending on configuration.

Recommended default:
Use 30 days as the default retention period, but make it configurable in `.env`.

Add:

```env
RECYCLE_BIN_RETENTION_DAYS=30
````

Then expose it through config:

```php
// config/insurepal.php
'recycle_bin_retention_days' => env('RECYCLE_BIN_RETENTION_DAYS', 30),
```

Implementation requirements:

1. Audit existing models
   Check all major InsurePal models and identify which ones should use soft deletes.

Prioritize:

- Tenant
- Customer
- Policy
- Quote
- Claim
- DebitNote
- CreditNote
- Document
- SupportTicket
- Message / Conversation / Thread
- PolicyProduct
- User, only if safe and compatible with auth/business logic

For each eligible model:

- Add `use SoftDeletes;`
- Add `deleted_at` to migrations if missing
- Ensure relationships continue to work correctly
- Avoid soft deleting records where permanent deletion is safer or legally required unless clearly appropriate

2. Database migrations
   Create safe migrations to add soft delete columns only where they do not already exist.

Example:

```php
Schema::table('policies', function (Blueprint $table) {
    if (! Schema::hasColumn('policies', 'deleted_at')) {
        $table->softDeletes();
    }
});
```

3. Replace destructive deletes
   Find all existing delete actions in controllers, services, actions, jobs, and API endpoints.

Replace direct permanent deletion like:

```php
$model->delete();
```

with soft delete behavior where applicable.

Only use `forceDelete()` in:

- Recycle Bin permanent delete action
- Scheduled cleanup job
- Clearly intentional admin-only permanent delete flows

4. Build centralized Recycle Bin backend
   Create a `RecycleBinController` with routes like:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/recycle-bin', [RecycleBinController::class, 'index'])->name('recycle-bin.index');
    Route::post('/recycle-bin/{type}/{id}/restore', [RecycleBinController::class, 'restore'])->name('recycle-bin.restore');
    Route::delete('/recycle-bin/{type}/{id}/force-delete', [RecycleBinController::class, 'forceDelete'])->name('recycle-bin.force-delete');
});
```

The Recycle Bin index should support:

- Search
- Filter by record type
- Filter by deleted date
- Pagination
- Tenant isolation
- Permission checks
- Display of how many days remain before permanent deletion

5. Use a safe model registry
   Do not resolve arbitrary class names from the frontend.

Create a controlled registry like:

```php
return [
    'customers' => App\Models\Customer::class,
    'policies' => App\Models\Policy::class,
    'quotes' => App\Models\Quote::class,
    'claims' => App\Models\Claim::class,
    'debit-notes' => App\Models\DebitNote::class,
    'credit-notes' => App\Models\CreditNote::class,
    'documents' => App\Models\Document::class,
    'support-tickets' => App\Models\SupportTicket::class,
];
```

Place this in config:

```php
// config/recycle-bin.php
return [
    'retention_days' => env('RECYCLE_BIN_RETENTION_DAYS', 30),

    'models' => [
        // key => model class
    ],
];
```

6. Tenant isolation
   Ensure users only see deleted records belonging to their own tenant.

For every recycle bin query:

- If the model has `tenant_id`, filter by current tenant ID
- Super Admin can view all records
- Underwriter/Broker users can only view their tenant records
- Customer users should not access the central recycle bin unless explicitly permitted

7. Permissions
   Add permissions such as:

```text
recycle_bin.view
recycle_bin.restore
recycle_bin.force_delete
```

Seed these permissions and assign them appropriately:

- Super Admin: all recycle bin permissions
- Tenant Admin / Owner: view and restore, optionally force delete
- Normal staff: view only or no access depending on current role structure

Use Spatie Laravel Permission for authorization.

8. Restore logic
   When restoring a record:

- Use `withTrashed()->findOrFail($id)`
- Check authorization
- Check tenant ownership
- Call `$model->restore()`
- Log the activity if activity logging exists
- Return success toast/message via Inertia redirect

Also handle restore conflicts. For example:

- If a related parent record is still deleted, show a clear error
- Example: do not restore a policy if its customer is still deleted unless the customer is restored first

9. Permanent delete logic
   When permanently deleting from Recycle Bin:

- Require `recycle_bin.force_delete`
- Use `forceDelete()`
- Delete or detach related files where appropriate
- Be careful with financial/compliance records
- Add confirmation requirement on frontend
- Log the action

Important:
For sensitive insurance/financial records, prefer disabling manual force delete for tenant users unless the business rules allow it. Super Admin should have final authority.

10. Scheduled automatic cleanup
    Create an Artisan command:

```bash
php artisan make:command PruneRecycleBin
```

Command name:

```php
protected $signature = 'recycle-bin:prune';
```

Logic:

- Loop through configured recycle bin models
- Query `onlyTrashed()`
- Find records where `deleted_at <= now()->subDays(config('recycle-bin.retention_days'))`
- Force delete them
- Log count per model
- Do not break the whole command if one model fails; catch and report errors

Example behavior:

```php
$model::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(config('recycle-bin.retention_days')))
    ->chunkById(100, function ($records) {
        foreach ($records as $record) {
            $record->forceDelete();
        }
    });
```

11. Register scheduler
    In Laravel 12 scheduler setup, register the command to run daily.

Use the correct Laravel 12 scheduling location, likely:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('recycle-bin:prune')->dailyAt('02:00');
```

Also ensure the server cron exists:

```bash
* * * * * cd /var/www/insurepal && php artisan schedule:run >> /dev/null 2>&1
```

12. Frontend page
    Create:

```text
resources/js/Pages/RecycleBin/Index.tsx
```

UI requirements:

- Professional SaaS-style page
- Table of deleted records
- Columns:
    - Type
    - Name/Title/Reference
    - Deleted By, if available
    - Deleted At
    - Auto Delete Date
    - Days Remaining
    - Actions

- Actions:
    - Restore
    - Permanently Delete

- Search input
- Type filter dropdown
- Empty state
- Pagination
- Confirmation modal before force delete
- Warning banner explaining that deleted records are automatically removed after configured retention days

Use existing layout, route helpers, Shadcn components, toast system, and existing project conventions.

13. Sidebar / Navigation
    Add “Recycle Bin” to the appropriate sidebar/menu only for users with `recycle_bin.view`.

Use a trash icon.

14. Optional deleted_by tracking
    If the project already has activity logs, use them.
    If not, add optional deleted tracking where practical:

- `deleted_by`
- `restored_by`
- `force_deleted_by`

Do not overcomplicate this unless the codebase already has audit logging.

15. Tests
    Add feature tests for:

- Authorized user can view recycle bin
- Unauthorized user cannot view recycle bin
- Tenant cannot view another tenant’s deleted records
- Deleted record can be restored
- Record can be force deleted by authorized user
- Scheduled prune permanently deletes records older than retention period
- Scheduled prune does not delete records still within retention period

16. Safety rules
    Do not blindly force delete important insurance/financial records without checking existing relationships and compliance implications.

For records like policies, debit notes, credit notes, claims, and documents:

- Prefer soft delete
- Restore should be supported
- Force delete should be restricted
- Consider adding model-level policy authorization

17. Deliverables
    After implementation, provide:

- List of files created/modified
- Migrations added
- Models updated with SoftDeletes
- Routes added
- Controller/service added
- Command added
- Scheduler update
- Frontend page added
- Permissions seeded
- Any models intentionally excluded from recycle bin and why
- Commands to run:

```bash
php artisan migrate
php artisan db:seed --class=PermissionSeeder
php artisan optimize:clear
php artisan recycle-bin:prune
```

Also verify that:

```bash
php artisan schedule:list
```

shows the recycle bin prune command.

Important:
Follow existing InsurePal naming conventions, tenant scoping patterns, policies, middleware, layouts, route naming, toast handling, and UI components. Do not introduce a new architecture if the existing project already has a consistent pattern.
