import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    first_name: string;
    last_name: string;
    company_name?: string;
    type: string;
}

interface PolicyProduct {
    name: string;
}

interface Policy {
    id: number;
    policy_number: string;
    effective_date: string;
    expiry_date: string;
    status: string;
    customer: Customer;
    policy_product: PolicyProduct;
}

interface Template {
    id: number;
    name: string;
    type: string;
    category: string;
    description?: string;
}

interface ExistingCertificate {
    id: number;
    type: string;
    status: string;
    certificate_number: string;
    generated_at: string;
}

interface Props {
    policy: Policy;
    templates: Template[];
    existing_certificates: ExistingCertificate[];
    available_types: Record<string, string>;
}

export default function GenerationOptions({ policy, templates, existing_certificates, available_types }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');
    const [options, setOptions] = useState({
        notes: '',
        include_watermark: false,
        watermark_text: 'DRAFT',
        auto_issue: false,
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!selectedTemplate) {
            alert('Please select a template');
            return;
        }

        setIsGenerating(true);

        try {
            router.post(
                route('certificates.generate', policy.id),
                {
                    template_id: selectedTemplate,
                    type: selectedType,
                    options: options,
                },
                {
                    onSuccess: () => {
                        // Redirect will be handled by the controller
                    },
                    onError: (errors) => {
                        console.error('Generation failed:', errors);
                        setIsGenerating(false);
                    },
                    onFinish: () => {
                        setIsGenerating(false);
                    },
                },
            );
        } catch (error) {
            console.error('Error generating certificate:', error);
            setIsGenerating(false);
        }
    };

    const getCustomerName = (customer: Customer) => {
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'generated':
                return 'bg-blue-100 text-blue-800';
            case 'issued':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
    console.log('customer', policy);
    return (
        <AppLayout>
            <Head title={`Generate Certificate - ${policy.policy_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Generate Certificate</h1>
                        <p className="text-gray-600">Create a new certificate for policy {policy.policy_number}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Policy Information */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Policy Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Policy Number</label>
                                    <div className="text-lg font-medium">{policy.policy_number}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Customer</label>
                                    <div className="font-medium">{getCustomerName(policy.customer)}</div>
                                    <div className="text-sm text-gray-500 capitalize">{policy.customer.type}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Product</label>
                                    <div className="font-medium">{policy.policy_product.name}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Coverage Period</label>
                                    <div className="text-sm">
                                        {new Date(policy.effective_date).toLocaleDateString()} - {new Date(policy.expiry_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing Certificates */}
                        {existing_certificates.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Existing Certificates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {existing_certificates.map((cert) => (
                                            <div key={cert.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <div className="font-medium">{cert.certificate_number}</div>
                                                    <div className="text-sm text-gray-500">{available_types[cert.type] || cert.type}</div>
                                                </div>
                                                <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Certificate Generation Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Certificate Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Template Selection */}
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-gray-700">Select Template *</label>
                                    <RadioGroup
                                        value={selectedTemplate?.toString() || ''}
                                        onValueChange={(value) => {
                                            setSelectedTemplate(parseInt(value));
                                            const template = templates.find((t) => t.id === parseInt(value));
                                            if (template && !selectedType) {
                                                setSelectedType(template.type);
                                            }
                                        }}
                                    >
                                        <div className="grid grid-cols-1 gap-3">
                                            {templates.map((template) => (
                                                <div key={template.id} className="flex items-center space-x-3">
                                                    <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} />
                                                    <Label htmlFor={`template-${template.id}`} className="flex-1 cursor-pointer">
                                                        <div className="rounded-lg border p-4 hover:bg-gray-50">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <div className="font-medium">{template.name}</div>
                                                                <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Type: {available_types[template.type] || template.type}
                                                            </div>
                                                            {template.description && (
                                                                <div className="mt-1 text-sm text-gray-500">{template.description}</div>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Certificate Type Override */}
                                {selectedTemplate && (
                                    <div>
                                        <label className="mb-3 block text-sm font-medium text-gray-700">Certificate Type</label>
                                        <RadioGroup value={selectedType} onValueChange={setSelectedType}>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(available_types).map(([key, label]) => (
                                                    <div key={key} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={key} id={`type-${key}`} />
                                                        <Label htmlFor={`type-${key}`} className="cursor-pointer">
                                                            {label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}

                                {/* Additional Options */}
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-gray-700">Generation Notes</label>
                                    <Textarea
                                        placeholder="Add any special instructions or notes for this certificate..."
                                        value={options.notes}
                                        onChange={(e) => setOptions((prev) => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                    />
                                </div>

                                {/* Generate Button */}
                                <div className="flex items-center justify-end gap-3 border-t pt-4">
                                    <Button variant="outline" onClick={() => router.get(route('certificates.index'))}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleGenerate} disabled={!selectedTemplate || isGenerating} className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        {isGenerating ? 'Generating...' : 'Generate Certificate'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
