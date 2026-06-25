<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject' => config('services.vapid.subject', 'mailto:hello@insurepal.com'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setReuseVAPIDHeaders(true);
        $this->webPush->setDefaultOptions([
            'TTL' => 2419200, // 28 days
        ]);
    }

    /**
     * Send a push notification to all subscriptions belonging to a user.
     *
     * @param  array{title: string, body: string, icon?: string, badge?: string, url?: string, tag?: string}  $payload
     */
    public function sendToUser(User $user, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)->get();
        $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send a push notification to all subscriptions for a given tenant.
     */
    public function sendToTenant(int $tenantId, array $payload): void
    {
        $subscriptions = PushSubscription::where('tenant_id', $tenantId)->get();
        $this->sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send a notification to a collection of push subscriptions.
     */
    private function sendToSubscriptions(Collection $subscriptions, array $payload): void
    {
        if ($subscriptions->isEmpty()) {
            return;
        }

        $jsonPayload = json_encode(array_merge([
            'title' => 'InsurePal',
            'body' => '',
            'icon' => '/icons/icon-192.png',
            'badge' => '/icons/icon-72.png',
            'url' => '/dashboard',
            'tag' => 'insurepal-notification',
            'renotify' => false,
            'requireInteraction' => false,
        ], $payload));

        $staleEndpoints = [];

        foreach ($subscriptions as $sub) {
            try {
                $subscription = Subscription::create($sub->toWebPushSubscription());
                $this->webPush->queueNotification($subscription, $jsonPayload);
            } catch (\Exception $e) {
                Log::error('[PWA] Failed to queue push notification', [
                    'subscription_id' => $sub->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Flush the queue and handle expired subscriptions
        foreach ($this->webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();

            if (! $report->isSuccess()) {
                $statusCode = $report->getResponse()?->getStatusCode();
                Log::warning('[PWA] Push failed', [
                    'endpoint_prefix' => substr($endpoint, 0, 40),
                    'reason' => $report->getReason(),
                    'status' => $statusCode,
                ]);

                // 410 Gone or 404 = subscription expired/unregistered on browser side
                if (in_array($statusCode, [404, 410], true)) {
                    $staleEndpoints[] = $endpoint;
                }
            }
        }

        // Clean up expired subscriptions
        if (! empty($staleEndpoints)) {
            PushSubscription::whereIn('endpoint', $staleEndpoints)->delete();
            Log::info('[PWA] Removed stale push subscriptions', ['count' => count($staleEndpoints)]);
        }
    }
}
