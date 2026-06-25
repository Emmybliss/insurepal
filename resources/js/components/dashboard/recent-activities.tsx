import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Receipt, RefreshCw, Shield, UserPlus } from 'lucide-react';

const activities = [
    {
        id: 1,
        type: 'policy_created',
        title: 'New Auto Policy Created',
        description: 'Policy #AP-2024-001 for John Smith - Toyota Camry 2020',
        user: 'Sarah Johnson',
        time: '2 hours ago',
        icon: Shield,
        iconColor: 'text-success',
        badge: 'New Policy',
    },
    {
        id: 2,
        type: 'customer_added',
        title: 'New Customer Registered',
        description: 'Michael Davis - Lagos, Nigeria',
        user: 'David Wilson',
        time: '4 hours ago',
        icon: UserPlus,
        iconColor: 'text-primary',
        badge: 'Customer',
    },
    {
        id: 3,
        type: 'quote_generated',
        title: 'Quote Generated',
        description: 'Life Insurance Quote #LQ-2024-045 - ₦2.5M coverage',
        user: 'Emily Chen',
        time: '6 hours ago',
        icon: FileText,
        iconColor: 'text-accent',
        badge: 'Quote',
    },
    {
        id: 4,
        type: 'payment_received',
        title: 'Payment Received',
        description: 'Premium payment for Policy #HP-2024-023 - ₦145,000',
        user: 'System',
        time: '8 hours ago',
        icon: Receipt,
        iconColor: 'text-success',
        badge: 'Payment',
    },
    {
        id: 5,
        type: 'renewal_reminder',
        title: 'Renewal Reminder Sent',
        description: 'Policy #AP-2023-156 expires in 30 days',
        user: 'System',
        time: '12 hours ago',
        icon: RefreshCw,
        iconColor: 'text-warning',
        badge: 'Reminder',
    },
    {
        id: 6,
        type: 'policy_expiring',
        title: 'Policy Expiring Soon',
        description: 'Property Insurance #PP-2023-089 expires tomorrow',
        user: 'System',
        time: '1 day ago',
        icon: AlertTriangle,
        iconColor: 'text-destructive',
        badge: 'Alert',
    },
];

export function RecentActivities() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest activities across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                                <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                    {activity.badge}
                                </Badge>
                            </div>

                            <p className="mb-2 truncate text-sm text-muted-foreground">{activity.description}</p>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src="/images/user-placeholder.png" />
                                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                        {activity.user
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{activity.user}</span>
                                <span>•</span>
                                <span>{activity.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
