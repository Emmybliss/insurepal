import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime } from '@/lib/utils';
import { ClaimActivity } from '@/types/claim';
import { Activity } from 'lucide-react';

interface ClaimActivityLogProps {
    activities: ClaimActivity[];
}

export function ClaimActivityLog({ activities }: ClaimActivityLogProps) {
    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Activity Log
                    </CardTitle>
                    <CardDescription>Track all actions and changes to this claim</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">No activity recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                </CardTitle>
                <CardDescription>Track all actions and changes to this claim</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex gap-4 border-l-2 border-primary pl-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{activity.description}</p>
                                        <span className="text-sm text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">by {activity.user?.name || 'System'}</p>
                                    {activity.properties && (
                                        <div className="mt-2 rounded bg-muted p-2 text-sm">
                                            <p className="font-medium">Changes:</p>
                                            <pre className="mt-1 text-xs">{JSON.stringify(activity.properties, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
