<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Notifications\PaymentDueReminder;
use Illuminate\Console\Command;

class SendPaymentDueReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:payment-due-reminders 
                            {--days=7 : Number of days before due date to send reminders}
                            {--tenant= : Specific tenant ID to process (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send payment due reminder notifications to customers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $tenantId = $this->option('tenant');

        $this->info("Sending payment due reminders for payments due in {$days} days...");

        $query = Payment::with(['policy.customer'])
            ->where('status', 'pending')
            ->whereDate('due_date', '=', now()->addDays($days)->toDateString());

        if ($tenantId) {
            $query->whereHas('policy', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            });
        }

        $payments = $query->get();

        if ($payments->isEmpty()) {
            $this->info('No payments found due in the specified timeframe.');

            return 0;
        }

        $this->info("Found {$payments->count()} payments due in {$days} days.");

        $bar = $this->output->createProgressBar($payments->count());
        $bar->start();

        $notificationsSent = 0;
        $errors = [];

        foreach ($payments as $payment) {
            try {
                // Send notification to customer
                $payment->policy->customer->notify(new PaymentDueReminder($payment, $days));

                // Also send to broker if they have one
                if ($payment->policy->broker) {
                    $payment->policy->broker->notify(new PaymentDueReminder($payment, $days));
                }

                $notificationsSent++;
                $bar->advance();
            } catch (\Exception $e) {
                $errors[] = "Payment ID {$payment->id}: ".$e->getMessage();
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
        $this->info('Payment due reminder command completed.');
        $this->info("Payments processed: {$payments->count()}");
        $this->info("Notifications sent: {$notificationsSent}");
        $this->info('Errors: '.count($errors));

        return 0;
    }
}
