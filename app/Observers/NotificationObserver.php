<?php

namespace App\Observers;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationObserver
{
    public function created(Notification $notification): void
    {
        Log::debug('NotificationObserver: Notification created', [
            'notification_id' => $notification->id,
            'user_id' => $notification->user_id,
            'tenant_id' => $notification->tenant_id,
        ]);

        $user = User::find($notification->user_id);

        if ($user) {
            Log::debug('NotificationObserver: Dispatching NotificationSent event', [
                'user_id' => $user->id,
                'user_tenant_id' => $user->tenant_id,
            ]);
            event(new NotificationSent($notification, $user));
        } else {
            Log::warning('NotificationObserver: User not found', [
                'user_id' => $notification->user_id,
            ]);
        }
    }
}
