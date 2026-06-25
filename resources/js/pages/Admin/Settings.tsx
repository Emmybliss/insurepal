import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Bell,
    Briefcase,
    CheckCircle,
    CreditCard,
    Database,
    Download,
    Eye,
    EyeOff,
    FileText,
    Globe,
    Hand,
    HardDrive,
    Mail,
    PlusCircle,
    RefreshCw,
    Save,
    Server,
    Shield,
    TestTube,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlatformSettings {
    general?: {
        platform_name: string;
        platform_description: string;
        support_email: string;
        support_phone: string;
        timezone: string;
        date_format: string;
        currency: string;
        language: string;
        maintenance_mode: boolean;
        registration_enabled: boolean;
        logo_url?: string;
        favicon_url?: string;
    };
    security?: {
        password_min_length: number;
        password_require_symbols: boolean;
        password_require_numbers: boolean;
        password_require_uppercase: boolean;
        session_timeout: number;
        max_login_attempts: number;
        two_factor_required: boolean;
        api_rate_limit: number;
        enable_audit_logs: boolean;
        failed_login_lockout_duration: number;
    };
    email?: {
        driver: string;
        host: string;
        port: number;
        username: string;
        password: string;
        encryption: string;
        from_address: string;
        from_name: string;
        test_mode: boolean;
    };
    notifications?: {
        welcome_emails: boolean;
        policy_reminders: boolean;
        payment_notifications: boolean;
        system_alerts: boolean;
        slack_webhook: string;
        discord_webhook: string;
        email_notifications: boolean;
        sms_notifications: boolean;
        push_notifications: boolean;
        notification_frequency: string;
    };
    billing?: {
        paystack_public_key: string;
        paystack_secret_key: string;
        webhook_secret: string;
        test_mode: boolean;
        trial_period_days: number;
        grace_period_days: number;
        auto_suspend_overdue: boolean;
        invoice_prefix: string;
        tax_rate: number;
    };
    system?: {
        backup_frequency: string;
        log_retention_days: number;
        cache_driver: string;
        queue_driver: string;
        storage_driver: string;
        max_upload_size: number;
        enable_debug_mode: boolean;
        auto_updates: boolean;
        performance_monitoring: boolean;
    };
}

interface SettingsProps {
    settings?: PlatformSettings;
    systemHealth?: {
        database: 'healthy' | 'warning' | 'error';
        cache: 'healthy' | 'warning' | 'error';
        queue: 'healthy' | 'warning' | 'error';
        storage: 'healthy' | 'warning' | 'error';
        email: 'healthy' | 'warning' | 'error';
        performance?: {
            cpu_usage: number;
            memory_usage: number;
            disk_usage: number;
        };
    };
    recentBackups?: Array<{
        id: string;
        created_at: string;
        size: string;
        type: string;
        status: 'completed' | 'failed' | 'in_progress';
    }>;
    auditLogs?: Array<{
        id: string;
        user: string;
        action: string;
        resource: string;
        created_at: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Settings',
        href: route('admin.settings'),
    },
];

export default function SuperAdminSettings({ settings, systemHealth, recentBackups, auditLogs }: SettingsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswords, setShowPasswords] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [testingServices, setTestingServices] = useState<Record<string, boolean>>({});
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const { data, setData, post, processing, reset, wasSuccessful } = useForm({
        general: settings?.general || {
            platform_name: 'InsurePal AI SaaS',
            platform_description: 'Multi-tenant insurance management platform',
            support_email: 'support@insurepal.ai',
            support_phone: '',
            timezone: 'Africa/Lagos',
            date_format: 'Y-m-d',
            currency: 'NGN',
            language: 'en',
            maintenance_mode: false,
            registration_enabled: true,
            logo_url: '',
            favicon_url: '',
        },
        security: settings?.security || {
            password_min_length: 8,
            password_require_symbols: true,
            password_require_numbers: true,
            password_require_uppercase: true,
            session_timeout: 120,
            max_login_attempts: 5,
            two_factor_required: false,
            api_rate_limit: 100,
            enable_audit_logs: true,
            failed_login_lockout_duration: 15,
        },
        email: settings?.email || {
            driver: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            username: '',
            password: '',
            encryption: 'tls',
            from_address: 'noreply@insurepal.ai',
            from_name: 'InsurePal AI',
            test_mode: false,
            daily_send_limit: 1000,
            bounce_handling: false,
        },
        notifications: settings?.notifications || {
            welcome_emails: true,
            policy_reminders: true,
            payment_notifications: true,
            system_alerts: true,
            slack_webhook: '',
            discord_webhook: '',
            email_notifications: true,
            sms_notifications: false,
            push_notifications: false,
            notification_frequency: 'daily',
        },
        billing: settings?.billing || {
            paystack_public_key: '',
            paystack_secret_key: '',
            webhook_secret: '',
            test_mode: true,
            trial_period_days: 14,
            grace_period_days: 7,
            auto_suspend_overdue: false,
            invoice_prefix: 'INV-',
            tax_rate: 7.5,
        },
        system: settings?.system || {
            backup_frequency: 'daily',
            log_retention_days: 30,
            cache_driver: 'redis',
            queue_driver: 'redis',
            storage_driver: 'local',
            max_upload_size: 10,
            enable_debug_mode: false,
            maintenance_message: '',
            auto_updates: false,
            performance_monitoring: true,
        },
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (wasSuccessful && saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [wasSuccessful, saveSuccess]);

    const handleSave = (section: keyof PlatformSettings) => {
        setSaveSuccess(section);
        post(route('admin.settings.update', { section }), {
            preserveScroll: true,
            onSuccess: () => {
                // Settings saved successfully
            },
        });
    };

    const testService = async (service: string) => {
        setTestingServices((prev) => ({ ...prev, [service]: true }));

        // Simulate testing - replace with actual API calls
        setTimeout(() => {
            setTestingServices((prev) => ({ ...prev, [service]: false }));
}, 2000);
    };

    const getPerformanceColor = (usage: number) => {
        if (usage < 50) return 'bg-green-500';
        if (usage < 80) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getHealthBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <Badge className="border-green-200 bg-green-100 text-green-700">Healthy</Badge>;
            case 'warning':
                return <Badge variant="secondary" className="border-yellow-200 bg-yellow-100 text-yellow-700">Warning</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Settings - Super Admin" />

            <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
                        <p className="text-muted-foreground">Configure global platform settings and monitor system health</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {saveSuccess && (
                            <div className="flex items-center text-sm text-green-600">
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Settings saved successfully
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={() => reset()}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>

                {/* System Health Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="mr-2 h-5 w-5" />
                            System Health & Performance
                        </CardTitle>
                        <CardDescription>Real-time system monitoring and health status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between rounded border p-3">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 grid gap-4 md:grid-cols-5">
                                    <div className="flex items-center justify-between rounded border p-3">
                                        <div className="flex items-center">
                                            <Database className="mr-2 h-4 w-4" />
                                            <span className="text-sm">Database</span>
                                        </div>
                                        {getHealthBadge(systemHealth?.database ?? 'unknown')}
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-3">
                                        <div className="flex items-center">
                                            <Zap className="mr-2 h-4 w-4" />
                                            <span className="text-sm">Cache</span>
                                        </div>
                                        {getHealthBadge(systemHealth?.cache ?? 'unknown')}
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-3">
                                        <div className="flex items-center">
                                            <Activity className="mr-2 h-4 w-4" />
                                            <span className="text-sm">Queue</span>
                                        </div>
                                        {getHealthBadge(systemHealth?.queue ?? 'unknown')}
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-3">
                                        <div className="flex items-center">
                                            <Server className="mr-2 h-4 w-4" />
                                            <span className="text-sm">Storage</span>
                                        </div>
                                        {getHealthBadge(systemHealth?.storage ?? 'unknown')}
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-3">
                                        <div className="flex items-center">
                                            <Mail className="mr-2 h-4 w-4" />
                                            <span className="text-sm">Email</span>
                                        </div>
                                        {getHealthBadge(systemHealth?.email ?? 'unknown')}
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                {systemHealth?.performance && (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="rounded-lg border p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">CPU Usage</span>
                                                <span className="text-sm text-muted-foreground">{systemHealth.performance.cpu_usage}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-2 rounded-full ${getPerformanceColor(systemHealth.performance.cpu_usage)}`}
                                                    style={{ width: `${systemHealth.performance.cpu_usage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">Memory Usage</span>
                                                <span className="text-sm text-muted-foreground">{systemHealth.performance.memory_usage}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-2 rounded-full ${getPerformanceColor(systemHealth.performance.memory_usage)}`}
                                                    style={{ width: `${systemHealth.performance.memory_usage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">Disk Usage</span>
                                                <span className="text-sm text-muted-foreground">{systemHealth.performance.disk_usage}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-2 rounded-full ${getPerformanceColor(systemHealth.performance.disk_usage)}`}
                                                    style={{ width: `${systemHealth.performance.disk_usage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="general" className="flex items-center">
                            <Globe className="mr-1 h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center">
                            <Shield className="mr-1 h-4 w-4" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center">
                            <Mail className="mr-1 h-4 w-4" />
                            Email
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center">
                            <Bell className="mr-1 h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="flex items-center">
                            <CreditCard className="mr-1 h-4 w-4" />
                            Billing
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center">
                            <Server className="mr-1 h-4 w-4" />
                            System
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Basic platform configuration and branding settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="platform_name">Platform Name</Label>
                                        <Input
                                            id="platform_name"
                                            value={data.general.platform_name}
                                            onChange={(e) => setData('general.platform_name', e.target.value)}
                                            placeholder="Platform Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="support_email">Support Email</Label>
                                        <Input
                                            id="support_email"
                                            type="email"
                                            value={data.general.support_email}
                                            onChange={(e) => setData('general.support_email', e.target.value)}
                                            placeholder="Support Email"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="platform_description">Platform Description</Label>
                                    <Textarea
                                        id="platform_description"
                                        value={data.general.platform_description}
                                        onChange={(e) => setData('general.platform_description', e.target.value)}
                                        placeholder="Platform Description"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select value={data.general.timezone} onValueChange={(value) => setData('general.timezone', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                                <SelectItem value="America/New_York">America/New_York</SelectItem>
                                                <SelectItem value="Europe/London">Europe/London</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select value={data.general.currency} onValueChange={(value) => setData('general.currency', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Default Language</Label>
                                        <Select value={data.general.language} onValueChange={(value) => setData('general.language', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Platform Controls</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Maintenance Mode</Label>
                                                <p className="text-sm text-muted-foreground">Temporarily disable public access to the platform</p>
                                            </div>
                                            <Switch
                                                checked={data.general.maintenance_mode}
                                                onCheckedChange={(checked) => setData('general.maintenance_mode', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Registration Enabled</Label>
                                                <p className="text-sm text-muted-foreground">Allow new users to register for accounts</p>
                                            </div>
                                            <Switch
                                                checked={data.general.registration_enabled}
                                                onCheckedChange={(checked) => setData('general.registration_enabled', !!checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button disabled={processing} onClick={() => handleSave('general')}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save General Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Configure security policies and authentication settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password_min_length">Minimum Password Length</Label>
                                        <Input
                                            id="password_min_length"
                                            type="number"
                                            value={data.security.password_min_length}
                                            onChange={(e) => setData('security.password_min_length', parseInt(e.target.value) || 8)}
                                            min="6"
                                            max="20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                                        <Input
                                            id="session_timeout"
                                            type="number"
                                            value={data.security.session_timeout}
                                            onChange={(e) => setData('security.session_timeout', parseInt(e.target.value) || 120)}
                                            min="15"
                                            max="1440"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Password Requirements</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Require Symbols</Label>
                                                <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                                            </div>
                                            <Switch
                                                checked={data.security.password_require_symbols}
                                                onCheckedChange={(checked) => setData('security.password_require_symbols', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Require Numbers</Label>
                                                <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                                            </div>
                                            <Switch
                                                checked={data.security.password_require_numbers}
                                                onCheckedChange={(checked) => setData('security.password_require_numbers', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Require Uppercase</Label>
                                                <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                                            </div>
                                            <Switch
                                                checked={data.security.password_require_uppercase}
                                                onCheckedChange={(checked) => setData('security.password_require_uppercase', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Two-Factor Authentication</Label>
                                                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                                            </div>
                                            <Switch
                                                checked={data.security.two_factor_required}
                                                onCheckedChange={(checked) => setData('security.two_factor_required', !!checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Security Monitoring</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                                            <Input
                                                id="max_login_attempts"
                                                type="number"
                                                value={data.security.max_login_attempts}
                                                onChange={(e) => setData('security.max_login_attempts', parseInt(e.target.value) || 5)}
                                                min="3"
                                                max="10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                                            <Input
                                                id="lockout_duration"
                                                type="number"
                                                value={data.security.failed_login_lockout_duration}
                                                onChange={(e) => setData('security.failed_login_lockout_duration', parseInt(e.target.value) || 15)}
                                                min="5"
                                                max="60"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Enable Audit Logs</Label>
                                            <p className="text-sm text-muted-foreground">Track user actions and system changes</p>
                                        </div>
                                        <Switch
                                            checked={data.security.enable_audit_logs}
                                            onCheckedChange={(checked) => setData('security.enable_audit_logs', !!checked)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button disabled={processing} onClick={() => handleSave('security')}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Security Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Email Settings */}
                    <TabsContent value="email">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Configuration</CardTitle>
                                <CardDescription>Configure email service and SMTP settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email_driver">Email Driver</Label>
                                        <Select defaultValue={settings?.email?.driver ?? 'smtp'}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="smtp">SMTP</SelectItem>
                                                <SelectItem value="sendgrid">SendGrid</SelectItem>
                                                <SelectItem value="mailgun">Mailgun</SelectItem>
                                                <SelectItem value="ses">AWS SES</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email_host">SMTP Host</Label>
                                        <Input
                                            id="email_host"
                                            defaultValue={settings?.email?.host ?? 'smtp.gmail.com'}
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="email_port">Port</Label>
                                        <Input id="email_port" type="number" defaultValue={settings?.email?.port ?? 587} placeholder="587" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email_encryption">Encryption</Label>
                                        <Select defaultValue={settings?.email?.encryption ?? 'tls'}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tls">TLS</SelectItem>
                                                <SelectItem value="ssl">SSL</SelectItem>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between pt-6">
                                        <div className="space-y-0.5">
                                            <Label>Test Mode</Label>
                                        </div>
                                        <Switch checked={data.email.test_mode} onCheckedChange={(checked) => setData('email.test_mode', !!checked)} />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email_username">Username</Label>
                                        <Input
                                            id="email_username"
                                            defaultValue={settings?.email?.username ?? ''}
                                            placeholder="your-email@gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email_password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="email_password"
                                                type={showPasswords ? 'text' : 'password'}
                                                defaultValue={settings?.email?.password ?? ''}
                                                placeholder="Your email password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                            >
                                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">From Address</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="from_name">From Name</Label>
                                            <Input
                                                id="from_name"
                                                defaultValue={settings?.email?.from_name ?? 'InsurePal AI'}
                                                placeholder="InsurePal AI"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="from_address">From Email</Label>
                                            <Input
                                                id="from_address"
                                                type="email"
                                                defaultValue={settings?.email?.from_address ?? 'noreply@insurepal.ai'}
                                                placeholder="noreply@insurepal.ai"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Button variant="outline" onClick={() => testService('email')} disabled={testingServices.email}>
                                        <TestTube className="mr-2 h-4 w-4" />
                                        {testingServices.email ? 'Testing...' : 'Test Connection'}
                                    </Button>
                                    <Button disabled={processing} onClick={() => handleSave('email')}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Email Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Settings */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>Configure system notifications and alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Email Notifications</h3>
                                    <div className="space-y-4">
                                        {/* Welcome Emails */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Hand className="h-5 w-5 text-gray-400" />
                                                <div className="space-y-0.5">
                                                    <Label>Welcome Emails</Label>
                                                    <p className="text-sm text-muted-foreground">Send welcome emails to new users</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.notifications.welcome_emails}
                                                onCheckedChange={(checked) => setData('notifications.welcome_emails', !!checked)}
                                            />
                                        </div>

                                        {/* Policy Reminders */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Briefcase className="h-5 w-5 text-gray-400" />
                                                <div className="space-y-0.5">
                                                    <Label>Policy Reminders</Label>
                                                    <p className="text-sm text-muted-foreground">Send policy expiration reminders</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.notifications.policy_reminders}
                                                onCheckedChange={(checked) => setData('notifications.policy_reminders', !!checked)}
                                            />
                                        </div>

                                        {/* Payment Notifications */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <CreditCard className="h-5 w-5 text-gray-400" />
                                                <div className="space-y-0.5">
                                                    <Label>Payment Notifications</Label>
                                                    <p className="text-sm text-muted-foreground">Send payment and invoice notifications</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.notifications.payment_notifications}
                                                onCheckedChange={(checked) => setData('notifications.payment_notifications', !!checked)}
                                            />
                                        </div>

                                        {/* System Alerts */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <AlertTriangle className="h-5 w-5 text-gray-400" />
                                                <div className="space-y-0.5">
                                                    <Label>System Alerts</Label>
                                                    <p className="text-sm text-muted-foreground">Send system maintenance alerts</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.notifications.system_alerts}
                                                onCheckedChange={(checked) => setData('notifications.system_alerts', !!checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Integration Webhooks</h3>
                                    <div className="grid gap-4 md:grid-cols-1">
                                        <div className="space-y-2">
                                            <Label htmlFor="slack_webhook">Slack Webhook URL</Label>
                                            <Input
                                                id="slack_webhook"
                                                defaultValue={settings?.notifications?.slack_webhook ?? ''}
                                                placeholder="https://hooks.slack.com/services/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="discord_webhook">Discord Webhook URL</Label>
                                            <Input
                                                id="discord_webhook"
                                                defaultValue={settings?.notifications?.discord_webhook ?? ''}
                                                placeholder="https://discord.com/api/webhooks/..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button disabled={processing} onClick={() => handleSave('notifications')}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Notification Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Billing Settings */}
                    <TabsContent value="billing">
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Configuration</CardTitle>
                                <CardDescription>Configure payment processing and billing settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
                                        <Input
                                            id="paystack_public_key"
                                            defaultValue={settings?.billing?.paystack_public_key ?? ''}
                                            placeholder="pk_test_..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
                                        <div className="relative">
                                            <Input
                                                id="paystack_secret_key"
                                                type={showPasswords ? 'text' : 'password'}
                                                defaultValue={settings?.billing?.paystack_secret_key ?? ''}
                                                placeholder="sk_test_..."
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                            >
                                                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="trial_period">Trial Period (Days)</Label>
                                        <Input
                                            id="trial_period"
                                            type="number"
                                            defaultValue={settings?.billing?.trial_period_days ?? 14}
                                            min="0"
                                            max="90"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="grace_period">Grace Period (Days)</Label>
                                        <Input
                                            id="grace_period"
                                            type="number"
                                            defaultValue={settings?.billing?.grace_period_days ?? 7}
                                            min="0"
                                            max="30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            type="number"
                                            step="0.01"
                                            defaultValue={settings?.billing?.tax_rate ?? 7.5}
                                            min="0"
                                            max="50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Test Mode</Label>
                                            <p className="text-sm text-muted-foreground">Use test API keys for development</p>
                                        </div>
                                        <Switch
                                            checked={data.billing.test_mode}
                                            onCheckedChange={(checked) => setData('billing.test_mode', !!checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Auto Suspend Overdue Accounts</Label>
                                            <p className="text-sm text-muted-foreground">Automatically suspend accounts with overdue payments</p>
                                        </div>
                                        <Switch
                                            checked={data.billing.auto_suspend_overdue}
                                            onCheckedChange={(checked) => setData('billing.auto_suspend_overdue', !!checked)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Button variant="outline" onClick={() => testService('paystack')} disabled={testingServices.paystack}>
                                        <TestTube className="mr-2 h-4 w-4" />
                                        {testingServices.paystack ? 'Testing...' : 'Test Paystack Connection'}
                                    </Button>
                                    <Button disabled={processing} onClick={() => handleSave('billing')}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Billing Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* System Settings */}
                    <TabsContent value="system">
                        <div className="space-y-6">
                            {/* System Configuration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Configuration</CardTitle>
                                    <CardDescription>Advanced system settings and maintenance options</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="cache_driver">Cache Driver</Label>
                                            <Select defaultValue={settings?.system?.cache_driver ?? 'redis'}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="redis">Redis</SelectItem>
                                                    <SelectItem value="file">File</SelectItem>
                                                    <SelectItem value="database">Database</SelectItem>
                                                    <SelectItem value="memcached">Memcached</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="queue_driver">Queue Driver</Label>
                                            <Select defaultValue={settings?.system?.queue_driver ?? 'redis'}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="redis">Redis</SelectItem>
                                                    <SelectItem value="database">Database</SelectItem>
                                                    <SelectItem value="sync">Sync</SelectItem>
                                                    <SelectItem value="sqs">Amazon SQS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="backup_frequency">Backup Frequency</Label>
                                            <Select defaultValue={settings?.system?.backup_frequency ?? 'daily'}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="log_retention">Log Retention (Days)</Label>
                                            <Input
                                                id="log_retention"
                                                type="number"
                                                defaultValue={settings?.system?.log_retention_days ?? 30}
                                                min="7"
                                                max="365"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="max_upload_size">Max Upload Size (MB)</Label>
                                            <Input
                                                id="max_upload_size"
                                                type="number"
                                                defaultValue={settings?.system?.max_upload_size ?? 10}
                                                min="1"
                                                max="100"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Debug Mode</Label>
                                                <p className="text-sm text-muted-foreground">Enable detailed error logging (disable in production)</p>
                                            </div>
                                            <Switch
                                                checked={data.system.enable_debug_mode}
                                                onCheckedChange={(checked) => setData('system.enable_debug_mode', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Performance Monitoring</Label>
                                                <p className="text-sm text-muted-foreground">Enable system performance tracking</p>
                                            </div>
                                            <Switch
                                                checked={data.system.performance_monitoring}
                                                onCheckedChange={(checked) => setData('system.performance_monitoring', !!checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Automatic Updates</Label>
                                                <p className="text-sm text-muted-foreground">Allow automatic security updates</p>
                                            </div>
                                            <Switch
                                                checked={data.system.auto_updates}
                                                onCheckedChange={(checked) => setData('system.auto_updates', !!checked)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button disabled={processing} onClick={() => handleSave('system')}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save System Settings
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Backups */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center">
                                            <HardDrive className="mr-2 h-5 w-5" />
                                            Recent Backups
                                        </span>
                                        <Button size="sm">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create Backup
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentBackups && recentBackups.length > 0 ? (
                                        <div className="space-y-2">
                                            {recentBackups.map((backup) => (
                                                <div key={backup.id} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{backup.type} Backup</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(backup.created_at).toLocaleDateString()} • {backup.size}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={
                                                                backup.status === 'completed'
                                                                    ? 'default'
                                                                    : backup.status === 'failed'
                                                                      ? 'destructive'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {backup.status}
                                                        </Badge>
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <HardDrive className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-muted-foreground">No backups available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Audit Logs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Recent Audit Logs
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {auditLogs && auditLogs.length > 0 ? (
                                        <div className="space-y-2">
                                            {auditLogs.slice(0, 5).map((log) => (
                                                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{log.action}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {log.user} • {log.resource} • {new Date(log.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-muted-foreground">No audit logs available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
