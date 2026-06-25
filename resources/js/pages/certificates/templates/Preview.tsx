import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Download, Edit, FileText, RefreshCw, Settings, Zap } from 'lucide-react';
import { useState } from 'react';

interface Template {
    id: number;
    name: string;
    type: string;
    category: string;
    description?: string;
    page_size: string;
    orientation: string;
    include_watermark: boolean;
    watermark_text?: string;
    include_barcode: boolean;
    include_qr_code: boolean;
    include_seal: boolean;
    include_signatures: boolean;
}

interface SampleData {
    certificate_number: string;
    policy_number: string;
    customer_name: string;
    company_name?: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: string;
    sum_assured: string;
    product_name: string;
    coverage_details: string;
}

interface Certificate {
    id: number;
    certificate_number: string;
    type: string;
    status: string;
    policy: {
        policy_number: string;
        customer: {
            name: string;
            company_name?: string;
        };
        policy_product: {
            name: string;
        };
        effective_date: string;
        expiry_date: string;
        premium_amount: string;
        sum_assured: string;
    };
}

interface Props {
    template: Template;
    sampleData?: SampleData;
    certificate?: Certificate;
    certificateData?: any;
    isVisualDesigner?: boolean;
}

export default function PreviewCertificateTemplate({ template, sampleData, certificate, certificateData, isVisualDesigner }: Props) {
    // Use certificate data if available, otherwise use sample data
    const getCertificateDisplayData = (): SampleData => {
        if (certificate && isVisualDesigner) {
            return {
                certificate_number: certificate.certificate_number,
                policy_number: certificate.policy.policy_number,
                customer_name: certificate.policy.customer.name,
                company_name: certificate.policy.customer.company_name || '',
                effective_date: certificate.policy.effective_date,
                expiry_date: certificate.policy.expiry_date,
                premium_amount: certificate.policy.premium_amount,
                sum_assured: certificate.policy.sum_assured,
                product_name: certificate.policy.policy_product.name,
                coverage_details: 'Policy coverage details',
            };
        }
        return (
            sampleData || {
                certificate_number: 'PREVIEW-' + new Date().toISOString().slice(0, 10),
                policy_number: 'SAMPLE-POL-001',
                customer_name: 'John Doe',
                company_name: 'Sample Company Ltd',
                effective_date: new Date().toLocaleDateString(),
                expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                premium_amount: '₦250,000.00',
                sum_assured: '₦5,000,000.00',
                product_name: 'Sample Insurance Product',
                coverage_details: 'Comprehensive coverage including fire, theft, and natural disasters.',
            }
        );
    };

    const [previewData, setPreviewData] = useState<SampleData>(getCertificateDisplayData());
    const [zoom, setZoom] = useState(100);

    const handleDataChange = (field: keyof SampleData, value: string) => {
        setPreviewData((prev) => ({ ...prev, [field]: value }));
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'standard':
                return 'bg-blue-100 text-blue-800';
            case 'premium':
                return 'bg-purple-100 text-purple-800';
            case 'corporate':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'policy_certificate':
                return 'bg-purple-100 text-purple-800';
            case 'policy_schedule':
                return 'bg-indigo-100 text-indigo-800';
            case 'endorsement':
                return 'bg-orange-100 text-orange-800';
            case 'coverage_note':
                return 'bg-teal-100 text-teal-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout>
            <Head title={`Preview - ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Preview: {template.name}</h1>
                            <p className="text-gray-600">Template preview with sample data</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={zoom.toString()} onValueChange={(value) => setZoom(parseInt(value))}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50%</SelectItem>
                                <SelectItem value="75">75%</SelectItem>
                                <SelectItem value="100">100%</SelectItem>
                                <SelectItem value="125">125%</SelectItem>
                                <SelectItem value="150">150%</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button onClick={() => router.get(route('certificate-templates.edit', template.id))}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Controls Sidebar */}
                    <div className="space-y-6">
                        {/* Template Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4" />
                                    Template Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-xs text-gray-600">Type</Label>
                                    <div className="mt-1">
                                        <Badge className={getTypeColor(template.type)} variant="outline">
                                            {template.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">Category</Label>
                                    <div className="mt-1">
                                        <Badge className={getCategoryColor(template.category)} variant="outline">
                                            {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">Page Size</Label>
                                    <p className="text-sm">{template.page_size}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">Orientation</Label>
                                    <p className="text-sm capitalize">{template.orientation}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Settings className="h-4 w-4" />
                                    Active Features
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {template.include_barcode && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-sm">Barcode</span>
                                    </div>
                                )}
                                {template.include_qr_code && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-sm">QR Code</span>
                                    </div>
                                )}
                                {template.include_seal && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-sm">Company Seal</span>
                                    </div>
                                )}
                                {template.include_signatures && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-sm">Signatures</span>
                                    </div>
                                )}
                                {template.include_watermark && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="text-sm">Watermark</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sample Data Editor */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Zap className="h-4 w-4" />
                                    Sample Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="customer_name" className="text-xs">
                                        Customer Name
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        value={previewData.customer_name}
                                        onChange={(e) => handleDataChange('customer_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="policy_number" className="text-xs">
                                        Policy Number
                                    </Label>
                                    <Input
                                        id="policy_number"
                                        value={previewData.policy_number}
                                        onChange={(e) => handleDataChange('policy_number', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="product_name" className="text-xs">
                                        Product Name
                                    </Label>
                                    <Input
                                        id="product_name"
                                        value={previewData.product_name}
                                        onChange={(e) => handleDataChange('product_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="premium_amount" className="text-xs">
                                        Premium Amount
                                    </Label>
                                    <Input
                                        id="premium_amount"
                                        value={previewData.premium_amount}
                                        onChange={(e) => handleDataChange('premium_amount', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sum_assured" className="text-xs">
                                        Sum Assured
                                    </Label>
                                    <Input
                                        id="sum_assured"
                                        value={previewData.sum_assured}
                                        onChange={(e) => handleDataChange('sum_assured', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="coverage_details" className="text-xs">
                                        Coverage Details
                                    </Label>
                                    <Textarea
                                        id="coverage_details"
                                        rows={3}
                                        className="text-xs"
                                        value={previewData.coverage_details}
                                        onChange={(e) => handleDataChange('coverage_details', e.target.value)}
                                    />
                                </div>
                                <Button size="sm" variant="outline" className="w-full" onClick={() => setPreviewData(sampleData)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reset Data
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Certificate Preview</span>
                                    <Badge variant="outline" className="text-xs">
                                        {zoom}% Zoom
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-auto">
                                    <div
                                        className="mx-auto bg-white shadow-lg"
                                        style={{
                                            width: template.orientation === 'portrait' ? '595px' : '842px',
                                            height: template.orientation === 'portrait' ? '842px' : '595px',
                                            transform: `scale(${zoom / 100})`,
                                            transformOrigin: 'top left',
                                        }}
                                    >
                                        {/* Certificate Content */}
                                        <div className="relative h-full border-2 border-gray-200 p-8">
                                            {/* Watermark */}
                                            {template.include_watermark && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div
                                                        className="text-6xl font-bold text-gray-200"
                                                        style={{
                                                            transform: 'rotate(-45deg)',
                                                            opacity: 0.1,
                                                        }}
                                                    >
                                                        {template.watermark_text || 'DRAFT'}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className="mb-6 border-b pb-6 text-center">
                                                <h1 className="mb-2 text-3xl font-bold text-blue-900">CERTIFICATE OF INSURANCE</h1>
                                                <p className="text-lg text-gray-600">
                                                    {template.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                </p>
                                            </div>

                                            {/* Certificate Details */}
                                            <div className="mb-8 grid grid-cols-2 gap-8">
                                                <div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Certificate Number</label>
                                                        <p className="font-mono text-lg">{previewData.certificate_number}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Policy Number</label>
                                                        <p className="text-lg">{previewData.policy_number}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Insured Name</label>
                                                        <p className="text-lg font-semibold">{previewData.customer_name}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Effective Date</label>
                                                        <p className="text-lg">{previewData.effective_date}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Expiry Date</label>
                                                        <p className="text-lg">{previewData.expiry_date}</p>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Product</label>
                                                        <p className="text-lg">{previewData.product_name}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Coverage Details */}
                                            <div className="mb-8">
                                                <h3 className="mb-3 text-lg font-semibold text-gray-800">Coverage Details</h3>
                                                <div className="rounded-lg bg-gray-50 p-4">
                                                    <div className="mb-4 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="mb-1 block text-sm font-semibold text-gray-700">Premium Amount</label>
                                                            <p className="text-xl font-bold text-green-600">{previewData.premium_amount}</p>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-semibold text-gray-700">Sum Assured</label>
                                                            <p className="text-xl font-bold text-blue-600">{previewData.sum_assured}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
                                                        <p className="text-sm">{previewData.coverage_details}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Elements */}
                                            <div className="absolute right-8 bottom-8 left-8">
                                                <div className="flex items-end justify-between">
                                                    {/* Signatures */}
                                                    {template.include_signatures && (
                                                        <div className="flex gap-16">
                                                            <div className="text-center">
                                                                <div className="mb-2 h-12 w-32 border-b border-gray-400"></div>
                                                                <p className="text-xs text-gray-600">Authorized Signature</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="mb-2 h-12 w-32 border-b border-gray-400"></div>
                                                                <p className="text-xs text-gray-600">Date</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Codes */}
                                                    <div className="flex items-end gap-4">
                                                        {template.include_barcode && (
                                                            <div className="text-center">
                                                                <div className="mb-1 flex h-12 w-24 items-center justify-center bg-black">
                                                                    <span className="text-xs text-white">BARCODE</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600">{previewData.certificate_number}</p>
                                                            </div>
                                                        )}
                                                        {template.include_qr_code && (
                                                            <div className="text-center">
                                                                <div className="mb-1 flex h-12 w-12 items-center justify-center bg-black">
                                                                    <span className="text-xs text-white">QR</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600">Verify</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Company Seal */}
                                                {template.include_seal && (
                                                    <div className="absolute top-0 right-0">
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-600">
                                                            <span className="text-xs font-bold text-blue-600">SEAL</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
