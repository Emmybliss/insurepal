import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Link, usePage, router, PageProps } from '@inertiajs/react';
import { AlertCircle, Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

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

interface AuthProps {
    user?: {
        id: number;
        tenant_id?: number;
        name: string;
    };
    tenant_id?: number;
}

const NotificationIcon: React.FC = () => {
    const pageProps = usePage().props as PageProps & { auth: AuthProps };
    const { auth } = pageProps;
    const user = auth?.user;
    const tenantId = auth?.tenant_id ?? user?.tenant_id;
    const [markingIds, setMarkingIds] = useState<Set<number | string>>(new Set());

    const {
        notifications: realtimeNotifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
    } = useRealtimeNotifications({
        userId: user?.id,
        tenantId: tenantId,
        onNotification: (notification) => {
            toast(notification.title, {
                description: notification.message,
                duration: 4000,
            });
        },
        onError: (error) => {
            console.error('Realtime notification error:', error);
        },
    });

    const allNotifications = realtimeNotifications;

    const getNotificationIcon = (type: string) => {
        const iconProps = { size: 20 };
        switch (type) {
            case 'claim_approved':
            case 'policy_renewed':
                return <CheckCircle {...iconProps} className="text-green-500" />;
            case 'claim_rejected':
            case 'payment_failed':
                return <XCircle {...iconProps} className="text-red-500" />;
            case 'additional_info_requested':
            case 'payment_due_reminder':
                return <AlertCircle {...iconProps} className="text-yellow-500" />;
            case 'document_ready':
            case 'policy_expiry_reminder':
            default:
                return <Info {...iconProps} className="text-blue-500" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    };

    const handleMarkAsRead = (notificationId: number | string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setMarkingIds((prev) => new Set(prev).add(notificationId));

        markAsRead(notificationId);

        setTimeout(() => {
            setMarkingIds((prev) => {
                const next = new Set(prev);
                next.delete(notificationId);
                return next;
            });
        }, 500);
    };

    const handleNotificationClick = (notification: Notification) => {
        const isUnread = !notification.read_at;
        const isMarking = markingIds.has(notification.id);

        if (isMarking) {
            return;
        }

        if (isUnread) {
            handleMarkAsRead(notification.id);
        }

        router.visit(`/notifications/${notification.id}`);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="flex justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">Notifications</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isConnected ? 'Live' : 'Polling'}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Mark all read
                    </Button>
                </div>
                <ScrollArea className="h-72">
                    {allNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <Bell className="mb-2 h-8 w-8" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        allNotifications.map((notification) => {
                            const isUnread = !notification.read_at;
                            const isMarking = markingIds.has(notification.id);
                            return (
                                <div
                                    key={notification.id}
                                    className={`group relative flex cursor-pointer items-start border-b p-4 transition-colors ${
                                        isUnread
                                            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-2 border-l-blue-500 hover:bg-blue-100/50'
                                            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    } ${isMarking ? 'opacity-50 pointer-events-none' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mr-3 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                                    <div className="flex-grow min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium text-gray-600'}`}>
                                                {notification.title}
                                            </p>
                                            {isUnread && (
                                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className={`text-sm ${isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {notification.message}
                                        </p>
                                        <p className={`mt-1 text-xs ${isUnread ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                    <div className="ml-2 flex flex-col gap-1 flex-shrink-0">
                                        {isUnread && !isMarking && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs bg-white dark:bg-gray-700"
                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            >
                                                Mark Read
                                            </Button>
                                        )}
                                        {isMarking && (
                                            <span className="text-xs text-gray-500">...</span>
                                        )}
                                        <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </ScrollArea>
                <Link href="/notifications" className="flex flex-col items-center justify-center pb-2 text-sm hover:text-primary">
                    View all notifications
                </Link>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationIcon;
