import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Bell, Mail, MessageSquare, Save, Smartphone } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface NotificationPreferences {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    marketing_notifications: boolean;
    policy_expiry_notifications: boolean;
    payment_due_notifications: boolean;
    claim_status_notifications: boolean;
    system_maintenance_notifications: boolean;
}

interface Props {
    notification_preferences?: NotificationPreferences;
}

export default function NotificationSettings({ notification_preferences }: Props) {
    const { data, setData, patch, processing } = useForm<NotificationPreferences>({
        email_notifications: notification_preferences?.email_notifications ?? true,
        sms_notifications: notification_preferences?.sms_notifications ?? false,
        push_notifications: notification_preferences?.push_notifications ?? true,
        marketing_notifications: notification_preferences?.marketing_notifications ?? false,
        policy_expiry_notifications: notification_preferences?.policy_expiry_notifications ?? true,
        payment_due_notifications: notification_preferences?.payment_due_notifications ?? true,
        claim_status_notifications: notification_preferences?.claim_status_notifications ?? true,
        system_maintenance_notifications: notification_preferences?.system_maintenance_notifications ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('settings.notifications.update'), {
            onStart: () => {
                toast.loading('Updating notification preferences...', { id: 'update-notifications' });
            },
            onSuccess: () => {
                toast.success('Notification preferences updated successfully', {
                    id: 'update-notifications',
                    description: 'Your notification settings have been saved',
                    duration: 4000,
                });
            },
            onError: () => {
                toast.error('Failed to update notification preferences', {
                    id: 'update-notifications',
                    description: 'Please check the form errors and try again',
                    duration: 5000,
                });
            },
        });
    };

    const notificationTypes = [
        {
            key: 'email_notifications' as keyof NotificationPreferences,
            label: 'Email Notifications',
            description: 'Receive notifications via email',
            icon: Mail,
        },
        {
            key: 'sms_notifications' as keyof NotificationPreferences,
            label: 'SMS Notifications',
            description: 'Receive notifications via SMS',
            icon: Smartphone,
        },
        {
            key: 'push_notifications' as keyof NotificationPreferences,
            label: 'Push Notifications',
            description: 'Receive browser push notifications',
            icon: Bell,
        },
        {
            key: 'marketing_notifications' as keyof NotificationPreferences,
            label: 'Marketing Notifications',
            description: 'Receive promotional and marketing updates',
            icon: MessageSquare,
        },
    ];

    const specificNotifications = [
        {
            key: 'policy_expiry_notifications' as keyof NotificationPreferences,
            label: 'Policy Expiry Alerts',
            description: 'Get notified when policies are about to expire',
        },
        {
            key: 'payment_due_notifications' as keyof NotificationPreferences,
            label: 'Payment Due Reminders',
            description: 'Receive reminders for upcoming payments',
        },
        {
            key: 'claim_status_notifications' as keyof NotificationPreferences,
            label: 'Claim Status Updates',
            description: 'Get notified about claim status changes',
        },
        {
            key: 'system_maintenance_notifications' as keyof NotificationPreferences,
            label: 'System Maintenance',
            description: 'Receive notifications about system maintenance and updates',
        },
    ];

    return (
        <AppLayout>
            <Head title="Notification Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground">Manage how you receive notifications and updates</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Notification Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                General Notification Preferences
                            </CardTitle>
                            <CardDescription>Choose how you want to receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {notificationTypes.map(({ key, label, description, icon: Icon }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <Label htmlFor={key} className="text-sm font-medium">
                                                {label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">{description}</p>
                                        </div>
                                    </div>
                                    <Switch id={key} checked={data[key]} onCheckedChange={(checked) => setData(key, checked)} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Specific Notification Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Specific Notification Types
                            </CardTitle>
                            <CardDescription>Configure notifications for specific events and activities</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {specificNotifications.map(({ key, label, description }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor={key} className="text-sm font-medium">
                                            {label}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">{description}</p>
                                    </div>
                                    <Switch id={key} checked={data[key]} onCheckedChange={(checked) => setData(key, checked)} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notification Frequency */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Frequency</CardTitle>
                            <CardDescription>Control how often you receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="flex items-center space-x-2">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Real-time Notifications</p>
                                        <p className="text-xs text-muted-foreground">You'll receive notifications immediately when events occur</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Notification Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
