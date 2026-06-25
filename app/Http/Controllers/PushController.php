<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PushController extends Controller
{
    /**
     * Store a new push subscription for the authenticated user.
     * Called by the frontend after the user grants notification permission.
     *
     * POST /push/subscribe
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'subscription' => ['required', 'string'],
        ]);

        $data = json_decode($request->input('subscription'), true);

        if (! isset($data['endpoint'], $data['keys']['p256dh'], $data['keys']['auth'])) {
            return back()->withErrors(['subscription' => 'Invalid subscription payload.']);
        }

        $user = Auth::user();
        $tenantId = $user->tenant_id ?? null;

        // Upsert by endpoint so re-subscribes on the same browser update the keys
        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => $user->id,
                'tenant_id' => $tenantId,
                'public_key' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'content_encoding' => $data['contentEncoding'] ?? 'aesgcm',
            ]
        );

        Log::info('[PWA] Push subscription saved', ['user_id' => $user->id, 'endpoint_prefix' => substr($data['endpoint'], 0, 40)]);

        return back()->with('success', 'Push notifications enabled.');
    }

    /**
     * Remove the push subscription for the authenticated user.
     * Called when the user disables notifications.
     *
     * DELETE /push/subscribe
     */
    public function unsubscribe(Request $request)
    {
        $user = Auth::user();

        // Remove all subscriptions for this user if no specific endpoint provided,
        // or just the one matching the current browser's endpoint
        $endpoint = $request->input('endpoint');

        $query = PushSubscription::where('user_id', $user->id);

        if ($endpoint) {
            $query->where('endpoint', $endpoint);
        }

        $deleted = $query->delete();

        Log::info('[PWA] Push subscription(s) removed', ['user_id' => $user->id, 'count' => $deleted]);

        return back()->with('success', 'Push notifications disabled.');
    }

    /**
     * Send a test notification to the authenticated user (development only).
     *
     * POST /push/test
     */
    public function test(Request $request)
    {
        if (! app()->environment('local', 'development')) {
            abort(403, 'Test notifications only available in development.');
        }

        $user = Auth::user();
        /** @var \App\Services\PushNotificationService $pushService */
        $pushService = app(\App\Services\PushNotificationService::class);

        $pushService->sendToUser($user, [
            'title' => '🔔 InsurePal',
            'body' => 'Push notifications are working!',
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-72.png',
            'url' => '/dashboard',
        ]);

        return back()->with('success', 'Test notification sent.');
    }
}
