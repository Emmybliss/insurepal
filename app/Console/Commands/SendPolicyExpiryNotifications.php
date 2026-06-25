<?php

namespace App\Console\Commands;

use App\Services\PolicyNotificationService;
use Illuminate\Console\Command;

class SendPolicyExpiryNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'policies:send-expiry-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send automated policy expiration reminders to customers';

    /**
     * Execute the console command.
     */
    public function handle(PolicyNotificationService $service)
    {
        $this->info('Starting policy expiry notifications process...');

        $service->processExpiryNotifications();

        $this->info('Finished processing policy expiry notifications.');
    }
}
