<?php

namespace App\Console\Commands;

use App\Models\Policy;
use App\Notifications\PolicyExpiryReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendPolicyExpiryReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:policy-expiry-reminders 
                            {--days=30 : Number of days before expiry to send reminders}
                            {--tenant= : Specific tenant ID to process (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send policy expiry reminder notifications to customers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $tenantId = $this->option('tenant');

        $this->info("Sending policy expiry reminders for policies expiring in {$days} days...");

        $query = Policy::with(['customer', 'policyProduct'])
            ->where('status', Policy::STATUS_ACTIVE)
            ->whereDate('end_date', '=', now()->addDays($days)->toDateString());

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $policies = $query->get();

        if ($policies->isEmpty()) {
            $this->info('No policies found expiring in the specified timeframe.');

            return 0;
        }

        $this->info("Found {$policies->count()} policies expiring in {$days} days.");

        $bar = $this->output->createProgressBar($policies->count());
        $bar->start();

        $notificationsSent = 0;
        $errors = [];

        foreach ($policies as $policy) {
            try {
                // Send notification to customer
                $policy->customer->notify(new PolicyExpiryReminder($policy, $days));

                // Also send to broker if they have one
                if ($policy->broker) {
                    $policy->broker->notify(new PolicyExpiryReminder($policy, $days));
                }

                $notificationsSent++;
                $bar->advance();
            } catch (\Exception $e) {
                $errors[] = "Policy ID {$policy->id}: ".$e->getMessage();
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine();

        $this->info("Successfully sent {$notificationsSent} notifications.");

        if (! empty($errors)) {
            $this->error('Errors encountered:');
            foreach ($errors as $error) {
                $this->line("  - {$error}");
            }
        }

        // Log summary
        $this->info('Policy expiry reminder command completed.');
        $this->info("Policies processed: {$policies->count()}");
        $this->info("Notifications sent: {$notificationsSent}");
        $this->info('Errors: '.count($errors));

        return 0;
    }
}
