You are working on a Laravel-based insurance management system (InsurePal). Your task is to implement a fully automated policy expiration notification scheduler system.

🎯 OBJECTIVE

Build a scheduled system that sends policy expiration reminders at the following intervals before the expiry_date:

60 days before (2 months)

30 days before (1 month)

14 days before (2 weeks)

7 days before

Daily from 7 days until expiry date

On the exact expiry date

🧠 CORE RULES

Notifications must be fully automated using Laravel Scheduler (app/Console/Kernel.php)

The system must prevent duplicate notifications

Notifications should be sent via:

Email (required)

SMS (optional if configured)

In-app notification (database)

🗄️ DATABASE REQUIREMENTS

Update the policies table:

Add the following fields:

last_notification_sent_at (timestamp, nullable)
notification_stage (string, nullable)

OR (preferred scalable approach):

Create a new table:

policy_notifications

- id
- policy_id
- stage (enum: '60_days', '30_days', '14_days', '7_days', 'daily', 'expiry_day')
- sent_at (timestamp)

👉 Use this table to track which reminders have been sent.

⏰ SCHEDULER SETUP

In app/Console/Kernel.php:

Create a command: php artisan make:command SendPolicyExpiryNotifications

Schedule it to run daily at 8:00 AM

$schedule->command('policies:send-expiry-notifications')->dailyAt('08:00');
🔍 LOGIC IMPLEMENTATION

Inside the command:

Fetch all active policies:

Policy::whereDate('expiry_date', '>=', now())

Calculate days until expiry:

$daysUntilExpiry = now()->diffInDays($policy->expiry_date, false);
📊 NOTIFICATION CONDITIONS

Trigger notifications based on:

Stage Condition
60_days daysUntilExpiry == 60
30_days daysUntilExpiry == 30
14_days daysUntilExpiry == 14
7_days daysUntilExpiry == 7
daily daysUntilExpiry <= 7 && > 0
expiry_day daysUntilExpiry == 0
🚫 DUPLICATE PREVENTION

Before sending any notification:

Check if a record already exists in policy_notifications:

PolicyNotification::where('policy_id', $policy->id)
->where('stage', $stage)
->exists();

Only send if it does NOT exist.

📩 NOTIFICATION ACTION

When a notification is triggered:

Send Email (Laravel Notification or Mail)

Optionally send SMS

Store notification in DB

Insert record into policy_notifications

🧱 CODE STRUCTURE

Command: SendPolicyExpiryNotifications

Service class: PolicyNotificationService

Notification class: PolicyExpiryNotification

🚀 PERFORMANCE

Use chunking for large datasets:

Policy::chunk(100, function ($policies) {
// process
});

Dispatch notifications via queues (ShouldQueue)

🧪 EDGE CASES

Handle:

Expired policies (skip or send "expired" notice once)

Policies with missing expiry dates (ignore)

Timezone consistency (use Carbon)

🧾 OUTPUT EXPECTATION

Generate:

Migration for policy_notifications

Artisan command

Notification class

Service class

Scheduler registration
