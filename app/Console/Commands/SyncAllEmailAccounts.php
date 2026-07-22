<?php

namespace App\Console\Commands;

use App\Jobs\SyncEmailAccount;
use App\Models\EmailAccount;
use Illuminate\Console\Command;

class SyncAllEmailAccounts extends Command
{
    protected $signature = 'email:sync-all {--tenant-id= : Sync only a specific tenant\'s accounts}';

    protected $description = 'Queue sync jobs for all active email accounts';

    public function handle(): void
    {
        $query = EmailAccount::where('is_active', true);

        if ($this->option('tenant-id')) {
            $query->where('tenant_id', $this->option('tenant-id'));
        }

        $accounts = $query->get();

        if ($accounts->isEmpty()) {
            $this->info('No active email accounts found.');

            return;
        }

        $count = 0;
        foreach ($accounts as $account) {
            dispatch(new SyncEmailAccount(emailAccount: $account));
            $count++;
        }

        $this->info("Queued sync for {$count} email account(s).");
    }
}
