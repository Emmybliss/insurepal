import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellOff, Check, Filter, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

interface NotificationIndexProps {
    notifications: {
        data: Notification[];
        links: any[];
        meta: any;
    };
    counts: {
        all: number;
        unread: number;
        read: number;
    };
    types: Array<{
        value: string;
        label: string;
    }>;
    filters: {
        status?: string;
        type?: string;
        priority?: string;
    };
}

export default function NotificationIndex({ notifications, counts, types, filters }: NotificationIndexProps) {
    const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

    const handleSelectAll = () => {
        if (selectedNotifications.length === notifications.data.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(notifications.data.map((n) => n.id));
        }
    };

    const handleSelectNotification = (id: number) => {
        setSelectedNotifications((prev) => (prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]));
    };

    const handleBulkAction = async (action: 'mark-read' | 'mark-unread' | 'delete') => {
        if (selectedNotifications.length === 0) return;

        setIsBulkActionLoading(true);

        try {
            if (action === 'delete') {
                router.post('/notifications/bulk-delete', {
                    notification_ids: selectedNotifications,
                });
            } else {
                const endpoint = action === 'mark-read' ? '/notifications/mark-as-read' : '/notifications/mark-as-unread';
                router.post(endpoint, {
                    notification_ids: selectedNotifications,
                });
            }
            setSelectedNotifications([]);
        } catch (error) {
            console.error('Bulk action failed:', error);
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/mark-all-as-read');
    };

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

    return (
        <AppLayout>
            <Head title="Notifications" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground">Manage your notifications and stay updated</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                            <Check className="mr-2 h-4 w-4" />
                            Mark All Read
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.all}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread</CardTitle>
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{counts.unread}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Read</CardTitle>
                            <Check className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{counts.read}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    router.get(
                                        '/notifications',
                                        {
                                            ...filters,
                                            status: value === 'all' ? undefined : value,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="unread">Unread</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => {
                                    router.get(
                                        '/notifications',
                                        {
                                            ...filters,
                                            type: value === 'all' ? undefined : value,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {types.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedNotifications.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-orange-800">{selectedNotifications.length} notification(s) selected</span>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleBulkAction('mark-read')} disabled={isBulkActionLoading} size="sm" variant="outline">
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark Read
                                    </Button>
                                    <Button
                                        onClick={() => handleBulkAction('mark-unread')}
                                        disabled={isBulkActionLoading}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Mark Unread
                                    </Button>
                                    <Button onClick={() => handleBulkAction('delete')} disabled={isBulkActionLoading} size="sm" variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notifications List */}
                <div className="space-y-4">
                    {notifications.data.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="py-8 text-center">
                                    <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-medium">No notifications found</h3>
                                    <p className="text-muted-foreground">You don't have any notifications matching your current filters.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Select All */}
                            <div className="flex items-center space-x-2 rounded-lg border p-4">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedNotifications.length === notifications.data.length}
                                    onCheckedChange={handleSelectAll}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium">
                                    Select All ({notifications.data.length})
                                </label>
                            </div>

                            {notifications.data.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        'transition-colors hover:bg-muted/50',
                                        !notification.read_at && 'border-l-4 border-l-orange-500 bg-orange-50/50',
                                    )}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start space-x-4">
                                            <Checkbox
                                                checked={selectedNotifications.includes(notification.id)}
                                                onCheckedChange={() => handleSelectNotification(notification.id)}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-lg">{getTypeIcon(notification.type)}</span>
                                                        <h3 className={cn('text-lg font-medium', !notification.read_at && 'font-semibold')}>
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.read_at && (
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                                                New
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="mt-2 text-muted-foreground">{notification.message}</p>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={`/notifications/${notification.id}`}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {!notification.read_at ? (
                                                            <Button
                                                                onClick={() => {
                                                                    router.post('/notifications/mark-as-read', {
                                                                        notification_ids: [notification.id],
                                                                    });
                                                                }}
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                <Check className="mr-2 h-4 w-4" />
                                                                Mark Read
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => {
                                                                    router.post('/notifications/mark-as-unread', {
                                                                        notification_ids: [notification.id],
                                                                    });
                                                                }}
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                <X className="mr-2 h-4 w-4" />
                                                                Mark Unread
                                                            </Button>
                                                        )}

                                                        <Button
                                                            onClick={() => {
                                                                router.delete(`/notifications/${notification.id}`);
                                                            }}
                                                            size="sm"
                                                            variant="destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {notifications.links && notifications.links.length > 3 && (
                    <div className="flex items-center justify-center space-x-2">
                        {notifications.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
