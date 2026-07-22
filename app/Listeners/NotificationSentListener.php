<?php

namespace App\Listeners;

use App\Events\NotificationSent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotificationSentListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(NotificationSent $event): void
    {
        Log::info('Notification sent', [
            'notification_id' => $event->notification->id,
            'user_id' => $event->user->id,
            'type' => $event->notification->type,
            'title' => $event->notification->title,
        ]);
    }
}
