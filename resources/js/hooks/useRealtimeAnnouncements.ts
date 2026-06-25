import { useEffect, useState } from 'react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    type: string;
    expires_at: string | null;
    created_at: string;
}

interface UseRealtimeAnnouncementsOptions {
    tenantId: number;
    onAnnouncement?: (announcement: Announcement) => void;
    onError?: (error: any) => void;
}

export function useRealtimeAnnouncements({ tenantId, onAnnouncement, onError }: UseRealtimeAnnouncementsOptions) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Laravel Echo is not available');
            return;
        }

        const channel = window.Echo.private(`tenant.${tenantId}.announcements`);

        channel
            .listen('.announcement.created', (data: Announcement) => {
                console.log('Received announcement:', data);

                setAnnouncements((prev) => {
                    const exists = prev.some((a) => a.id === data.id);
                    if (exists) {
                        return prev;
                    }
                    return [data, ...prev];
                });

                if (onAnnouncement) {
                    onAnnouncement(data);
                }
            })
            .error((error: any) => {
                console.error('Echo error:', error);
                if (onError) {
                    onError(error);
                }
            });

        channel.subscribed(() => {
            setIsConnected(true);
            console.log('Connected to announcements channel');
        });

        channel.error((error: any) => {
            setIsConnected(false);
            console.error('Failed to connect to announcements channel:', error);
        });

        return () => {
            window.Echo.leave(`tenant.${tenantId}.announcements`);
        };
    }, [tenantId, onAnnouncement, onError]);

    return {
        announcements,
        isConnected,
    };
}
