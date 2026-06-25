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
import { type BreadcrumbItem } from '@/types';
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
    Lock,
    Mail,
    Package,
    Settings,
    Sparkles,
    Star,
    Tag,
    UserIcon,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Tenants',
        href: route('admin.tenants.index'),
    },
    {
        title: 'Create',
        href: route('admin.tenants.create'),
    },
];

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

interface Props {
    subscriptionPlans: SubscriptionPlan[];
}

const BILLING_CYCLE_LABELS: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annually: 'Six Months',
    yearly: 'Yearly',
};

const BILLING_CYCLE_SUFFIX: Record<string, string> = {
    monthly: 'month',
    quarterly: '3 months',
    semi_annually: '6 months',
    yearly: 'year',
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

export default function TenantsCreate({ subscriptionPlans }: Props) {
    const [data, setData] = useState({
        name: '',
        slug: '',
        type: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: DEFAULT_COUNTRY,
        logo: null as File | null,
        status: 'active',
        // Subscription
        subscription_plan_id: '',
        subscription_duration: '',
        enable_trial: false,
        trial_ends_at: '',
        default_locale: 'en',
        settings: {
            company_profile: {
                cac_reg_number: '',
                tax_number: '',
                naicom_reg_number: '',
                ncrib_reg_number: '',
                website: '',
            },
            billing: {
                currency: 'NGN',
                tax_rate: '7.5',
                payment_method: '',
                discount_type: '',
                discount_value: '',
            },
            notifications: {
                email_enabled: true,
                sms_enabled: false,
            },
        },
        known_company_id: '',
        known_company_source: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [slugAuto, setSlugAuto] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const passwordMatch = userData.password !== '' && userData.password_confirmation !== '' && userData.password === userData.password_confirmation;
    const passwordMismatch =
        userData.password !== '' && userData.password_confirmation !== '' && userData.password !== userData.password_confirmation;
    const checkPasswordStrength = (password: string) => ({
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
    const strength = checkPasswordStrength(userData.password);
    const strengthMet = Object.values(strength).filter(Boolean).length;
    const isStrong = strengthMet >= 4;

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

        // Only include trial_ends_at when trial is enabled
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
            ...(userData.password || userData.name || userData.email ? { user: userData } : {}),
        };

        router.post(route('admin.tenants.store'), formData as any, {
            forceFormData: true,
            onSuccess: () => {
                setProcessing(false);
                toast.success('Tenant created successfully');
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
                toast.error('Failed to create tenant. Please check the form.');
            },
        });
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tenant - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create New Tenant</h2>
                        <p className="text-muted-foreground">Add a new tenant to the platform</p>
                    </div>
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
                                            <Select value={data.type} onValueChange={(value) => setData({ ...data, type: value })}>
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
                                            <Select value={data.status} onValueChange={(value) => setData({ ...data, status: value })}>
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
                                                <SelectItem value="es">Spanish</SelectItem>
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
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount ({currencySymbol})</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {data.settings.billing.discount_type && (
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

                                        {!data.settings.billing.discount_type && (
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
                                                Duration ({CYCLE_MONTHS[data.subscription_duration || selectedPlan.billing_cycle]}{' '}
                                                {CYCLE_MONTHS[data.subscription_duration || selectedPlan.billing_cycle] === 1 ? 'month' : 'months'})
                                            </span>
                                            <span className="font-medium">
                                                {CURRENCY_SYMBOLS[selectedPlan.currency] ?? selectedPlan.currency}
                                                {(
                                                    Number(selectedPlan.price) *
                                                    CYCLE_MONTHS[data.subscription_duration || selectedPlan.billing_cycle]
                                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cycle</span>
                                            <span className="font-medium capitalize">
                                                {BILLING_CYCLE_LABELS[data.subscription_duration || selectedPlan.billing_cycle]}
                                            </span>
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
                                        {data.settings.billing.discount_type && data.settings.billing.discount_value && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Discount</span>
                                                <span className="font-medium text-green-600">
                                                    -{currencySymbol}
                                                    {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    <CardDescription>
                                        Optionally set the details and password for the primary admin user of this tenant
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user_name">Name</Label>
                                        <Input
                                            id="user_name"
                                            value={userData.name}
                                            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
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
                                            value={userData.email}
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
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
                                                type={showPassword ? 'text' : 'password'}
                                                value={userData.password}
                                                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                                                placeholder="Minimum 8 characters"
                                                className={`pr-10 pl-10 ${isStrong ? 'border-green-500' : userData.password ? 'border-amber-500' : ''} ${errors['user.password'] ? 'border-red-500' : ''}`}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword((v) => !v)}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {userData.password && (
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
                                                type={showConfirm ? 'text' : 'password'}
                                                value={userData.password_confirmation}
                                                onChange={(e) => setUserData({ ...userData, password_confirmation: e.target.value })}
                                                placeholder="Re-enter password"
                                                className={`pr-10 pl-10 ${!isStrong && userData.password ? 'border-muted-foreground/50' : passwordMatch ? 'border-green-500' : passwordMismatch ? 'border-red-500' : ''} ${errors['user.password_confirmation'] ? 'border-red-500' : ''}`}
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                                                {userData.password_confirmation !== '' && !isStrong && userData.password && (
                                                    <X className="h-4 w-4 text-amber-500" />
                                                )}
                                                {passwordMatch && isStrong && <Check className="h-4 w-4 text-green-500" />}
                                                {passwordMismatch && isStrong && <X className="h-4 w-4 text-red-500" />}
                                                <button
                                                    type="button"
                                                    className="ml-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setShowConfirm((v) => !v)}
                                                    tabIndex={-1}
                                                >
                                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        {userData.password_confirmation !== '' && (
                                            <p
                                                className={`text-xs ${!isStrong && userData.password ? 'text-amber-600' : passwordMatch ? 'text-green-600' : 'text-red-500'}`}
                                            >
                                                {!isStrong && userData.password
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
                                    <p className="text-xs text-muted-foreground">Leave blank if you do not wish to create a primary admin now</p>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col space-y-2">
                                        <Button type="submit" disabled={processing} className="w-full">
                                            {processing ? 'Creating...' : 'Create Tenant'}
                                        </Button>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href={route('admin.tenants.index')}>Cancel</Link>
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
