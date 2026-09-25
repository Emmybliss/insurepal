<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\Email\EmailSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncEmailAccount implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public array $backoff = [10, 30, 60];

    public function __construct(
        public EmailAccount $emailAccount,
    ) {
        $this->onQueue('email');
    }

    public function handle(EmailSyncService $syncService): void
    {
        if (! $this->emailAccount->is_active) {
            return;
        }

        $syncService->syncAccount($this->emailAccount);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SyncEmailAccount job failed permanently', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
            'error' => $exception->getMessage(),
        ]);

        $this->emailAccount->update([
            'sync_status' => 'error',
            'sync_error' => 'Sync failed: '.$exception->getMessage(),
        ]);
    }

    public function viaQueue(): string
    {
        return 'email';
    }
}
