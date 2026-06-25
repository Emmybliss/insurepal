import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Eye, ImageUp, Save, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EditableLabelConfig {
    label: string;
    default: string;
    key: string;
}

interface ColorConfig {
    label: string;
    selector: string;
    property: string;
    type: string;
}

interface TypographyConfig {
    label: string;
    selector: string;
    property: string;
    type: string;
    unit?: string;
    min?: number;
    max?: number;
    options?: Array<{ label: string; value: string }>;
}

interface CustomizableProperties {
    colors?: Record<string, ColorConfig>;
    typography?: Record<string, TypographyConfig>;
}

interface OverrideData {
    id?: number;
    template_key?: string;
    label_overrides?: Record<string, string> | null;
    color_overrides?: Record<string, string> | null;
    font_overrides?: Record<string, string> | null;
    header_image?: string | null;
    footer_image?: string | null;
    signature?: string | null;
    stamp?: string | null;
    element_toggles?: ElementToggles | null;
}

interface ElementToggles {
    header: boolean;
    footer: boolean;
    prepared_by: boolean;
    authorized_signature: boolean;
    stamp: boolean;
}

interface TemplateConfig {
    key: string;
    label: string;
    type: string;
    view_path: string;
    customizable_properties?: CustomizableProperties;
    editable_labels?: Record<string, EditableLabelConfig>;
}

interface EditProps {
    template: TemplateConfig;
    override: OverrideData | null;
    tenantBranding: {
        header_image: string | null;
        footer_image: string | null;
        signature: string | null;
        stamp: string | null;
    };
    isDefault: boolean;
    defaultTemplateKey: string | null;
}

type ImageField = 'header_image' | 'footer_image' | 'signature' | 'stamp';

const imageFieldLabels: Record<ImageField, string> = {
    header_image: 'Header Image',
    footer_image: 'Footer Image',
    signature: 'Signature',
    stamp: 'Stamp',
};

const typeLabels: Record<string, string> = {
    certificate: 'Certificate',
    invoice: 'Invoice',
    debit_note: 'Debit Note',
    credit_note: 'Credit Note',
    receipt: 'Receipt',
    broker_slip: 'Broker Slip',
};

export default function Edit({ template, override, tenantBranding, isDefault, defaultTemplateKey }: EditProps) {
    const [saving, setSaving] = useState(false);

    const [labelValues, setLabelValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        if (template.editable_labels) {
            for (const [key, config] of Object.entries(template.editable_labels)) {
                initial[key] = override?.label_overrides?.[config.key] ?? config.default;
            }
        }
        return initial;
    });

    const [colorValues, setColorValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        const colors = template.customizable_properties?.colors ?? {};
        for (const key of Object.keys(colors)) {
            initial[key] = override?.color_overrides?.[key] ?? '';
        }
        return initial;
    });

    const [fontValues, setFontValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        const typography = template.customizable_properties?.typography ?? {};
        for (const key of Object.keys(typography)) {
            initial[key] = override?.font_overrides?.[key] ?? '';
        }
        return initial;
    });

    const [imagePreviews, setImagePreviews] = useState<Record<ImageField, string | null>>({
        header_image: null,
        footer_image: null,
        signature: null,
        stamp: null,
    });

    const [imageFiles, setImageFiles] = useState<Record<ImageField, File | null>>({
        header_image: null,
        footer_image: null,
        signature: null,
        stamp: null,
    });

    const defaultToggles: ElementToggles = {
        header: true,
        footer: true,
        prepared_by: true,
        authorized_signature: true,
        stamp: true,
    };

    const [elementToggles, setElementToggles] = useState<ElementToggles>(
        override?.element_toggles ?? defaultToggles,
    );

    const [saveCount, setSaveCount] = useState(0);

    const previewUrl = `${route('templates.preview', template.key)}?toggles=${encodeURIComponent(JSON.stringify(elementToggles))}`;

    const getImageUrl = (field: ImageField): string | null => {
        if (imagePreviews[field]) return imagePreviews[field];
        if (override?.[field]) return `/storage/${override[field]}`;
        return tenantBranding[field];
    };

    const handleImageChange = (field: ImageField, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (!file) {
            setImageFiles((prev) => ({ ...prev, [field]: null }));
            setImagePreviews((prev) => ({ ...prev, [field]: null }));
            return;
        }
        setImageFiles((prev) => ({ ...prev, [field]: file }));
        setImagePreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

    const handleLabelChange = (key: string, value: string) => {
        setLabelValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleColorChange = (key: string, value: string) => {
        setColorValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFontChange = (key: string, value: string) => {
        setFontValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleToggle = (key: keyof ElementToggles) => {
        setElementToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const buildLabelOverrides = (): Record<string, string> => {
        const overrides: Record<string, string> = {};
        if (template.editable_labels) {
            for (const [key, config] of Object.entries(template.editable_labels)) {
                if (labelValues[key] !== config.default) {
                    overrides[config.key] = labelValues[key];
                }
            }
        }
        return overrides;
    };

    const handleSave = (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('label_overrides', JSON.stringify(buildLabelOverrides()));
        formData.append('color_overrides', JSON.stringify(colorValues));
        formData.append('font_overrides', JSON.stringify(fontValues));

        for (const field of Object.keys(imageFiles) as ImageField[]) {
            const file = imageFiles[field];
            if (file) {
                formData.append(field, file);
            }
        }

        formData.append('element_toggles', JSON.stringify(elementToggles));

        formData.append('_method', 'PUT');

        router.post(route('templates.update', template.key), formData, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                toast.loading('Saving template overrides...', { id: 'save-overrides' });
            },
            onSuccess: () => {
                toast.success('Template overrides saved successfully', { id: 'save-overrides' });
                setSaving(false);
                setImageFiles({ header_image: null, footer_image: null, signature: null, stamp: null });
                setSaveCount((c) => c + 1);
            },
            onError: () => {
                toast.error('Failed to save template overrides', { id: 'save-overrides' });
                setSaving(false);
            },
        });
    };

    const colors = template.customizable_properties?.colors ?? {};
    const typography = template.customizable_properties?.typography ?? {};
    const editableLabels = template.editable_labels ?? {};
    const hasColors = Object.keys(colors).length > 0;
    const hasTypography = Object.keys(typography).length > 0;
    const hasLabels = Object.keys(editableLabels).length > 0;

    return (
        <AppLayout>
            <Head title={`Customize: ${template.label}`} />

            <div className="flex h-screen flex-col bg-gray-50">
                <div className="border-b border-gray-200 bg-white">
                    <div className=" flex  items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Customize: {template.label}</h1>
                                <p className="text-sm text-gray-500">
                                    Key: <span className="font-mono">{template.key}</span>
                                </p>
                            </div>
                        </div>

                        <div className='flex gap-4 items-center justify-center'>
                            <Button onClick={() => router.get(route('templates.index'))} variant="outline">
                                Cancel
                            </Button>
                            <Button disabled={saving} onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Overrides'}
                            </Button>
                        </div>


                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/2 overflow-auto border-r border-gray-200 bg-white p-6">
                        <form onSubmit={handleSave} className="space-y-8">
                            {/* Branding Images */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ImageUp className="h-5 w-5" />
                                        Branding Images
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <p className="text-sm text-muted-foreground">
                                        Upload images to override the tenant-level branding for this template. Leave blank to keep defaults.
                                    </p>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {(['header_image', 'footer_image', 'signature', 'stamp'] as ImageField[]).map((field) => {
                                            const imageUrl = getImageUrl(field);
                                            return (
                                                <div key={field} className="space-y-2">
                                                    <Label>{imageFieldLabels[field]}</Label>
                                                    {imageUrl && (
                                                        <div className="mb-2 overflow-hidden rounded-lg border">
                                                            <img
                                                                src={imageUrl}
                                                                alt={imageFieldLabels[field]}
                                                                className="h-24 w-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(field, e)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Section Visibility */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Eye className="h-5 w-5" />
                                        Section Visibility
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Toggle individual sections on or off in the PDF document.
                                    </p>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {([
                                            { key: 'header' as const, label: 'Header' },
                                            { key: 'footer' as const, label: 'Footer' },
                                            { key: 'prepared_by' as const, label: 'Prepared By' },
                                            { key: 'authorized_signature' as const, label: 'Authorized Signature' },
                                            { key: 'stamp' as const, label: 'Stamp' },
                                        ]).map(({ key, label }) => (
                                            <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                                <Label className="cursor-pointer">{label}</Label>
                                                <Switch
                                                    checked={elementToggles[key]}
                                                    onCheckedChange={() => handleToggle(key)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Default Template */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Star className="h-5 w-5" />
                                        Default Template
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Set this template as the default for all {typeLabels[template.type] || template.type} documents.
                                        The default template will be used automatically when generating documents.
                                    </p>
                                    {isDefault ? (
                                        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <span className="text-sm font-medium text-green-800">
                                                    Default for {typeLabels[template.type] || template.type}
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.post(route('templates.remove-default', template.key), {}, {
                                                    preserveScroll: true,
                                                    onSuccess: () => toast.success('Default template removed'),
                                                    onError: () => toast.error('Failed to remove default'),
                                                })}
                                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                            >
                                                Remove Default
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                                            <span className="text-sm text-gray-600">
                                                Not the default for {typeLabels[template.type] || template.type}
                                                {defaultTemplateKey && (
                                                    <span className="ml-1 text-xs text-gray-400">
                                                        (currently: {defaultTemplateKey})
                                                    </span>
                                                )}
                                            </span>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => router.post(route('templates.set-default', template.key), {}, {
                                                    preserveScroll: true,
                                                    onSuccess: () => toast.success('Set as default template'),
                                                    onError: () => toast.error('Failed to set default'),
                                                })}
                                            >
                                                <CheckCircle className="mr-1.5 h-4 w-4" />
                                                Set as Default
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Colors */}
                            {hasColors && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Colors</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Customize the color palette for this template.
                                        </p>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {Object.entries(colors).map(([key, config]) => (
                                                <div key={key} className="space-y-2">
                                                    <Label>{config.label}</Label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="color"
                                                            value={colorValues[key] || '#1f2937'}
                                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                                            className="h-10 w-10 cursor-pointer rounded-md border p-1"
                                                        />
                                                        <Input
                                                            type="text"
                                                            value={colorValues[key] || ''}
                                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                                            placeholder="#1f2937"
                                                            className="font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Typography */}
                            {hasTypography && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Typography</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {Object.entries(typography).map(([key, config]) => (
                                            <div key={key} className="space-y-2">
                                                <Label>{config.label}</Label>
                                                {config.type === 'select' && config.options ? (
                                                    <Select
                                                        value={fontValues[key] || ''}
                                                        onValueChange={(val) => handleFontChange(key, val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a font..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {config.options.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            value={fontValues[key] || ''}
                                                            onChange={(e) => handleFontChange(key, e.target.value)}
                                                            min={config.min}
                                                            max={config.max}
                                                            placeholder="Default"
                                                            className="max-w-24"
                                                        />
                                                        {config.unit && (
                                                            <span className="text-sm text-muted-foreground">{config.unit}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Editable Labels */}
                            {hasLabels && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Editable Labels</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Override the text labels shown on this template.
                                        </p>
                                        {Object.entries(editableLabels).map(([key, config]) => (
                                            <div key={key} className="space-y-2">
                                                <Label>{config.label}</Label>
                                                <Input
                                                    type="text"
                                                    value={labelValues[key] ?? config.default}
                                                    onChange={(e) => handleLabelChange(key, e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Default: {config.default}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Save Button (mobile fallback) */}
                            <div className="flex justify-end lg:hidden">
                                <Button disabled={saving} size="lg">
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Overrides'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="flex w-1/2 flex-col">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 text-sm">
                            <span className="font-medium text-gray-700">Live Preview</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center bg-gray-100 p-4">
                            <div className="flex h-full w-full max-w-[210mm] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
                                <iframe
                                    key={JSON.stringify(elementToggles) + '-' + saveCount}
                                    src={previewUrl}
                                    className="h-full w-full flex-1 border-0"
                                    title="HTML Preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
