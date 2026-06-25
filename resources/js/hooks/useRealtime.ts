import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface RealtimeData {
    notifications: any[];
    messages: any[];
    announcements: any[];
}

interface UseRealtimeOptions {
    userId: number;
    tenantId: number;
    onNotification?: (notification: any) => void;
    onMessage?: (message: any) => void;
    onAnnouncement?: (announcement: any) => void;
    onError?: (error: any) => void;
}

export function useRealtime({ userId, tenantId, onNotification, onMessage, onAnnouncement, onError }: UseRealtimeOptions) {
    const [data, setData] = useState<RealtimeData>({
        notifications: [],
        messages: [],
        announcements: [],
    });
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        notifications: boolean;
        messages: boolean;
        announcements: boolean;
    }>({
        notifications: false,
        messages: false,
        announcements: false,
    });

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Laravel Echo is not available');
            return;
        }

        const channels = {
            notifications: window.Echo.private(`notifications.${userId}`),
            messages: window.Echo.private(`messages.${userId}`),
            announcements: window.Echo.channel(`tenant.${tenantId}`),
        };

        // Notifications channel
        channels.notifications
            .listen('.notification.sent', (notification: any) => {
                console.log('Received notification:', notification);
                setData((prev) => ({
                    ...prev,
                    notifications: [notification, ...prev.notifications],
                }));
                if (onNotification) onNotification(notification);
            })
            .subscribed(() => {
                setConnectionStatus((prev) => ({ ...prev, notifications: true }));
                console.log('Connected to notifications channel');
            })
            .error((error: any) => {
                setConnectionStatus((prev) => ({ ...prev, notifications: false }));
                console.error('Notifications channel error:', error);
                if (onError) onError(error);
            });

        // Messages channel
        channels.messages
            .listen('.message.sent', (message: any) => {
                console.log('Received message:', message);
                setData((prev) => ({
                    ...prev,
                    messages: [message, ...prev.messages],
                }));
                if (onMessage) onMessage(message);
            })
            .subscribed(() => {
                setConnectionStatus((prev) => ({ ...prev, messages: true }));
                console.log('Connected to messages channel');
            })
            .error((error: any) => {
                setConnectionStatus((prev) => ({ ...prev, messages: false }));
                console.error('Messages channel error:', error);
                if (onError) onError(error);
            });

        // Announcements channel
        channels.announcements
            .listen('.announcement.created', (announcement: any) => {
                console.log('Received announcement:', announcement);
                setData((prev) => ({
                    ...prev,
                    announcements: [announcement, ...prev.announcements],
                }));
                if (onAnnouncement) onAnnouncement(announcement);
            })
            .subscribed(() => {
                setConnectionStatus((prev) => ({ ...prev, announcements: true }));
                console.log('Connected to announcements channel');
            })
            .error((error: any) => {
                setConnectionStatus((prev) => ({ ...prev, announcements: false }));
                console.error('Announcements channel error:', error);
                if (onError) onError(error);
            });

        // Update overall connection status
        const allConnected = Object.values(connectionStatus).every((status) => status);
        setIsConnected(allConnected);

        return () => {
            Object.values(channels).forEach((channel) => {
                if (channel && typeof channel.leave === 'function') {
                    channel.leave();
                }
            });
        };
    }, [userId, tenantId, onNotification, onMessage, onAnnouncement, onError]);

    const markNotificationAsRead = (notificationId: string) => {
        router.post(
            '/notifications/mark-as-read',
            {
                notification_ids: [notificationId],
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const markAllNotificationsAsRead = () => {
        router.post(
            '/notifications/mark-all-as-read',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const markMessageAsRead = (messageId: string) => {
        router.post(
            '/messages/mark-as-read',
            {
                message_ids: [messageId],
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return {
        data,
        isConnected,
        connectionStatus,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        markMessageAsRead,
    };
}
