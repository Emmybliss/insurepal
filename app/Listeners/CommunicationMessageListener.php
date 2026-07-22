<?php

namespace App\Listeners;

use App\Events\CommunicationMessageSent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CommunicationMessageListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(CommunicationMessageSent $event): void
    {
        $message = $event->message;

        try {
            $message->thread->touch();
        } catch (\Exception $e) {
            Log::error('Failed to update thread status', [
                'thread_id' => $message->thread_id,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Communication message sent', [
            'message_id' => $message->id,
            'thread_id' => $message->thread_id,
            'sender_id' => $event->sender->id,
        ]);
    }
}
