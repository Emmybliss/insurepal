import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface UsePushNotificationsOptions {
    vapidPublicKey: string;
}

interface PushNotificationState {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Converts a URL-safe base64 VAPID public key string to a Uint8Array
 * as required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications({ vapidPublicKey }: UsePushNotificationsOptions) {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator,
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
    });

    // Check if we already have an active subscription on mount
    useEffect(() => {
        if (!state.isSupported) return;

        navigator.serviceWorker.ready
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => {
                setState((prev) => ({ ...prev, isSubscribed: subscription !== null }));
            })
            .catch(console.error);
    }, [state.isSupported]);

    const subscribe = async (): Promise<void> => {
        if (!state.isSupported || !vapidPublicKey) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // 1. Request notification permission
            const permission = await Notification.requestPermission();
            setState((prev) => ({ ...prev, permission }));

            if (permission !== 'granted') {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Notification permission was denied.',
                }));
                return;
            }

            // 2. Wait for SW to be ready, get push subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            // 3. Send subscription to backend via Inertia
            await new Promise<void>((resolve, reject) => {
                router.post(
                    '/push/subscribe',
                    {
                        subscription: JSON.stringify(subscription),
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => resolve(),
                        onError: (errors) => reject(new Error(Object.values(errors).join(', '))),
                    },
                );
            });

            setState((prev) => ({ ...prev, isSubscribed: true, isLoading: false }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to subscribe to push notifications.';
            setState((prev) => ({ ...prev, isLoading: false, error: message }));
            console.error('[PWA] Push subscribe error:', err);
        }
    };

    const unsubscribe = async (): Promise<void> => {
        if (!state.isSupported) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            // Notify backend to remove the subscription
            await new Promise<void>((resolve, reject) => {
                router.delete('/push/subscribe', {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: (errors) => reject(new Error(Object.values(errors).join(', '))),
                });
            });

            setState((prev) => ({ ...prev, isSubscribed: false, isLoading: false }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unsubscribe.';
            setState((prev) => ({ ...prev, isLoading: false, error: message }));
            console.error('[PWA] Push unsubscribe error:', err);
        }
    };

    return { ...state, subscribe, unsubscribe };
}
