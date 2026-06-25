import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Award, Eye, FileText, Image, PenTool, RefreshCw, Save, Settings, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface CertificateSettings {
    auto_generate_on_policy_issue?: boolean;
    auto_issue_on_generation?: boolean;
    include_qr_code?: boolean;
    include_barcode?: boolean;
    enable_digital_signature?: boolean;
    require_approval_for_issuance?: boolean;
    certificate_numbering_format?: string;
    certificate_validity_days?: number;
    watermark_text?: string;
    watermark_opacity?: number;
    company_logo_path?: string;
    signature_stamp_path?: string;
    custom_styles?: string;
    email_settings?: string;
}

interface CertificateTemplate {
    id: number;
    name: string;
    type: string;
    category: string;
    description?: string;
    is_default: boolean;
}

interface Props {
    settings?: CertificateSettings;
    templates: CertificateTemplate[];
    availableTypes: Record<string, string>;
    availableCategories: Record<string, string>;
}

export default function CertificateSettings({ settings, templates, availableTypes, availableCategories }: Props) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);

    const { data, setData, patch, processing, errors } = useForm<CertificateSettings>({
        auto_generate_on_policy_issue: settings?.auto_generate_on_policy_issue || false,
        auto_issue_on_generation: settings?.auto_issue_on_generation || false,
        include_qr_code: settings?.include_qr_code || true,
        include_barcode: settings?.include_barcode || false,
        enable_digital_signature: settings?.enable_digital_signature || false,
        require_approval_for_issuance: settings?.require_approval_for_issuance || false,
        certificate_numbering_format: settings?.certificate_numbering_format || 'CERT-{YYYY}-{NNNNNNNN}',
        certificate_validity_days: settings?.certificate_validity_days || 365,
        watermark_text: settings?.watermark_text || '',
        watermark_opacity: settings?.watermark_opacity || 0.1,
        custom_styles: settings?.custom_styles || '',
        email_settings: settings?.email_settings || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('settings.certificates.update'), {
            onSuccess: () => {
                toast.success('Certificate settings updated successfully');
            },
            onError: () => {
                toast.error('Failed to update certificate settings');
            },
        });
    };

    const handleLogoUpload = (file: File) => {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('logo', file);

        router.post(route('settings.certificates.upload-logo'), formData, {
            onSuccess: () => {
                toast.success('Company logo uploaded successfully');
                setLogoPreview(URL.createObjectURL(file));
            },
            onError: () => {
                toast.error('Failed to upload company logo');
            },
            onFinish: () => {
                setUploadingLogo(false);
            },
        });
    };

    const handleSignatureUpload = (file: File) => {
        setUploadingSignature(true);
        const formData = new FormData();
        formData.append('signature', file);

        router.post(route('settings.certificates.upload-signature'), formData, {
            onSuccess: () => {
                toast.success('Signature stamp uploaded successfully');
                setSignaturePreview(URL.createObjectURL(file));
            },
            onError: () => {
                toast.error('Failed to upload signature stamp');
            },
            onFinish: () => {
                setUploadingSignature(false);
            },
        });
    };

    const handleDeleteLogo = () => {
        if (confirm('Are you sure you want to delete the company logo?')) {
            router.delete(route('settings.certificates.delete-logo'), {
                onSuccess: () => {
                    toast.success('Company logo deleted successfully');
                    setLogoPreview(null);
                },
                onError: () => {
                    toast.error('Failed to delete company logo');
                },
            });
        }
    };

    const handleDeleteSignature = () => {
        if (confirm('Are you sure you want to delete the signature stamp?')) {
            router.delete(route('settings.certificates.delete-signature'), {
                onSuccess: () => {
                    toast.success('Signature stamp deleted successfully');
                    setSignaturePreview(null);
                },
                onError: () => {
                    toast.error('Failed to delete signature stamp');
                },
            });
        }
    };

    const handleResetDefaults = () => {
        if (confirm('Are you sure you want to reset all certificate settings to defaults? This action cannot be undone.')) {
            router.post(
                route('settings.certificates.reset-defaults'),
                {},
                {
                    onSuccess: () => {
                        toast.success('Certificate settings reset to defaults');
                    },
                    onError: () => {
                        toast.error('Failed to reset certificate settings');
                    },
                },
            );
        }
    };

    const handleTestGeneration = (templateId: number) => {
        router.post(
            route('settings.certificates.test-generation'),
            { template_id: templateId },
            {
                onSuccess: () => {
                    toast.success('Test certificate generated successfully');
                },
                onError: () => {
                    toast.error('Failed to generate test certificate');
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Certificate Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Award className="h-6 w-6" />
                            Certificate Settings
                        </h1>
                        <p className="text-muted-foreground">Configure how certificates are generated and issued for your policies</p>
                    </div>
                    <Button variant="outline" onClick={handleResetDefaults} className="text-red-600 hover:text-red-700">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Basic Settings
                            </CardTitle>
                            <CardDescription>Configure basic certificate generation and issuance settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Auto Generate on Policy Issue</Label>
                                        <p className="text-xs text-gray-500">Automatically generate certificates when policies are issued</p>
                                    </div>
                                    <Switch
                                        checked={data.auto_generate_on_policy_issue}
                                        onCheckedChange={(checked) => setData('auto_generate_on_policy_issue', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Auto Issue on Generation</Label>
                                        <p className="text-xs text-gray-500">Automatically issue certificates after generation</p>
                                    </div>
                                    <Switch
                                        checked={data.auto_issue_on_generation}
                                        onCheckedChange={(checked) => setData('auto_issue_on_generation', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Include QR Code</Label>
                                        <p className="text-xs text-gray-500">Add QR code for certificate verification</p>
                                    </div>
                                    <Switch checked={data.include_qr_code} onCheckedChange={(checked) => setData('include_qr_code', checked)} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Include Barcode</Label>
                                        <p className="text-xs text-gray-500">Add barcode for certificate tracking</p>
                                    </div>
                                    <Switch checked={data.include_barcode} onCheckedChange={(checked) => setData('include_barcode', checked)} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Digital Signature</Label>
                                        <p className="text-xs text-gray-500">Enable digital signature for certificates</p>
                                    </div>
                                    <Switch
                                        checked={data.enable_digital_signature}
                                        onCheckedChange={(checked) => setData('enable_digital_signature', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Require Approval</Label>
                                        <p className="text-xs text-gray-500">Require approval before certificate issuance</p>
                                    </div>
                                    <Switch
                                        checked={data.require_approval_for_issuance}
                                        onCheckedChange={(checked) => setData('require_approval_for_issuance', checked)}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="numbering_format">Certificate Numbering Format</Label>
                                    <Input
                                        id="numbering_format"
                                        value={data.certificate_numbering_format}
                                        onChange={(e) => setData('certificate_numbering_format', e.target.value)}
                                        placeholder="CERT-{YYYY}-{NNNNNNNN}"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Use {'{YYYY}'} for year, {'{MM}'} for month, {'{DD}'} for day, {'{NNNNNNNN}'} for sequence number
                                    </p>
                                    {errors.certificate_numbering_format && (
                                        <p className="text-xs text-red-600">{errors.certificate_numbering_format}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="validity_days">Certificate Validity (Days)</Label>
                                    <Input
                                        id="validity_days"
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={data.certificate_validity_days}
                                        onChange={(e) => setData('certificate_validity_days', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500">Number of days the certificate remains valid (1-3650)</p>
                                    {errors.certificate_validity_days && <p className="text-xs text-red-600">{errors.certificate_validity_days}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visual Customization */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Visual Customization
                            </CardTitle>
                            <CardDescription>Upload company logo, signature stamp, and configure visual elements</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Company Logo */}
                                <div className="space-y-4">
                                    <Label>Company Logo</Label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                                        {logoPreview || settings?.company_logo_path ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={logoPreview || `/storage/${settings?.company_logo_path}`}
                                                    alt="Company Logo"
                                                    className="mx-auto h-20 w-auto object-contain"
                                                />
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                                        disabled={uploadingLogo}
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        {uploadingLogo ? 'Uploading...' : 'Replace'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleDeleteLogo}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                <div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                                        disabled={uploadingLogo}
                                                    >
                                                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                                                    </Button>
                                                    <p className="mt-2 text-xs text-gray-500">PNG, JPG, SVG up to 2MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleLogoUpload(file);
                                        }}
                                    />
                                </div>

                                {/* Signature Stamp */}
                                <div className="space-y-4">
                                    <Label>Signature Stamp</Label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                                        {signaturePreview || settings?.signature_stamp_path ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={signaturePreview || `/storage/${settings?.signature_stamp_path}`}
                                                    alt="Signature Stamp"
                                                    className="mx-auto h-20 w-auto object-contain"
                                                />
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById('signature-upload')?.click()}
                                                        disabled={uploadingSignature}
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        {uploadingSignature ? 'Uploading...' : 'Replace'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleDeleteSignature}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <PenTool className="mx-auto h-8 w-8 text-gray-400" />
                                                <div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById('signature-upload')?.click()}
                                                        disabled={uploadingSignature}
                                                    >
                                                        {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                                                    </Button>
                                                    <p className="mt-2 text-xs text-gray-500">PNG, JPG up to 1MB</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="signature-upload"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleSignatureUpload(file);
                                        }}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="watermark_text">Watermark Text</Label>
                                    <Input
                                        id="watermark_text"
                                        value={data.watermark_text || ''}
                                        onChange={(e) => setData('watermark_text', e.target.value)}
                                        placeholder="Optional watermark text"
                                    />
                                    <p className="text-xs text-gray-500">Optional text to display as watermark on certificates</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="watermark_opacity">Watermark Opacity</Label>
                                    <Input
                                        id="watermark_opacity"
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={data.watermark_opacity}
                                        onChange={(e) => setData('watermark_opacity', parseFloat(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500">Opacity value between 0 (transparent) and 1 (opaque)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Certificate Templates */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Certificate Templates
                            </CardTitle>
                            <CardDescription>Manage and test your certificate templates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {templates.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {templates.map((template) => (
                                        <div key={template.id} className="space-y-3 rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">{template.name}</h4>
                                                {template.is_default && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>Type: {availableTypes[template.type] || template.type}</p>
                                                <p>Category: {availableCategories[template.category] || template.category}</p>
                                                {template.description && <p className="text-xs">{template.description}</p>}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleTestGeneration(template.id)}
                                                    className="flex-1"
                                                >
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    Test
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500">
                                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <p>No certificate templates found.</p>
                                    <p className="text-sm">Create templates to customize your certificates.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Save Settings */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
