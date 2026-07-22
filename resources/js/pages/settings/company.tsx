import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, Eye, Link2, Mail, MapPin, Phone, Plug, Save, Star, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

interface CompanySettings {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    website?: string;
    tax_id?: string;
    description?: string;
    naicom_reg_number?: string;
    rc_number?: string;
    slogan?: string;
    logo?: string | File | null;
    signature?: string | File | null;
    stamp?: string | File | null;
    header_image?: string | File | null;
    footer_image?: string | File | null;
    paystack_public_key?: string;
    paystack_secret_key?: string;
    _method?: string;
}

interface EmailAccountProps {
    id: number;
    provider: 'gmail' | 'microsoft365' | 'smtp' | 'imap' | string;
    email: string;
    account_name: string;
    is_active: boolean;
    is_system_default: boolean;
    last_sync_at: string | null;
    created_at: string;
}

interface ThemeColorProps {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
}

interface Props {
    company?: CompanySettings;
    emailAccounts?: EmailAccountProps[];
    themeColors?: ThemeColorProps | null;
}

function AddAccountForm({ onSuccess }: { onSuccess: () => void }) {
    const [provider, setProvider] = useState('');
    const [email, setEmail] = useState('');
    const [accountName, setAccountName] = useState('');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState('993');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleOAuth = async (prov: string) => {
        try {
            const res = await fetch(`/api/v1/email/oauth/${prov}/redirect`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            });
            const json = await res.json();
            if (json.success && json.data?.authorization_url) {
                window.location.href = json.data.authorization_url;
            }
        } catch {
            toast.error(`Failed to initiate ${prov} connection`);
        }
    };

    const handleSubmit = async () => {
        if (!provider || !email) return;

        setSaving(true);

        const token = getXsrfToken();
        const headers: Record<string, string> = {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
        };
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }

        const body = new URLSearchParams({
            provider,
            email,
            account_name: accountName || email,
            smtp_host: ['smtp', 'imap'].includes(provider) ? smtpHost : '',
            smtp_port: ['smtp', 'imap'].includes(provider) ? smtpPort : '',
        });

        if (['smtp', 'imap'].includes(provider)) {
            body.set('imap_host', provider === 'imap' ? imapHost : '');
            body.set('imap_port', provider === 'imap' ? imapPort : '');
            if (password) body.set('password', password);
        }

        try {
            const res = await fetch('/api/v1/email/accounts', {
                method: 'POST',
                headers,
                body,
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Account connected');
                onSuccess();
            } else {
                toast.error(json.message || 'Failed to connect account');
            }
        } catch {
            toast.error('Failed to connect account');
        } finally {
            setSaving(false);
        }
    };

    if (['gmail', 'microsoft365'].includes(provider)) {
        return (
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    You will be redirected to {provider === 'gmail' ? 'Google' : 'Microsoft'} to authorize the connection.
                </p>
                <Button onClick={() => handleOAuth(provider)} disabled={saving} className="w-full">
                    Continue to {provider === 'gmail' ? 'Google' : 'Microsoft'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gmail">Gmail (OAuth)</SelectItem>
                        <SelectItem value="microsoft365">Microsoft 365 (OAuth)</SelectItem>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="imap">IMAP</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {provider && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="ae-email">Email Address</Label>
                        <Input id="ae-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ae-name">Account Name</Label>
                        <Input id="ae-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="My Account" />
                    </div>

                    {['smtp', 'imap'].includes(provider) && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ae-smtp-host">SMTP Host</Label>
                                    <Input
                                        id="ae-smtp-host"
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ae-smtp-port">SMTP Port</Label>
                                    <Input id="ae-smtp-port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ae-password">Password / App Password</Label>
                                <Input
                                    id="ae-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </div>
                        </>
                    )}

                    {provider === 'imap' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ae-imap-host">IMAP Host</Label>
                                <Input
                                    id="ae-imap-host"
                                    value={imapHost}
                                    onChange={(e) => setImapHost(e.target.value)}
                                    placeholder="imap.example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ae-imap-port">IMAP Port</Label>
                                <Input id="ae-imap-port" value={imapPort} onChange={(e) => setImapPort(e.target.value)} placeholder="993" />
                            </div>
                        </div>
                    )}

                    <Button onClick={handleSubmit} disabled={saving || !email} className="w-full">
                        {saving ? 'Connecting...' : 'Connect Account'}
                    </Button>
                </>
            )}
        </div>
    );
}

const DEFAULT_PRIMARY = '#3b82f6';
const DEFAULT_SECONDARY = '#8b5cf6';
const DEFAULT_ACCENT = '#10b981';

export default function CompanySettings({ company, emailAccounts, themeColors }: Props) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [stampPreview, setStampPreview] = useState<string | null>(null);
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);
    const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null);
    const [removeLogoBg, setRemoveLogoBg] = useState(false);
    const [removeSignatureBg, setRemoveSignatureBg] = useState(false);
    const [removeStampBg, setRemoveStampBg] = useState(false);
    const [removeHeaderBg, setRemoveHeaderBg] = useState(false);
    const [removeFooterBg, setRemoveFooterBg] = useState(false);

    const page = usePage<{ theme?: { sidebar_style?: string } }>();
    const defaultSidebarStyle = page.props.theme?.sidebar_style ?? 'gradient';

    const { data, setData, post, processing, errors } = useForm({
        name: company?.name || '',
        email: company?.email || '',
        phone: company?.phone || '',
        address: company?.address || '',
        city: company?.city || '',
        state: company?.state || '',
        postal_code: company?.postal_code || '',
        country: company?.country || 'Nigeria',
        website: company?.website || '',
        tax_id: company?.tax_id || '',
        description: company?.description || '',
        naicom_reg_number: company?.naicom_reg_number || '',
        rc_number: company?.rc_number || '',
        slogan: company?.slogan || '',
        logo: null as string | File | null,
        signature: null as string | File | null,
        stamp: null as string | File | null,
        header_image: null as string | File | null,
        footer_image: null as string | File | null,
        paystack_public_key: company?.paystack_public_key || '',
        paystack_secret_key: company?.paystack_secret_key || '',
        primary_color: themeColors?.primary_color || DEFAULT_PRIMARY,
        secondary_color: themeColors?.secondary_color || DEFAULT_SECONDARY,
        accent_color: themeColors?.accent_color || DEFAULT_ACCENT,
        sidebar_style: defaultSidebarStyle,
        _method: 'patch',
    });
    const processImageRemoveBackground = async (file: File): Promise<{ result: File; wasProcessed: boolean }> => {
        const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const MAX_SIZE_MB = 10;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            return { result: file, wasProcessed: false };
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return { result: file, wasProcessed: false };
        }

        return new Promise((resolve) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new window.Image();

            img.onload = () => {
                const MAX_DIM = 2000;
                let targetW = img.width;
                let targetH = img.height;
                if (targetW > MAX_DIM || targetH > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
                    targetW = Math.round(targetW * ratio);
                    targetH = Math.round(targetH * ratio);
                }

                const canvas = window.document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    return resolve({ result: file, wasProcessed: false });
                }

                ctx.drawImage(img, 0, 0, targetW, targetH);
                URL.revokeObjectURL(objectUrl);

                const imageData = ctx.getImageData(0, 0, targetW, targetH);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    const maxC = Math.max(r, g, b);
                    const minC = Math.min(r, g, b);
                    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

                    if (lum > 200 && saturation < 0.15) {
                        data[i + 3] = 0;
                    } else if (lum > 160 && saturation < 0.08) {
                        data[i + 3] = Math.round(((200 - lum) / 40) * 255);
                    } else {
                        data[i] = Math.max(0, Math.round(r * 0.75));
                        data[i + 1] = Math.max(0, Math.round(g * 0.75));
                        data[i + 2] = Math.max(0, Math.round(b * 0.8));
                        data[i + 3] = Math.min(255, data[i + 3] + 20);
                    }
                }

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve({ result: file, wasProcessed: false });
                        }
                        const newName = file.name.replace(/\.[^/.]+$/, '') + '_transparent.png';
                        const processedFile = new File([blob], newName, { type: 'image/png' });
                        resolve({ result: processedFile, wasProcessed: true });
                    },
                    'image/png',
                    0.95,
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({ result: file, wasProcessed: false });
            };

            img.src = objectUrl;
        });
    };

    const handleImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'logo' | 'signature' | 'stamp' | 'header_image' | 'footer_image',
        setter: React.Dispatch<React.SetStateAction<string | null>>,
        removeBg: boolean = false,
    ) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) {
            setData(field, null);
            setter(null);
            return;
        }

        const targetFile = removeBg ? (await processImageRemoveBackground(file)).result : file;
        setData(field, targetFile);
        const url = URL.createObjectURL(targetFile);
        setter(url);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('settings.company.update'), {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                toast.loading('Updating company settings...', { id: 'update-company' });
            },
            onSuccess: () => {
                toast.success('Company settings updated successfully', {
                    id: 'update-company',
                    description: 'Your company information has been saved',
                    duration: 4000,
                });
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to update company settings', {
                    id: 'update-company',
                    description: 'Please check the form errors and try again',
                    duration: 5000,
                });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Company Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
                    <p className="text-muted-foreground">Manage your organization's basic information</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Company Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Company Information
                            </CardTitle>
                            <CardDescription>Basic details about your organization</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter company name"
                                        className={errors.name ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slogan">Company Slogan/Motto</Label>
                                    <Input
                                        id="slogan"
                                        value={data.slogan}
                                        onChange={(e) => setData('slogan', e.target.value)}
                                        placeholder="Ex: Your reliable insurance partner"
                                        className={errors.slogan ? 'border-red-500' : ''}
                                    />
                                    {errors.slogan && <p className="mt-1 text-sm text-red-600">{errors.slogan}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="naicom_reg_number">NAICOM Registration Number</Label>
                                    <Input
                                        id="naicom_reg_number"
                                        value={data.naicom_reg_number}
                                        onChange={(e) => setData('naicom_reg_number', e.target.value)}
                                        placeholder="Enter NAICOM reg number"
                                        className={errors.naicom_reg_number ? 'border-red-500' : ''}
                                    />
                                    {errors.naicom_reg_number && <p className="mt-1 text-sm text-red-600">{errors.naicom_reg_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rc_number">C.A.C Registration Number (RC Number)</Label>
                                    <Input
                                        id="rc_number"
                                        value={data.rc_number}
                                        onChange={(e) => setData('rc_number', e.target.value)}
                                        placeholder="RC Number"
                                        className={errors.rc_number ? 'border-red-500' : ''}
                                    />
                                    {errors.rc_number && <p className="mt-1 text-sm text-red-600">{errors.rc_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Company Email *</Label>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="company@example.com"
                                            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                            required
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <div className="relative">
                                        <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+234 xxx xxx xxxx"
                                            className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                                            required
                                        />
                                    </div>
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://www.example.com"
                                        className={errors.website ? 'border-red-500' : ''}
                                    />
                                    {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">Tax ID</Label>
                                    <Input
                                        id="tax_id"
                                        value={data.tax_id}
                                        onChange={(e) => setData('tax_id', e.target.value)}
                                        placeholder="Enter tax identification number"
                                        className={errors.tax_id ? 'border-red-500' : ''}
                                    />
                                    {errors.tax_id && <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Company Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of your company's services and expertise"
                                    className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-lg font-medium">Brand & Identification</h3>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="logo">Company Logo (Max 20MB)</Label>
                                        {(company?.logo && typeof company.logo === 'string') || logoPreview ? (
                                            <div className="mb-2">
                                                <img
                                                    src={logoPreview || `/storage/${company?.logo}`}
                                                    alt="Logo"
                                                    className="h-16 w-auto object-contain"
                                                />
                                            </div>
                                        ) : null}
                                        <Input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, 'logo', setLogoPreview, removeLogoBg)}
                                            className={errors.logo ? 'border-red-500' : ''}
                                        />
                                        <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={removeLogoBg}
                                                onChange={(e) => setRemoveLogoBg(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-300"
                                            />
                                            Remove background
                                        </label>
                                        {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signature">Authorized Signature (Max 10MB)</Label>
                                        {(company?.signature && typeof company.signature === 'string') || signaturePreview ? (
                                            <div className="mb-2">
                                                <img
                                                    src={signaturePreview || `/storage/${company?.signature}`}
                                                    alt="Signature"
                                                    className="h-16 w-auto object-contain"
                                                />
                                            </div>
                                        ) : null}
                                        <Input
                                            id="signature"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, 'signature', setSignaturePreview, removeSignatureBg)}
                                            className={errors.signature ? 'border-red-500' : ''}
                                        />
                                        <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={removeSignatureBg}
                                                onChange={(e) => setRemoveSignatureBg(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-300"
                                            />
                                            Remove background
                                        </label>
                                        {errors.signature && <p className="mt-1 text-sm text-red-600">{errors.signature}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="stamp">Company Stamp (Max 10MB)</Label>
                                        {(company?.stamp && typeof company.stamp === 'string') || stampPreview ? (
                                            <div className="mb-2">
                                                <img
                                                    src={stampPreview || `/storage/${company?.stamp}`}
                                                    alt="Stamp"
                                                    className="h-16 w-auto object-contain"
                                                />
                                            </div>
                                        ) : null}
                                        <Input
                                            id="stamp"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, 'stamp', setStampPreview, removeStampBg)}
                                            className={errors.stamp ? 'border-red-500' : ''}
                                        />
                                        <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={removeStampBg}
                                                onChange={(e) => setRemoveStampBg(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-300"
                                            />
                                            Remove background
                                        </label>
                                        {errors.stamp && <p className="mt-1 text-sm text-red-600">{errors.stamp}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="header_image">Header Image (Max 20MB)</Label>
                                        {(company?.header_image && typeof company.header_image === 'string') || headerImagePreview ? (
                                            <div className="mb-2">
                                                <img
                                                    src={headerImagePreview || `/storage/${company?.header_image}`}
                                                    alt="Header"
                                                    className="h-16 w-auto object-contain"
                                                />
                                            </div>
                                        ) : null}
                                        <Input
                                            id="header_image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, 'header_image', setHeaderImagePreview, removeHeaderBg)}
                                            className={errors.header_image ? 'border-red-500' : ''}
                                        />
                                        <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={removeHeaderBg}
                                                onChange={(e) => setRemoveHeaderBg(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-300"
                                            />
                                            Remove background
                                        </label>
                                        {errors.header_image && <p className="mt-1 text-sm text-red-600">{errors.header_image}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="footer_image">Footer Image (Max 20MB)</Label>
                                        {(company?.footer_image && typeof company.footer_image === 'string') || footerImagePreview ? (
                                            <div className="mb-2">
                                                <img
                                                    src={footerImagePreview || `/storage/${company?.footer_image}`}
                                                    alt="Footer"
                                                    className="h-16 w-auto object-contain"
                                                />
                                            </div>
                                        ) : null}
                                        <Input
                                            id="footer_image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, 'footer_image', setFooterImagePreview, removeFooterBg)}
                                            className={errors.footer_image ? 'border-red-500' : ''}
                                        />
                                        <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={removeFooterBg}
                                                onChange={(e) => setRemoveFooterBg(e.target.checked)}
                                                className="h-3 w-3 rounded border-gray-300"
                                            />
                                            Remove background
                                        </label>
                                        {errors.footer_image && <p className="mt-1 text-sm text-red-600">{errors.footer_image}</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Brand Colors */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Brand Colors
                            </CardTitle>
                            <CardDescription>Set your organization's brand colors. These are applied across the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_color">Primary Color</Label>
                                    <ColorPicker
                                        value={data.primary_color}
                                        onChange={(color) => setData('primary_color', color)}
                                        label="Primary Color"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary_color">Secondary Color</Label>
                                    <ColorPicker
                                        value={data.secondary_color}
                                        onChange={(color) => setData('secondary_color', color)}
                                        label="Secondary Color"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accent_color">Accent Color</Label>
                                    <ColorPicker
                                        value={data.accent_color}
                                        onChange={(color) => setData('accent_color', color)}
                                        label="Accent Color"
                                    />
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="rounded-lg border p-4">
                                <p className="mb-3 text-sm font-medium">Preview</p>
                                <div className="space-y-3">
                                    <div
                                        className="h-8 w-full rounded-md"
                                        style={{
                                            background: `linear-gradient(135deg, ${data.primary_color}, ${data.secondary_color}, ${data.accent_color})`,
                                        }}
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded" style={{ backgroundColor: data.primary_color }} />
                                            <span className="font-mono text-xs text-muted-foreground">{data.primary_color}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded" style={{ backgroundColor: data.secondary_color }} />
                                            <span className="font-mono text-xs text-muted-foreground">{data.secondary_color}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded" style={{ backgroundColor: data.accent_color }} />
                                            <span className="font-mono text-xs text-muted-foreground">{data.accent_color}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" style={{ backgroundColor: data.primary_color, color: '#fff', border: 'none' }}>
                                            Primary Button
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            style={{ borderColor: data.secondary_color, color: data.secondary_color }}
                                        >
                                            Secondary
                                        </Button>
                                        <span
                                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                            style={{ backgroundColor: data.accent_color + '20', color: data.accent_color }}
                                        >
                                            Accent Badge
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Background */}
                            <div className="rounded-lg border p-4">
                                <p className="mb-3 text-sm font-medium">Sidebar Background</p>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('sidebar_style', 'solid')}
                                            className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                                data.sidebar_style === 'solid'
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-muted hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            <div className="h-10 w-full rounded" style={{ backgroundColor: data.primary_color }} />
                                            <span className="font-medium">Solid</span>
                                            <span className="text-muted-foreground">Primary color</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('sidebar_style', 'gradient')}
                                            className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                                data.sidebar_style === 'gradient'
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-muted hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            <div
                                                className="h-10 w-full rounded"
                                                style={{
                                                    background: `linear-gradient(135deg, ${data.primary_color}, ${data.secondary_color}, ${data.accent_color})`,
                                                }}
                                            />
                                            <span className="font-medium">Gradient</span>
                                            <span className="text-muted-foreground">Primary → Secondary → Accent</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('sidebar_style', 'transparent')}
                                            className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 text-xs transition-all ${
                                                data.sidebar_style === 'transparent'
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-muted hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            <div className="flex h-10 w-full items-center justify-center rounded border-2 border-dashed border-muted-foreground/30">
                                                <span className="text-xs text-muted-foreground/50">None</span>
                                            </div>
                                            <span className="font-medium">Transparent</span>
                                            <span className="text-muted-foreground">No background</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Address Information
                            </CardTitle>
                            <CardDescription>Physical location and mailing address</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Street Address *</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Enter complete street address"
                                    className={`min-h-[80px] ${errors.address ? 'border-red-500' : ''}`}
                                    required
                                />
                                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="Lagos"
                                        className={errors.city ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        placeholder="Lagos State"
                                        className={errors.state ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">Postal Code</Label>
                                    <Input
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="100001"
                                        className={errors.postal_code ? 'border-red-500' : ''}
                                    />
                                    {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country *</Label>
                                    <Input
                                        id="country"
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        placeholder="Nigeria"
                                        className={errors.country ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Gateway Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-credit-card"
                                >
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <line x1="2" x2="22" y1="10" y2="10" />
                                </svg>
                                Payment Gateway Settings
                            </CardTitle>
                            <CardDescription>Configure Paystack API credentials for processing payments and automated payouts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
                                    <Input
                                        id="paystack_public_key"
                                        type="text"
                                        value={data.paystack_public_key}
                                        onChange={(e) => setData('paystack_public_key', e.target.value)}
                                        placeholder="pk_test_..."
                                        className={errors.paystack_public_key ? 'border-red-500' : ''}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Used for frontend checkout operations.</p>
                                    {errors.paystack_public_key && <p className="mt-1 text-sm text-red-600">{errors.paystack_public_key}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
                                    <Input
                                        id="paystack_secret_key"
                                        type="password"
                                        value={data.paystack_secret_key}
                                        onChange={(e) => setData('paystack_secret_key', e.target.value)}
                                        placeholder="sk_test_..."
                                        className={errors.paystack_secret_key ? 'border-red-500' : ''}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Used for secure backend verifications and transfer payouts.</p>
                                    {errors.paystack_secret_key && <p className="mt-1 text-sm text-red-600">{errors.paystack_secret_key}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Accounts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email Accounts
                            </CardTitle>
                            <CardDescription>
                                Connect and manage your organization's email accounts for sending business communications and system notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {emailAccounts && emailAccounts.length > 0 ? (
                                <div className="space-y-3">
                                    {emailAccounts.map((account) => (
                                        <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    {account.provider === 'gmail' ? (
                                                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-500" fill="currentColor">
                                                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.91 12 9.548l6.545-4.638 1.528-1.418C21.691 2.28 24 3.434 24 5.457z" />
                                                        </svg>
                                                    ) : account.provider === 'microsoft365' ? (
                                                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="currentColor">
                                                            <path d="M21.2 2H2.8A.8.8 0 0 0 2 2.8v18.4c0 .44.36.8.8.8h18.4a.8.8 0 0 0 .8-.8V2.8a.8.8 0 0 0-.8-.8zm-1.6 3.2v2.4h-2.4V5.2h2.4zM12 8.8a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2zm7.2 10.4H4.8V6.4h2.4v2.4a4.8 4.8 0 0 0 9.6 0V6.4h2.4v12.8z" />
                                                        </svg>
                                                    ) : (
                                                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-500" fill="currentColor">
                                                            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{account.account_name}</p>
                                                        {account.is_system_default && (
                                                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-xs text-amber-700">
                                                                <Star className="mr-1 h-3 w-3" />
                                                                System Default
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{account.email}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-xs">
                                                            {account.is_active ? 'Connected' : 'Disconnected'}
                                                        </Badge>
                                                        {account.last_sync_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Last sync: {new Date(account.last_sync_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {['gmail', 'microsoft365'].includes(account.provider) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/v1/email/oauth/${account.provider}/redirect`, {
                                                                    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                                                                });
                                                                const json = await res.json();
                                                                if (json.success && json.data?.authorization_url) {
                                                                    window.location.href = json.data.authorization_url;
                                                                }
                                                            } catch {
                                                                toast.error('Failed to initiate re-authentication');
                                                            }
                                                        }}
                                                    >
                                                        <Link2 className="mr-1 h-3 w-3" />
                                                        Re-auth
                                                    </Button>
                                                )}
                                                {!account.is_system_default && account.is_active && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            router.patch(
                                                                route('settings.company.email-accounts.update', account.id),
                                                                {
                                                                    is_system_default: '1',
                                                                },
                                                                {
                                                                    onSuccess: () => {
                                                                        toast.success('Set as system default');
                                                                        window.location.reload();
                                                                    },
                                                                    onError: () => {
                                                                        toast.error('Failed to set as default');
                                                                    },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Set as Default
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (!confirm('Disconnect this email account?')) return;
                                                        router.delete(route('settings.company.email-accounts.destroy', account.id), {
                                                            onSuccess: () => {
                                                                toast.success('Account disconnected');
                                                                window.location.reload();
                                                            },
                                                            onError: (errors) => {
                                                                toast.error(errors.message || 'Failed to disconnect');
                                                            },
                                                        });
                                                    }}
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    Disconnect
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                    <Plug className="mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No email accounts connected</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Add a Gmail, Microsoft 365, SMTP, or IMAP account to send and receive business emails
                                    </p>
                                </div>
                            )}

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <Plug className="mr-2 h-4 w-4" />
                                        Add Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Add Email Account</DialogTitle>
                                        <DialogDescription>Select a provider to connect a new email account.</DialogDescription>
                                    </DialogHeader>
                                    <AddAccountForm onSuccess={() => window.location.reload()} />
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Company Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
