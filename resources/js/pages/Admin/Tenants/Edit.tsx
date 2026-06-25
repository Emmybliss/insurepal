import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { DEFAULT_COUNTRY, NIGERIAN_STATES } from '@/lib/constants';
import { type BreadcrumbItem, type Tenant } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    BadgePercent,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    CreditCard,
    Eye,
    EyeOff,
    Image as ImageIcon,
    KeyRound,
    Lock,
    Mail,
    Package,
    Settings,
    Sparkles,
    Star,
    Tag,
    Trash2,
    UserIcon,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    price: string;
    currency: string;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annually' | 'yearly';
    trial_days: number;
    features: string[] | null;
    is_popular: boolean;
}

interface TenantUser {
    id: number;
    name: string;
    email: string;
}

interface TenantsEditProps {
    tenant: Tenant;
    subscriptionPlans: SubscriptionPlan[];
    tenantUsers: TenantUser[];
    subscription_duration: string;
}

const breadcrumbs = (tenant: Tenant): BreadcrumbItem[] => [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Tenants',
        href: route('admin.tenants.index'),
    },
    {
        title: tenant.name,
        href: route('admin.tenants.show', tenant.id),
    },
    {
        title: 'Edit',
        href: route('admin.tenants.edit', tenant.id),
    },
];

// const BILLING_CYCLE_LABELS: Record<string, string> = {
//     monthly: 'Monthly',
//     quarterly: 'Quarterly',
//     semi_annually: 'Six Months',
//     yearly: 'Yearly',
// };

const BILLING_CYCLE_SUFFIX: Record<string, string> = {
    monthly: 'mo',
    quarterly: '3 mos',
    semi_annually: '6 mos',
    yearly: 'yr',
};

const CYCLE_MONTHS: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    semi_annually: 6,
    yearly: 12,
};

const PAYMENT_METHOD_OPTIONS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Credit / Debit Card' },
    { value: 'paystack', label: 'Paystack' },
    { value: 'flutterwave', label: 'Flutterwave' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'direct_debit', label: 'Direct Debit' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

export default function TenantsEdit({ tenant, subscriptionPlans = [], tenantUsers = [], subscription_duration }: TenantsEditProps) {
    const [data, setData] = useState({
        name: tenant.name || '',
        slug: tenant.slug || '',
        type: tenant.type || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        country: tenant.country || DEFAULT_COUNTRY,
        logo: null as File | null,
        status: tenant.status || 'active',
        // Subscription
        subscription_plan_id: tenant.subscription_plan_id ? String(tenant.subscription_plan_id) : '',
        subscription_duration: subscription_duration || '',
        enable_trial: !!tenant.trial_ends_at,
        trial_ends_at: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().split('T')[0] : '',
        default_locale: tenant.default_locale || 'en',
        settings: {
            company_profile: {
                cac_reg_number: tenant.settings?.company_profile?.cac_reg_number || '',
                tax_number: tenant.settings?.company_profile?.tax_number || '',
                naicom_reg_number: tenant.settings?.company_profile?.naicom_reg_number || '',
                ncrib_reg_number: tenant.settings?.company_profile?.ncrib_reg_number || '',
                website: tenant.settings?.company_profile?.website || '',
            },
            billing: {
                currency: tenant.settings?.billing?.currency || 'NGN',
                tax_rate: tenant.settings?.billing?.tax_rate || '7.5',
                payment_method: tenant.settings?.billing?.payment_method || '',
                discount_type: tenant.settings?.billing?.discount_type || '',
                discount_value: tenant.settings?.billing?.discount_value || '',
            },
            notifications: {
                email_enabled: tenant.settings?.notifications?.email_enabled ?? true,
                sms_enabled: tenant.settings?.notifications?.sms_enabled ?? false,
            },
        },
        user: {
            name: tenantUsers[0]?.name || '',
            email: tenantUsers[0]?.email || '',
            password: '',
            password_confirmation: '',
        },
        known_company_id: (tenant as any).known_company_id || '',
        known_company_source: (tenant as any).known_company_source || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [slugAuto, setSlugAuto] = useState(!tenant.slug);

    // Password reset state
    const [pwData, setPwData] = useState({
        user_id: tenantUsers[0]?.id ? String(tenantUsers[0].id) : '',
        password: '',
        password_confirmation: '',
    });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [pwProcessing, setPwProcessing] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showPwConfirm, setShowPwConfirm] = useState(false);
    const passwordMatch =
        data.user.password !== '' && data.user.password_confirmation !== '' && data.user.password === data.user.password_confirmation;
    const passwordMismatch =
        data.user.password !== '' && data.user.password_confirmation !== '' && data.user.password !== data.user.password_confirmation;
    const pwMatch = pwData.password !== '' && pwData.password_confirmation !== '' && pwData.password === pwData.password_confirmation;
    const pwMismatch = pwData.password !== '' && pwData.password_confirmation !== '' && pwData.password !== pwData.password_confirmation;
    const checkPasswordStrength = (password: string) => ({
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
    const strength = checkPasswordStrength(data.user.password);
    const strengthMet = Object.values(strength).filter(Boolean).length;
    const isStrong = strengthMet >= 4;
    const pwStrength = checkPasswordStrength(pwData.password);
    const pwStrengthMet = Object.values(pwStrength).filter(Boolean).length;
    const pwIsStrong = pwStrengthMet >= 4;

    const handlePasswordReset = (e: React.FormEvent) => {
        e.preventDefault();
        setPwProcessing(true);
        setPwErrors({});

        router.post(
            route('admin.tenants.reset-password', tenant.id),
            {
                password: pwData.password,
                password_confirmation: pwData.password_confirmation,
                user_id: pwData.user_id || null,
            },
            {
                onSuccess: () => {
                    setPwProcessing(false);
                    setPwData({ ...pwData, password: '', password_confirmation: '' });
                    toast.success('Password updated successfully');
                },
                onError: (errs) => {
                    setPwErrors(errs);
                    setPwProcessing(false);
                    toast.error('Failed to update password. Please check the form.');
                },
            },
        );
    };

    useEffect(() => {
        if (slugAuto) {
            setData((d) => ({
                ...d,
                slug: d.name
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, ''),
            }));
        }
    }, [data.name, slugAuto]);

    // Derived: selected plan object
    const selectedPlan = subscriptionPlans.find((p) => String(p.id) === String(data.subscription_plan_id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const slug =
            data.slug ||
            data.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');

        let trial_ends_at = '';
        if (data.enable_trial) {
            trial_ends_at =
                data.trial_ends_at ||
                dayjs()
                    .add(selectedPlan?.trial_days ?? 14, 'day')
                    .format('YYYY-MM-DD');
        }

        const formData = {
            ...data,
            slug,
            trial_ends_at,
            _method: 'put',
            ...(data.user.password || data.user.name || data.user.email ? { user: data.user } : {}),
        };

        router.post(route('admin.tenants.update', tenant.id), formData as any, {
            forceFormData: true,
            onSuccess: () => {
                setProcessing(false);
                toast.success('Tenant updated successfully');
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
                toast.error('Failed to update tenant. Please check the form.');
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
            router.delete(route('admin.tenants.destroy', tenant.id), {
                onSuccess: () => {
                    toast.success('Tenant deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete tenant');
                },
            });
        }
    };

    const updateBilling = (key: string, value: string) =>
        setData({
            ...data,
            settings: {
                ...data.settings,
                billing: { ...data.settings.billing, [key]: value },
            },
        });

    const currencySymbol = CURRENCY_SYMBOLS[data.settings.billing.currency] ?? '';

    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let finalTotal = 0;

    let activeCycle = 'monthly';
    let multiplier = 1;

    if (selectedPlan) {
        activeCycle = data.subscription_duration || selectedPlan.billing_cycle;
        multiplier = CYCLE_MONTHS[activeCycle] || 1;
        subtotal = Number(selectedPlan.price) * multiplier;

        if (data.settings.billing.discount_type === 'percentage') {
            discountAmount = subtotal * (Number(data.settings.billing.discount_value || 0) / 100);
        } else if (data.settings.billing.discount_type === 'fixed') {
            discountAmount = Number(data.settings.billing.discount_value || 0);
        }

        const afterDiscount = Math.max(0, subtotal - discountAmount);
        taxAmount = afterDiscount * (Number(data.settings.billing.tax_rate || 0) / 100);
        finalTotal = afterDiscount + taxAmount;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs(tenant)}>
            <Head title={`Edit ${tenant.name} - Super Admin`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Edit Tenant</h2>
                            <p className="text-muted-foreground">Update {tenant.name} details</p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleDelete} size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Tenant
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* ── Left / Main Column ─── */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building2 className="mr-2 h-5 w-5" />
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription>Primary tenant details and identification</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Tenant Name *</Label>
                                            <CompanySearchCombobox
                                                companyType={data.type as any || 'all'}
                                                value={data.name}
                                                scope="registry"
                                                onSelect={(company) => {
                                                    setData({
                                                        ...data,
                                                        name: company.name,
                                                        email: company.email || data.email,
                                                        phone: company.phone || data.phone,
                                                        address: company.address || data.address,
                                                        city: company.city || data.city,
                                                        state: company.state || data.state,
                                                        known_company_id: String(company.id),
                                                        known_company_source: company.source,
                                                        settings: {
                                                            ...data.settings,
                                                            company_profile: {
                                                                ...data.settings.company_profile,
                                                                naicom_reg_number: company.naicom_reg_number || data.settings.company_profile.naicom_reg_number,
                                                            }
                                                        }
                                                    });
                                                }}
                                                placeholder="Search for a company..."
                                            />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                type="text"
                                                value={data.slug}
                                                onChange={(e) => {
                                                    setSlugAuto(false);
                                                    setData({ ...data, slug: e.target.value });
                                                }}
                                                placeholder="abc-insurance"
                                                className={errors.slug ? 'border-red-500' : ''}
                                            />
                                            {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Tenant Type *</Label>
                                            <Select
                                                value={data.type}
                                                onValueChange={(value) => setData({ ...data, type: value as 'underwriter' | 'broker' })}
                                            >
                                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select tenant type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="underwriter">Underwriter</SelectItem>
                                                    <SelectItem value="broker">Broker</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status *</Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) => setData({ ...data, status: value as 'active' | 'inactive' | 'suspended' })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="suspended">Suspended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Mail className="mr-2 h-5 w-5" />
                                        Contact Information
                                    </CardTitle>
                                    <CardDescription>How to reach this tenant</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                                placeholder="contact@abc-insurance.com"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData({ ...data, phone: e.target.value })}
                                                placeholder="+234 xxx xxx xxxx"
                                                className={errors.phone ? 'border-red-500' : ''}
                                            />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData({ ...data, address: e.target.value })}
                                            placeholder="Complete business address"
                                            className={errors.address ? 'border-red-500' : ''}
                                            rows={3}
                                        />
                                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                type="text"
                                                value={data.city}
                                                onChange={(e) => setData({ ...data, city: e.target.value })}
                                                placeholder="Lagos"
                                                className={errors.city ? 'border-red-500' : ''}
                                            />
                                            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Select value={data.state} onValueChange={(value) => setData({ ...data, state: value })}>
                                                <SelectTrigger id="state" className={errors.state ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select state" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {NIGERIAN_STATES.map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                type="text"
                                                value={data.country}
                                                onChange={(e) => setData({ ...data, country: e.target.value })}
                                                placeholder="Nigeria"
                                                className={errors.country ? 'border-red-500' : ''}
                                            />
                                            {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subscription Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Package className="mr-2 h-5 w-5" />
                                        Subscription Plan
                                    </CardTitle>
                                    <CardDescription>Assign a plan and billing cycle for this tenant</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Plan Cards */}
                                    {subscriptionPlans.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {subscriptionPlans.map((plan) => {
                                                const isSelected = String(data.subscription_plan_id) === String(plan.id);
                                                const symbol = CURRENCY_SYMBOLS[plan.currency] ?? plan.currency;
                                                return (
                                                    <button
                                                        key={plan.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setData({
                                                                ...data,
                                                                subscription_plan_id: isSelected ? '' : String(plan.id),
                                                                subscription_duration: isSelected ? '' : plan.billing_cycle,
                                                            })
                                                        }
                                                        className={`relative rounded-lg border-2 p-4 text-left transition-all hover:border-primary focus:outline-none ${
                                                            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
                                                        }`}
                                                    >
                                                        {plan.is_popular && (
                                                            <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                                                <Star className="h-3 w-3 fill-current" /> Popular
                                                            </span>
                                                        )}
                                                        {isSelected && <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />}
                                                        <p className="font-semibold">{plan.name}</p>
                                                        <p className="mt-1 text-xl font-bold">
                                                            {symbol}
                                                            {Number(plan.price).toLocaleString()}
                                                            <span className="text-sm font-normal text-muted-foreground">
                                                                /{BILLING_CYCLE_SUFFIX[plan.billing_cycle] ?? plan.billing_cycle}
                                                            </span>
                                                        </p>
                                                        {plan.trial_days > 0 && (
                                                            <p className="mt-1 text-xs text-muted-foreground">{plan.trial_days}-day trial included</p>
                                                        )}
                                                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                                                            <ul className="mt-2 space-y-0.5">
                                                                {plan.features.slice(0, 3).map((f, i) => (
                                                                    <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                                                                        {f}
                                                                    </li>
                                                                ))}
                                                                {plan.features.length > 3 && (
                                                                    <li className="text-xs text-muted-foreground">
                                                                        +{plan.features.length - 3} more…
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                            No active subscription plans found. Create plans first in the Subscription Plans module.
                                        </p>
                                    )}

                                    {errors.subscription_plan_id && <p className="text-sm text-red-500">{errors.subscription_plan_id}</p>}

                                    {/* Billing cycle override */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="subscription_duration">Billing Cycle</Label>
                                            <Select
                                                value={data.subscription_duration}
                                                onValueChange={(v) => setData({ ...data, subscription_duration: v })}
                                            >
                                                <SelectTrigger id="subscription_duration">
                                                    <SelectValue placeholder="Select billing cycle" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                                                    <SelectItem value="semi_annually">Six Months (6 months)</SelectItem>
                                                    <SelectItem value="yearly">Yearly (12 months)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.subscription_duration && <p className="text-sm text-red-500">{errors.subscription_duration}</p>}
                                            <p className="text-xs text-muted-foreground">Overrides the default cycle of the selected plan</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Company Logo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <ImageIcon className="mr-2 h-5 w-5" />
                                        Company Logo
                                    </CardTitle>
                                    <CardDescription>Upload the official company logo (shown on documents and the admin panel)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Label
                                        htmlFor="logo"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-6 transition-colors hover:border-primary"
                                    >
                                        {data.logo ? (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-primary/10 shadow-sm">
                                                    <img src={URL.createObjectURL(data.logo)} alt="Preview" className="h-full w-full object-cover" />
                                                </div>
                                                <span className="line-clamp-1 max-w-[200px] text-sm font-medium text-primary">
                                                    {(data.logo as File).name}
                                                </span>
                                                <span className="mt-1 text-xs text-muted-foreground">Click to replace</span>
                                            </div>
                                        ) : tenant.logo ? (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border shadow-sm">
                                                    <img src={`/storage/${tenant.logo}`} alt="Current Logo" className="h-full w-full object-cover" />
                                                </div>
                                                <p className="text-sm font-medium text-primary">Click to update logo</p>
                                                <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or JPG max 2MB</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                                                </div>
                                                <p className="text-sm font-medium text-primary">Click to upload logo</p>
                                                <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or JPG max 2MB</p>
                                            </div>
                                        )}
                                        <input
                                            id="logo"
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/png,image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData({ ...data, logo: file });
                                                }
                                            }}
                                        />
                                    </Label>
                                    {errors.logo && <p className="mt-2 text-sm text-red-500">{errors.logo}</p>}
                                </CardContent>
                            </Card>

                            {/* Company Profile */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="mr-2 h-5 w-5" />
                                        Company Profile
                                    </CardTitle>
                                    <CardDescription>Additional company information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="cac_reg_number">CAC Registration Number</Label>
                                            <Input
                                                id="cac_reg_number"
                                                type="text"
                                                value={data.settings.company_profile.cac_reg_number}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        settings: {
                                                            ...data.settings,
                                                            company_profile: {
                                                                ...data.settings.company_profile,
                                                                cac_reg_number: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                placeholder="RC123456"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tax_number">Tax Number</Label>
                                            <Input
                                                id="tax_number"
                                                type="text"
                                                value={data.settings.company_profile.tax_number}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        settings: {
                                                            ...data.settings,
                                                            company_profile: {
                                                                ...data.settings.company_profile,
                                                                tax_number: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                placeholder="12345678-0001"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="naicom_reg_number">NAICOM Reg Number</Label>
                                            <Input
                                                id="naicom_reg_number"
                                                type="text"
                                                value={data.settings.company_profile.naicom_reg_number}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        settings: {
                                                            ...data.settings,
                                                            company_profile: {
                                                                ...data.settings.company_profile,
                                                                naicom_reg_number: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                placeholder="NAICOM/12345"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ncrib_reg_number">NCRIB Reg Number</Label>
                                            <Input
                                                id="ncrib_reg_number"
                                                type="text"
                                                value={data.settings.company_profile.ncrib_reg_number}
                                                onChange={(e) =>
                                                    setData({
                                                        ...data,
                                                        settings: {
                                                            ...data.settings,
                                                            company_profile: {
                                                                ...data.settings.company_profile,
                                                                ncrib_reg_number: e.target.value,
                                                            },
                                                        },
                                                    })
                                                }
                                                placeholder="NCRIB/00123"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={data.settings.company_profile.website}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    settings: {
                                                        ...data.settings,
                                                        company_profile: {
                                                            ...data.settings.company_profile,
                                                            website: e.target.value,
                                                        },
                                                    },
                                                })
                                            }
                                            placeholder="https://www.abc-insurance.com"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Right Sidebar ── */}
                        <div className="space-y-6">
                            {/* Trial & Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        Trial Period
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Trial toggle */}
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Enable Trial Period</p>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedPlan ? `Default: ${selectedPlan.trial_days} days` : 'Optional free trial'}
                                            </p>
                                        </div>
                                        <Switch
                                            id="enable_trial"
                                            checked={data.enable_trial}
                                            onCheckedChange={(checked) => setData({ ...data, enable_trial: checked, trial_ends_at: '' })}
                                        />
                                    </div>

                                    {data.enable_trial && (
                                        <div className="space-y-2">
                                            <Label htmlFor="trial_ends_at">Trial End Date</Label>
                                            <DatePickerSimple
                                                date={data.trial_ends_at ? new Date(data.trial_ends_at) : undefined}
                                                onSelect={(date) =>
                                                    setData({
                                                        ...data,
                                                        trial_ends_at: date ? dayjs(date).format('YYYY-MM-DD') : '',
                                                    })
                                                }
                                                placeholder="Select trial end date"
                                            />
                                            {errors.trial_ends_at && <p className="text-sm text-red-500">{errors.trial_ends_at}</p>}
                                            <p className="text-xs text-muted-foreground">
                                                Leave empty to use plan default
                                                {selectedPlan ? ` (${selectedPlan.trial_days} days)` : ' (14 days)'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="default_locale">Default Language</Label>
                                        <Select value={data.default_locale} onValueChange={(value) => setData({ ...data, default_locale: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Billing Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        Billing Settings
                                    </CardTitle>
                                    <CardDescription>Currency, taxes, payment & discounts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Currency */}
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select value={data.settings.billing.currency} onValueChange={(v) => updateBilling('currency', v)}>
                                            <SelectTrigger id="currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                                                <SelectItem value="USD">US Dollar ($)</SelectItem>
                                                <SelectItem value="EUR">Euro (€)</SelectItem>
                                                <SelectItem value="GBP">British Pound (£)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Tax Rate */}
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={data.settings.billing.tax_rate}
                                            onChange={(e) => updateBilling('tax_rate', e.target.value)}
                                            placeholder="7.5"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_method" className="flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                            Preferred Payment Method
                                        </Label>
                                        <Select
                                            value={data.settings.billing.payment_method}
                                            onValueChange={(v) => updateBilling('payment_method', v)}
                                        >
                                            <SelectTrigger id="payment_method">
                                                <SelectValue placeholder="Select payment method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors['settings.billing.payment_method'] && (
                                            <p className="text-sm text-red-500">{errors['settings.billing.payment_method']}</p>
                                        )}
                                    </div>

                                    {/* Discount */}
                                    <div className="space-y-3 rounded-lg border p-3">
                                        <p className="flex items-center gap-1.5 text-sm font-medium">
                                            <BadgePercent className="h-4 w-4 text-muted-foreground" />
                                            Discount
                                        </p>

                                        <div className="space-y-2">
                                            <Label htmlFor="discount_type">Discount Type</Label>
                                            <Select
                                                value={data.settings.billing.discount_type}
                                                onValueChange={(v) => {
                                                    updateBilling('discount_type', v);
                                                }}
                                            >
                                                <SelectTrigger id="discount_type">
                                                    <SelectValue placeholder="No discount" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount ({currencySymbol})</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {(data.settings.billing.discount_type === 'percentage' ||
                                            data.settings.billing.discount_type === 'fixed') && (
                                            <div className="space-y-2">
                                                <Label htmlFor="discount_value">
                                                    Discount Value{' '}
                                                    <Badge variant="outline" className="ml-1 text-xs">
                                                        {data.settings.billing.discount_type === 'percentage' ? '%' : currencySymbol}
                                                    </Badge>
                                                </Label>
                                                <div className="relative">
                                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                                                        {data.settings.billing.discount_type === 'percentage' ? '%' : currencySymbol}
                                                    </span>
                                                    <Input
                                                        id="discount_value"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={data.settings.billing.discount_type === 'percentage' ? '100' : undefined}
                                                        value={data.settings.billing.discount_value}
                                                        onChange={(e) => updateBilling('discount_value', e.target.value)}
                                                        placeholder={data.settings.billing.discount_type === 'percentage' ? '10' : '5000'}
                                                        className="pl-8"
                                                    />
                                                </div>
                                                {errors['settings.billing.discount_value'] && (
                                                    <p className="text-sm text-red-500">{errors['settings.billing.discount_value']}</p>
                                                )}
                                            </div>
                                        )}

                                        {(!data.settings.billing.discount_type || data.settings.billing.discount_type === 'none') && (
                                            <p className="text-xs text-muted-foreground">Select a discount type to apply a reduction to billing.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Selected Plan Summary */}
                            {selectedPlan && (
                                <Card className="border-primary/30 bg-primary/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center text-sm">
                                            <Tag className="mr-2 h-4 w-4" />
                                            Selected Plan Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Plan</span>
                                            <span className="font-medium">{selectedPlan.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Price (Per Month)</span>
                                            <span className="font-medium">
                                                {CURRENCY_SYMBOLS[selectedPlan.currency] ?? selectedPlan.currency}
                                                {Number(selectedPlan.price).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Duration ({multiplier} {multiplier === 1 ? 'month' : 'months'})
                                            </span>
                                            <span className="font-medium">
                                                {CURRENCY_SYMBOLS[selectedPlan.currency] ?? selectedPlan.currency}
                                                {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cycle</span>
                                            <span className="font-medium capitalize">{BILLING_CYCLE_SUFFIX[activeCycle] ?? activeCycle}</span>
                                        </div>
                                        {data.enable_trial && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Trial</span>
                                                <span className="font-medium">
                                                    {data.trial_ends_at
                                                        ? `Until ${dayjs(data.trial_ends_at).format('DD MMM YYYY')}`
                                                        : `${selectedPlan.trial_days} days`}
                                                </span>
                                            </div>
                                        )}
                                        {data.settings.billing.discount_type &&
                                            data.settings.billing.discount_type !== 'none' &&
                                            data.settings.billing.discount_value && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Discount</span>
                                                    <span className="font-medium text-green-600">
                                                        -{currencySymbol}
                                                        {discountAmount.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        {Number(data.settings.billing.tax_rate) > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tax ({data.settings.billing.tax_rate}%)</span>
                                                <span className="font-medium">
                                                    +{currencySymbol}
                                                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="my-2 border-t" />
                                        <div className="flex justify-between text-base">
                                            <span className="font-semibold text-foreground">Total Payment</span>
                                            <span className="font-bold text-primary">
                                                {currencySymbol}
                                                {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Admin Account */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <UserIcon className="mr-2 h-5 w-5" />
                                        Primary Admin Account
                                    </CardTitle>
                                    <CardDescription>Update the details and password for the primary admin user of this tenant</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user_name">Name</Label>
                                        <Input
                                            id="user_name"
                                            value={data.user.name}
                                            onChange={(e) => setData({ ...data, user: { ...data.user, name: e.target.value } })}
                                            placeholder="Admin Name"
                                            className={`${errors['user.name'] ? 'border-red-500' : ''}`}
                                        />
                                        {errors['user.name'] && <p className="text-sm text-red-500">{errors['user.name']}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user_email">Email</Label>
                                        <Input
                                            id="user_email"
                                            type="email"
                                            value={data.user.email}
                                            onChange={(e) => setData({ ...data, user: { ...data.user, email: e.target.value } })}
                                            placeholder="Admin Email"
                                            className={`${errors['user.email'] ? 'border-red-500' : ''}`}
                                        />
                                        {errors['user.email'] && <p className="text-sm text-red-500">{errors['user.email']}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user_password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="user_password"
                                                type={showPw ? 'text' : 'password'}
                                                value={data.user.password}
                                                onChange={(e) => setData({ ...data, user: { ...data.user, password: e.target.value } })}
                                                placeholder="Minimum 8 characters"
                                                className={`pr-10 pl-10 ${isStrong ? 'border-green-500' : data.user.password ? 'border-amber-500' : ''} ${errors['user.password'] ? 'border-red-500' : ''}`}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPw((v) => !v)}
                                                tabIndex={-1}
                                            >
                                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {data.user.password && (
                                            <div className="space-y-1 rounded-md bg-muted p-2 text-xs">
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.length ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.length ? '✓' : '✗'} Min 8 chars
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.letter ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.letter ? '✓' : '✗'} Letter (a-z, A-Z)
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.number ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.number ? '✓' : '✗'} Number (0-9)
                                                </div>
                                                <div
                                                    className={`flex items-center gap-1.5 ${strength.symbol ? 'text-green-600' : 'text-muted-foreground'}`}
                                                >
                                                    {strength.symbol ? '✓' : '✗'} Symbol (!@#$%^&*)
                                                </div>
                                            </div>
                                        )}
                                        {errors['user.password'] && <p className="text-sm text-red-500">{errors['user.password']}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="user_password_confirmation">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="user_password_confirmation"
                                                type={showPwConfirm ? 'text' : 'password'}
                                                value={data.user.password_confirmation}
                                                onChange={(e) => setData({ ...data, user: { ...data.user, password_confirmation: e.target.value } })}
                                                placeholder="Re-enter password"
                                                className={`pr-10 pl-10 ${!isStrong && data.user.password ? 'border-muted-foreground/50' : passwordMatch ? 'border-green-500' : passwordMismatch ? 'border-red-500' : ''} ${errors['user.password_confirmation'] ? 'border-red-500' : ''}`}
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                                                {data.user.password_confirmation !== '' && !isStrong && data.user.password && (
                                                    <X className="h-4 w-4 text-amber-500" />
                                                )}
                                                {passwordMatch && isStrong && <Check className="h-4 w-4 text-green-500" />}
                                                {passwordMismatch && isStrong && <X className="h-4 w-4 text-red-500" />}
                                                <button
                                                    type="button"
                                                    className="ml-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setShowPwConfirm((v) => !v)}
                                                    tabIndex={-1}
                                                >
                                                    {showPwConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        {data.user.password_confirmation !== '' && (
                                            <p
                                                className={`text-xs ${!isStrong && data.user.password ? 'text-amber-600' : passwordMatch ? 'text-green-600' : 'text-red-500'}`}
                                            >
                                                {!isStrong && data.user.password
                                                    ? 'Please meet password requirements first'
                                                    : passwordMatch
                                                      ? 'Passwords match'
                                                      : 'Passwords do not match'}
                                            </p>
                                        )}
                                        {errors['user.password_confirmation'] && (
                                            <p className="text-sm text-red-500">{errors['user.password_confirmation']}</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Leave blank to keep the existing password unchanged</p>
                                </CardContent>
                            </Card>

                            {/* Change Password */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <KeyRound className="mr-2 h-5 w-5" />
                                        Change Password
                                    </CardTitle>
                                    <CardDescription>Reset the password for a tenant user</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div onSubmit={handlePasswordReset} className="space-y-4">
                                        {/* User selector — only shown when the tenant has users */}
                                        {tenantUsers.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="pw_user_id">Select User</Label>
                                                <Select value={pwData.user_id} onValueChange={(v) => setPwData({ ...pwData, user_id: v })}>
                                                    <SelectTrigger id="pw_user_id">
                                                        <SelectValue placeholder="Select a user" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tenantUsers.map((u) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>
                                                                {u.name}
                                                                <span className="ml-1 text-xs text-muted-foreground">({u.email})</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {tenantUsers.length === 0 && (
                                            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                                No users found for this tenant yet.
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="pw_password">New Password</Label>
                                            <div className="relative">
                                                <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                                <input
                                                    id="pw_password"
                                                    type={showPw ? 'text' : 'password'}
                                                    value={pwData.password}
                                                    onChange={(e) => setPwData({ ...pwData, password: e.target.value })}
                                                    placeholder="Minimum 8 characters"
                                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-10 pl-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${pwIsStrong ? 'border-green-500' : pwData.password ? 'border-amber-500' : ''} ${pwErrors.password ? 'border-red-500' : 'border-input'}`}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                                    onClick={() => setShowPw((v) => !v)}
                                                    tabIndex={-1}
                                                >
                                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {pwData.password && (
                                                <div className="space-y-1 rounded-md bg-muted p-2 text-xs">
                                                    <div
                                                        className={`flex items-center gap-1.5 ${pwStrength.length ? 'text-green-600' : 'text-muted-foreground'}`}
                                                    >
                                                        {pwStrength.length ? '✓' : '✗'} Min 8 chars
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1.5 ${pwStrength.letter ? 'text-green-600' : 'text-muted-foreground'}`}
                                                    >
                                                        {pwStrength.letter ? '✓' : '✗'} Letter (a-z, A-Z)
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1.5 ${pwStrength.number ? 'text-green-600' : 'text-muted-foreground'}`}
                                                    >
                                                        {pwStrength.number ? '✓' : '✗'} Number (0-9)
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1.5 ${pwStrength.symbol ? 'text-green-600' : 'text-muted-foreground'}`}
                                                    >
                                                        {pwStrength.symbol ? '✓' : '✗'} Symbol (!@#$%^&*)
                                                    </div>
                                                </div>
                                            )}
                                            {pwErrors.password && <p className="text-sm text-red-500">{pwErrors.password}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pw_confirm">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                                <input
                                                    id="pw_confirm"
                                                    type={showPwConfirm ? 'text' : 'password'}
                                                    value={pwData.password_confirmation}
                                                    onChange={(e) => setPwData({ ...pwData, password_confirmation: e.target.value })}
                                                    placeholder="Re-enter password"
                                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-10 pl-10 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${!pwIsStrong && pwData.password ? 'border-muted-foreground/50' : pwMatch ? 'border-green-500 focus:ring-green-500' : pwMismatch ? 'border-red-500 focus:ring-red-500' : ''} ${pwErrors.password_confirmation ? 'border-red-500' : 'border-input'}`}
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                                                    {pwData.password_confirmation !== '' && !pwIsStrong && pwData.password && (
                                                        <X className="h-4 w-4 text-amber-500" />
                                                    )}
                                                    {pwMatch && pwIsStrong && <Check className="h-4 w-4 text-green-500" />}
                                                    {pwMismatch && pwIsStrong && <X className="h-4 w-4 text-red-500" />}
                                                    <button
                                                        type="button"
                                                        className="ml-1 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowPwConfirm((v) => !v)}
                                                        tabIndex={-1}
                                                    >
                                                        {showPwConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            {pwData.password_confirmation !== '' && (
                                                <p
                                                    className={`text-xs ${!pwIsStrong && pwData.password ? 'text-amber-600' : pwMatch ? 'text-green-600' : 'text-red-500'}`}
                                                >
                                                    {!pwIsStrong && pwData.password
                                                        ? 'Please meet password requirements first'
                                                        : pwMatch
                                                          ? 'Passwords match'
                                                          : 'Passwords do not match'}
                                                </p>
                                            )}
                                            {pwErrors.password_confirmation && (
                                                <p className="text-sm text-red-500">{pwErrors.password_confirmation}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={pwProcessing || tenantUsers.length === 0}
                                            className="w-full"
                                        >
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            {pwProcessing ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col space-y-2">
                                        <Button type="submit" disabled={processing} className="w-full">
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href={route('admin.tenants.show', tenant.id)}>Cancel</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
