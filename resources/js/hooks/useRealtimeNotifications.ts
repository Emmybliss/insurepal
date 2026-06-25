import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Notification {
    id: number | string;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    priority: string;
    read_at?: string | null;
    created_at: string;
}

interface UseRealtimeNotificationsOptions {
    userId: number;
    tenantId: number;
    onNotification?: (notification: Notification) => void;
    onError?: (error: unknown) => void;
}

export function useRealtimeNotifications({
    userId,
    tenantId,
    onNotification,
    onError,
}: UseRealtimeNotificationsOptions) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInitialData = async () => {
        try {
            const [recentRes, countRes] = await Promise.all([
                fetch('/api/notifications/recent'),
                fetch('/api/notifications/unread-count'),
            ]);

            if (!recentRes.ok || !countRes.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const recentData = await recentRes.json();
            const countData = await countRes.json();

            setNotifications(recentData);
            setUnreadCount(countData.count);
        } catch (error) {
            console.error('Failed to fetch initial notification data:', error);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!userId || !tenantId) {
            return;
        }

        fetchInitialData();
    }, [userId, tenantId]);

    useEffect(() => {
        if (!window.Echo || !userId || !tenantId) {
            return;
        }

        const channel = window.Echo.private(`tenant.${tenantId}.notifications.${userId}`);

        channel
            .listen('.notification.sent', (data: Notification) => {
                console.log('Received notification via Reverb:', data);

                setNotifications((prev) => {
                    const exists = prev.some((n) => n.id === data.id);
                    if (exists) return prev;
                    return [data, ...prev];
                });

                if (!data.read_at) {
                    setUnreadCount((prev) => prev + 1);
                }

                if (onNotification) {
                    onNotification(data);
                }
            })
            .error((error: unknown) => {
                console.error('Reverb error:', error);
                setIsConnected(false);
                if (onError) {
                    onError(error);
                }
            });

        channel.subscribed(() => {
            setIsConnected(true);
            console.log('Connected to notifications channel via Reverb');
        });

        return () => {
            window.Echo.leave(`tenant.${tenantId}.notifications.${userId}`);
            setIsConnected(false);
        };
    }, [userId, tenantId, onNotification, onError]);

    const markAsRead = (notificationId: number | string) => {
        const id = typeof notificationId === 'string' ? parseInt(notificationId, 10) : notificationId;
        router.post(
            '/notifications/mark-as-read',
            { notification_ids: [id] },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setNotifications((prev) =>
                        prev.map((n) =>
                            String(n.id) === String(notificationId) ? { ...n, read_at: new Date().toISOString() } : n,
                        ),
                    );
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                },
            },
        );
    };

    const markAllAsRead = () => {
        router.post(
            '/notifications/mark-all-as-read',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setNotifications((prev) =>
                        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
                    );
                    setUnreadCount(0);
                },
            },
        );
    };

    return {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchInitialData,
    };
}