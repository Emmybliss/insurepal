import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Check, Trash2, X } from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    data?: any;
}

interface NotificationShowProps {
    notification: Notification;
}

export default function NotificationShow({ notification }: NotificationShowProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'default';
            case 'low':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'system':
                return '🔧';
            case 'payment':
                return '💳';
            case 'policy':
                return '📄';
            case 'claim':
                return '⚠️';
            case 'message':
                return '💬';
            default:
                return '🔔';
        }
    };

    const handleMarkAsRead = () => {
        router.post('/notifications/mark-as-read', {
            notification_ids: [notification.id],
        });
    };

    const handleMarkAsUnread = () => {
        router.post('/notifications/mark-as-unread', {
            notification_ids: [notification.id],
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this notification?')) {
            router.delete(`/notifications/${notification.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title={`Notification - ${notification.title}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/notifications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Notifications
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2">
                        {!notification.read_at ? (
                            <Button onClick={handleMarkAsRead} variant="outline" size="sm">
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Read
                            </Button>
                        ) : (
                            <Button onClick={handleMarkAsUnread} variant="outline" size="sm">
                                <X className="mr-2 h-4 w-4" />
                                Mark as Unread
                            </Button>
                        )}

                        <Button onClick={handleDelete} variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Notification Details */}
                <Card className={cn('transition-colors', !notification.read_at && 'border-l-4 border-l-orange-500 bg-orange-50/50')}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                                <div>
                                    <CardTitle className={cn('text-2xl', !notification.read_at && 'font-bold')}>{notification.title}</CardTitle>
                                    <CardDescription className="mt-2">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {!notification.read_at && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                        New
                                    </Badge>
                                )}
                                <Badge variant={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Message Content */}
                        <div className="prose max-w-none">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                        </div>

                        {/* Additional Data */}
                        {notification.data && Object.keys(notification.data).length > 0 && (
                            <div className="border-t pt-6">
                                <h3 className="mb-4 text-lg font-semibold">Additional Information</h3>
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <pre className="overflow-x-auto text-sm text-muted-foreground">{JSON.stringify(notification.data, null, 2)}</pre>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="border-t pt-6">
                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                <div>
                                    <span className="font-medium text-muted-foreground">Type:</span>
                                    <span className="ml-2 capitalize">{notification.type.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Priority:</span>
                                    <span className="ml-2 capitalize">{notification.priority}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Status:</span>
                                    <span className="ml-2">
                                        {notification.read_at ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                Read
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                                Unread
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Created:</span>
                                    <span className="ml-2">{new Date(notification.created_at).toLocaleString()}</span>
                                </div>
                                {notification.read_at && (
                                    <div>
                                        <span className="font-medium text-muted-foreground">Read:</span>
                                        <span className="ml-2">{new Date(notification.read_at).toLocaleString()}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium text-muted-foreground">Last Updated:</span>
                                    <span className="ml-2">{new Date(notification.updated_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <Link href="/notifications" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Notifications
                    </Link>

                    <div className="flex items-center space-x-2">
                        {!notification.read_at ? (
                            <Button onClick={handleMarkAsRead} variant="default">
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Read
                            </Button>
                        ) : (
                            <Button onClick={handleMarkAsUnread} variant="outline">
                                <X className="mr-2 h-4 w-4" />
                                Mark as Unread
                            </Button>
                        )}

                        <Button onClick={handleDelete} variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Notification
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
