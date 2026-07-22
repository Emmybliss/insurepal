<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\Email\EmailSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncEmailAccount implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public EmailAccount $emailAccount,
    ) {
        $this->onQueue('email');
    }

    public function handle(EmailSyncService $syncService): void
    {
        $syncService->syncAccount($this->emailAccount);
    }

    public function viaQueue(): string
    {
        return 'email';
    }
}
