<?php

namespace App\Jobs;

use App\Models\EmailAttachment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessEmailAttachment implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public EmailAttachment $emailAttachment,
    ) {
        $this->onQueue('email');
    }

    public function handle(): void
    {
        try {
            if (! Storage::exists($this->emailAttachment->storage_path)) {
                Log::warning('Attachment file not found', [
                    'attachment_id' => $this->emailAttachment->id,
                    'path' => $this->emailAttachment->storage_path,
                ]);

                return;
            }

            $this->emailAttachment->touch();

            Log::info('Email attachment processed', [
                'attachment_id' => $this->emailAttachment->id,
                'filename' => $this->emailAttachment->filename,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to process email attachment', [
                'attachment_id' => $this->emailAttachment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function viaQueue(): string
    {
        return 'email';
    }
}
