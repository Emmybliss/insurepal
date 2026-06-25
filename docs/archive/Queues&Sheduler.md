You are a **senior Laravel architect and performance engineer**.
Your task is to analyze and optimize the **Insure Pal insurance management system** codebase.

The application is built with:

- Backend: Laravel
- Frontend: React with Inertia.js
- Database: MySQL

The system manages:

- Insurance policies
- Brokers
- Underwriters
- Quotes
- Debit notes
- Credit notes
- Transactions
- Email notifications
- Policy renewal reminders
- Document generation (PDFs)
- File uploads
- Reports and analytics

Your goal is to **identify parts of the application that should use Laravel Queues or the Laravel Scheduler** and implement them properly.

---

# Step 1 — Codebase Analysis

Scan the entire Laravel project and identify operations that fall into these categories:

### Long-running operations

These should be converted into **Queued Jobs**:

Examples:

- Sending emails
- Generating PDFs
- Bulk notifications
- CSV imports
- Large report generation
- File processing
- Image/document conversions
- Data exports
- Audit log processing

If any controller or service performs these tasks **synchronously**, refactor them into Laravel Jobs.

---

### Time-based tasks

These should use **Laravel Scheduler**.

Examples:

- Policy renewal reminders
- Automatic policy expiration checks
- Sending scheduled email alerts
- Cleaning temporary files
- Removing expired sessions
- Generating daily or weekly reports
- Auto archiving records
- Data backups

Add them to:

```php
app/Console/Kernel.php
```

---

# Step 2 — Queue Implementation

When background processing is needed:

1. Generate proper Jobs using:

```bash
php artisan make:job
```

2. Move heavy logic into the Job class.

3. Dispatch jobs from controllers/services using:

```php
JobName::dispatch($data);
```

4. Ensure jobs implement:

```php
ShouldQueue
```

5. Add retries, timeout, and failure handling.

Example:

```php
public $tries = 3;
public $timeout = 120;
```

---

# Step 3 — Scheduler Implementation

Add scheduled tasks inside:

```php
app/Console/Kernel.php
```

Examples:

```php
$schedule->command('policies:check-renewals')->daily();

$schedule->command('reports:generate')->dailyAt('02:00');

$schedule->command('cleanup:temp-files')->weekly();
```

Create any missing artisan commands required for these tasks.

---

# Step 4 — Optimization Rules

While implementing queues and schedules:

- Avoid blocking HTTP requests
- Move heavy database operations to jobs
- Batch large operations
- Prevent duplicate jobs
- Use chunking for large datasets
- Ensure jobs are idempotent

Example:

```php
Policy::chunk(100, function ($policies) {
    // process
});
```

---

# Step 5 — Shared Hosting Compatibility

This application currently runs on **shared hosting**, so configure queues to work with:

```env
QUEUE_CONNECTION=database
```

Generate queue tables if missing:

```bash
php artisan queue:table
php artisan migrate
```

Ensure jobs can run using:

```bash
php artisan queue:work --stop-when-empty
```

---

# Step 6 — Reporting

After completing the analysis:

Provide a **detailed report including**:

1. Controllers that were refactored
2. Jobs that were created
3. Scheduled tasks added
4. Performance improvements achieved
5. Any potential bottlenecks found
6. Any additional architectural recommendations

---

# Step 7 — Code Quality

Ensure:

- PSR-12 compliance
- Proper dependency injection
- No duplicated logic
- Services separated from controllers
- Jobs are reusable

---

# Final Goal

Transform the Insure Pal system into a **production-grade asynchronous Laravel architecture** where:

- HTTP requests remain fast
- Heavy tasks run in background queues
- Time-based operations run via scheduler
- System can scale to thousands of users
