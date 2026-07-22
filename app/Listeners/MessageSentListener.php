<?php

namespace App\Listeners;

use App\Events\MessageSent;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class MessageSentListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected PushNotificationService $pushNotification
    ) {}

    public function handle(MessageSent $event): void
    {
        try {
            $this->pushNotification->sendToUser($event->recipient, [
                'title' => 'New Message: '.$event->message->subject,
                'body' => mb_substr(strip_tags($event->message->body), 0, 200),
                'url' => '/messages/'.$event->message->id,
                'tag' => 'message-'.$event->message->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send push notification for message', [
                'message_id' => $event->message->id,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Message sent', [
            'message_id' => $event->message->id,
            'recipient_id' => $event->recipient->id,
            'sender_id' => $event->message->sender_id,
        ]);
    }
}
