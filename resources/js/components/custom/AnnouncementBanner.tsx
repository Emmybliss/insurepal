import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, Info, Shield, Star, Wrench, X } from 'lucide-react';
import React, { useState } from 'react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    type: string;
    expires_at: string | null;
    created_at: string;
}

const AnnouncementBanner: React.FC<Announcement> = () => {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
    const [isVisible, setIsVisible] = useState(true);

    const { announcements, isConnected } = useRealtimeAnnouncements({
        tenantId: user?.tenant_id,
        onAnnouncement: (announcement) => {
            console.log('New announcement received:', announcement);
        },
        onError: (error) => {
            console.error('Realtime announcement error:', error);
        },
    });

    // Get active announcements that haven't been dismissed
    const activeAnnouncements = announcements.filter(
        (announcement) =>
            !dismissedAnnouncements.has(announcement.id) && (!announcement.expires_at || new Date(announcement.expires_at) > new Date()),
    );

    const getAnnouncementIcon = (type: string) => {
        const iconProps = { size: 20 };
        switch (type) {
            case 'maintenance':
                return <Wrench {...iconProps} className="text-orange-500" />;
            case 'security':
                return <Shield {...iconProps} className="text-red-500" />;
            case 'feature':
                return <Star {...iconProps} className="text-purple-500" />;
            case 'update':
                return <Info {...iconProps} className="text-blue-500" />;
            default:
                return <AlertTriangle {...iconProps} className="text-yellow-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-red-200 bg-red-50 text-red-800';
            case 'medium':
                return 'border-yellow-200 bg-yellow-50 text-yellow-800';
            case 'low':
                return 'border-green-200 bg-green-50 text-green-800';
            default:
                return 'border-gray-200 bg-gray-50 text-gray-800';
        }
    };

    const dismissAnnouncement = (announcementId: string) => {
        setDismissedAnnouncements((prev) => new Set([...prev, announcementId]));
    };

    const dismissAll = () => {
        const allIds = activeAnnouncements.map((a) => a.id);
        setDismissedAnnouncements((prev) => new Set([...prev, ...allIds]));
    };

    if (!isVisible || activeAnnouncements.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {activeAnnouncements.map((announcement) => (
                <Alert key={announcement.id} className={`${getPriorityColor(announcement.priority)} border-l-4`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                            {getAnnouncementIcon(announcement.type)}
                            <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <AlertTitle className="text-sm font-semibold">{announcement.title}</AlertTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {announcement.type}
                                    </Badge>
                                    <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                        {announcement.priority}
                                    </Badge>
                                </div>
                                <AlertDescription className="text-sm">{announcement.content}</AlertDescription>
                                {announcement.expires_at && (
                                    <p className="mt-1 text-xs text-gray-500">Expires: {new Date(announcement.expires_at).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => dismissAnnouncement(announcement.id)} className="ml-2">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            ))}

            {activeAnnouncements.length > 1 && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={dismissAll}>
                        Dismiss all
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementBanner;
