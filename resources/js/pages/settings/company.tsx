import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Mail, MapPin, Phone, Save } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export interface SmtpSettings {
    use_custom?: boolean;
    host?: string;
    port?: string | number;
    username?: string;
    password?: string;
    encryption?: string;
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
    smtp_settings?: SmtpSettings;
    paystack_public_key?: string;
    paystack_secret_key?: string;
    _method?: string;
}

interface Props {
    company?: CompanySettings;
}

export default function CompanySettings({ company }: Props) {
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
        smtp_settings: company?.smtp_settings || {
            use_custom: false,
            host: '',
            port: '',
            username: '',
            password: '',
            encryption: 'tls',
        },
        paystack_public_key: company?.paystack_public_key || '',
        paystack_secret_key: company?.paystack_secret_key || '',
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                        <Label htmlFor="logo">Company Logo (Max 2MB)</Label>
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
                                        <Label htmlFor="signature">Authorized Signature (Max 1MB)</Label>
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
                                        <Label htmlFor="stamp">Company Stamp (Max 1MB)</Label>
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
                                        <Label htmlFor="header_image">Header Image (Max 2MB)</Label>
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
                                        <Label htmlFor="footer_image">Footer Image (Max 2MB)</Label>
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                    {/* Email / SMTP Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email Settings
                            </CardTitle>
                            <CardDescription>Configure how emails are sent from your organization</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Use Custom SMTP Server</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send emails using your own mail server instead of the default InsurePal mail server.
                                    </p>
                                </div>
                                <Switch
                                    checked={data.smtp_settings?.use_custom || false}
                                    onCheckedChange={(checked) =>
                                        setData('smtp_settings', { ...data.smtp_settings, use_custom: checked } as SmtpSettings)
                                    }
                                />
                            </div>

                            {data.smtp_settings?.use_custom && (
                                <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp_host">SMTP Host *</Label>
                                        <Input
                                            id="smtp_host"
                                            value={data.smtp_settings.host || ''}
                                            onChange={(e) =>
                                                setData('smtp_settings', { ...data.smtp_settings, host: e.target.value } as SmtpSettings)
                                            }
                                            placeholder="smtp.example.com"
                                            className={errors['smtp_settings.host'] ? 'border-red-500' : ''}
                                            required={data.smtp_settings.use_custom}
                                        />
                                        {errors['smtp_settings.host'] && <p className="mt-1 text-sm text-red-600">{errors['smtp_settings.host']}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="smtp_port">SMTP Port *</Label>
                                        <Input
                                            id="smtp_port"
                                            type="number"
                                            value={data.smtp_settings.port || ''}
                                            onChange={(e) =>
                                                setData('smtp_settings', { ...data.smtp_settings, port: e.target.value } as SmtpSettings)
                                            }
                                            placeholder="587"
                                            className={errors['smtp_settings.port'] ? 'border-red-500' : ''}
                                            required={data.smtp_settings.use_custom}
                                        />
                                        {errors['smtp_settings.port'] && <p className="mt-1 text-sm text-red-600">{errors['smtp_settings.port']}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="smtp_username">Username *</Label>
                                        <Input
                                            id="smtp_username"
                                            value={data.smtp_settings.username || ''}
                                            onChange={(e) =>
                                                setData('smtp_settings', { ...data.smtp_settings, username: e.target.value } as SmtpSettings)
                                            }
                                            placeholder="user@example.com"
                                            className={errors['smtp_settings.username'] ? 'border-red-500' : ''}
                                            required={data.smtp_settings.use_custom}
                                        />
                                        {errors['smtp_settings.username'] && (
                                            <p className="mt-1 text-sm text-red-600">{errors['smtp_settings.username']}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="smtp_password">Password</Label>
                                        <Input
                                            id="smtp_password"
                                            type="password"
                                            value={data.smtp_settings.password || ''}
                                            onChange={(e) =>
                                                setData('smtp_settings', { ...data.smtp_settings, password: e.target.value } as SmtpSettings)
                                            }
                                            placeholder={company?.smtp_settings?.password ? 'Leave blank to keep existing' : 'Enter SMTP password'}
                                            className={errors['smtp_settings.password'] ? 'border-red-500' : ''}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">Keep blank if you don't want to change it.</p>
                                        {errors['smtp_settings.password'] && (
                                            <p className="mt-1 text-sm text-red-600">{errors['smtp_settings.password']}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="smtp_encryption">Encryption</Label>
                                        <select
                                            id="smtp_encryption"
                                            value={data.smtp_settings.encryption || 'tls'}
                                            onChange={(e) =>
                                                setData('smtp_settings', {
                                                    ...data.smtp_settings,
                                                    encryption: e.target.value as string,
                                                } as SmtpSettings)
                                            }
                                            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${errors['smtp_settings.encryption'] ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">None</option>
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="starttls">STARTTLS</option>
                                        </select>
                                        {errors['smtp_settings.encryption'] && (
                                            <p className="mt-1 text-sm text-red-600">{errors['smtp_settings.encryption']}</p>
                                        )}
                                    </div>
                                </div>
                            )}
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
