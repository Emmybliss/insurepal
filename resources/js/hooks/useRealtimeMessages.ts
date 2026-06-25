import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Message {
    id: string;
    subject: string;
    body: string;
    priority: string;
    sender: {
        id: number;
        name: string;
        email: string;
    };
    sent_at: string | null;
    created_at: string;
}

interface UseRealtimeMessagesOptions {
    userId: number;
    onMessage?: (message: Message) => void;
    onError?: (error: any) => void;
}

export function useRealtimeMessages({ userId, onMessage, onError }: UseRealtimeMessagesOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Laravel Echo is not available');
            return;
        }

        const channel = window.Echo.private(`messages.${userId}`);

        channel
            .listen('.message.sent', (data: Message) => {
                console.log('Received message:', data);

                setMessages((prev) => [data, ...prev]);

                if (onMessage) {
                    onMessage(data);
                }
            })
            .error((error: any) => {
                console.error('Echo error:', error);
                if (onError) {
                    onError(error);
                }
            });

        // Connection status
        channel.subscribed(() => {
            setIsConnected(true);
            console.log('Connected to messages channel');
        });

        channel.error((error: any) => {
            setIsConnected(false);
            console.error('Failed to connect to messages channel:', error);
        });

        return () => {
            window.Echo.leave(`messages.${userId}`);
        };
    }, [userId, onMessage, onError]);

    const markAsRead = (messageId: string) => {
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
        messages,
        isConnected,
        markAsRead,
    };
}
