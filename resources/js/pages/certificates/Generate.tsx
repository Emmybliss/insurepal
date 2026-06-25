import CertificatePreview from '@/components/certificates/CertificatePreview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Settings } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    first_name: string;
    last_name: string;
    company_name?: string;
    type: string;
}
interface Props {
    policy: any;
    templates: any[];
    existing_certificates: any[];
    available_types: Record<string, string>;
    regenerate_certificate_id?: number;
    qrBarcodeData: {
        qr_code_policy: string;
        qr_code_certificate: string;
        barcode_policy: string;
        barcode_certificate: string;
    };
}

export default function GenerateCertificate({
    policy,
    templates,
    existing_certificates,
    available_types,
    regenerate_certificate_id,
    qrBarcodeData,
}: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const editStageRef = useRef<any>(null);

    const { data, setData, processing, errors } = useForm({
        template_id: '',
        type: 'policy_certificate',
        options: {},
    });

    // Handle regeneration - auto-select template if regenerating
    React.useEffect(() => {
        if (regenerate_certificate_id && templates.length > 0) {
            // Find the certificate being regenerated
            const certificateToRegenerate = existing_certificates.find((cert) => cert.id === regenerate_certificate_id);
            if (certificateToRegenerate) {
                // Find the template used for this certificate
                const template = templates.find((t) => t.id === certificateToRegenerate.document_template_id);
                if (template) {
                    handleTemplateSelect(template);
                }
            }
        }
    }, [regenerate_certificate_id, templates, existing_certificates]);

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        setData('template_id', template.id.toString());
        setData('type', template.type);
    };

    const handleGenerate = async () => {
        if (!selectedTemplate || !policy) return;

        setIsGenerating(true);

        const formData = new FormData();
        formData.append('template_id', selectedTemplate.id);
        formData.append('type', data.type);

        const routeName = regenerate_certificate_id ? 'certificates.regenerate' : 'certificates.generate';
        const routeParam = regenerate_certificate_id || policy.id;

        router.post(route(routeName, routeParam), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Certificate generated successfully');
            },
            onError: (errors) => {
                console.error(errors);
                setIsGenerating(false);
                toast.error('Failed to generate certificate!');
            },
        });
    };

    const handleEditTemplate = (template: any) => {
        router.visit(route('document-templates.edit', template.id));
    };

    const getCustomerName = (customer: Customer) => {
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };
    // console.log('Policy', policy);

    return (
        <AppLayout>
            <Head title={`Generate Certificate - ${policy.policy_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {regenerate_certificate_id ? 'Regenerate Certificate' : 'Generate Certificate'}
                        </h1>
                        <p className="text-muted-foreground">
                            {regenerate_certificate_id
                                ? `Regenerate certificate for policy ${policy.policy_number}`
                                : `Generate a certificate for policy ${policy.policy_number}`}
                        </p>
                    </div>
                </div>

                {/* Policy Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Policy Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Policy Number</label>
                                <p className="text-sm font-medium">{policy.policy_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Customer</label>
                                <p className="text-sm font-medium">{getCustomerName(policy.customer)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Product</label>
                                <p className="text-sm font-medium">{policy.policy_product?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Template Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Select Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Choose a template</label>
                                <Select
                                    value={data.template_id}
                                    onValueChange={(value) => {
                                        const template = templates.find((t) => t.id.toString() === value);
                                        if (template) handleTemplateSelect(template);
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((template) => (
                                            <SelectItem key={template.id} value={template.id.toString()}>
                                                <div className="flex w-full items-center justify-between">
                                                    <span>{template.name}</span>
                                                    <div className="ml-4 flex gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {template.template_type === 'document_template' ? 'Visual' : 'Traditional'}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {template.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.template_id && <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>}
                            </div>

                            {selectedTemplate && (
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{selectedTemplate.name}</h3>
                                            <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                                            <div className="mt-2 flex gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {selectedTemplate.template_type === 'document_template'
                                                        ? 'Visual Designer'
                                                        : 'Traditional Template'}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {selectedTemplate.category}
                                                </Badge>
                                                {selectedTemplate.page_size && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {selectedTemplate.page_size} {selectedTemplate.orientation}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(selectedTemplate)}>
                                            Edit Template
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Certificate Preview */}
                {selectedTemplate && (
                    <CertificatePreview
                        template={selectedTemplate}
                        isRegenerating={!!regenerate_certificate_id}
                        policyData={{
                            policy_number: policy.policy_number,
                            customer_name: getCustomerName(policy.customer),
                            customer_address: policy.customer?.address,
                            customer_phone: policy.customer?.phone,
                            customer_email: policy.customer?.email,
                            customer_dob: policy.customer?.date_of_birth,
                            customer_id_number: policy.customer?.id_number,
                            customer_occupation: policy.customer?.occupation,
                            customer_type: policy.customer?.type,
                            customer_company_name: policy.customer?.company_name,
                            customer_registration_number: policy.customer?.registration_number,
                            customer_contact_person: policy.customer?.contact_person,
                            customer_industry: policy.customer?.industry,
                            customer_state: policy.customer?.state,
                            customer_city: policy.customer?.city,
                            customer_zip: policy.customer?.zip,
                            customer_country: policy.customer?.country,
                            customer_national_id: policy.customer?.national_id,
                            customer_passport_number: policy.customer?.passport_number,
                            customer_driver_license_number: policy.customer?.driver_license_number,
                            commission_amount: policy.commission_amount,
                            product_name: policy.policy_product?.name,
                            policy_type: policy.policy_type?.name,
                            policy_class: policy.policy_class?.name,
                            effective_date: policy.effective_date,
                            expiry_date: policy.expiry_date,
                            premium_amount: policy.premium_amount,
                            total_amount: policy.total_amount,
                            payment_frequency: policy.payment_frequency,
                            coverage_details: policy.coverage_details,
                            form_data: policy.form_data,
                            tenant_name: policy.tenant?.name,
                            tenant_address: policy.tenant?.address,
                            tenant_phone: policy.tenant?.phone,
                            tenant_email: policy.tenant?.email,
                            tenant_license_number: policy.tenant?.license_number,
                            tenant_type: policy.tenant?.type,
                            tenant_industry: policy.tenant?.industry,
                            tenant_contact_person: policy.tenant?.contact_person,
                            coverage_type: policy.coverage_details?.coverage_type,
                            sum_assured: policy.coverage_details?.sum_assured,
                            deductible: policy.coverage_details?.deductible,
                            additional_benefits: policy.coverage_details?.additional_benefits,
                            terms_conditions: policy.terms_conditions,
                            approved_at: policy.approved_at,
                            issued_at: policy.issued_at,
                            renewed_at: policy.renewed_at,
                            created_at: policy.created_at,
                            updated_at: policy.updated_at,
                            reference_number: policy.reference_number,
                            date_today: policy.date_today,
                            date_issue: policy.date_issue,
                            certificate_id: policy.certificate_id,
                            // Added missing fields
                            invoice_number: policy.invoices?.[0]?.invoice_number,
                            invoice_total_amount: policy.invoices?.[0]?.total_amount,
                            invoice_subtotal: policy.invoices?.[0]?.subtotal,
                            invoice_tax_amount: policy.invoices?.[0]?.tax_amount,
                            invoice_due_date: policy.invoices?.[0]?.due_date,
                            invoice_status: policy.invoices?.[0]?.status,
                            debit_note_number: policy.debitNotes?.[0]?.note_number,
                            debit_note_amount: policy.debitNotes?.[0]?.total_amount,
                            debit_note_issue_date: policy.debitNotes?.[0]?.issue_date,
                            credit_note_number: policy.creditNotes?.[0]?.note_number,
                            credit_note_amount: policy.creditNotes?.[0]?.total_amount,
                            credit_note_issue_date: policy.creditNotes?.[0]?.issue_date,
                            receipt_number: policy.receipts?.[0]?.receipt_number,
                            receipt_amount_paid: policy.receipts?.[0]?.amount_paid,
                            receipt_payment_date: policy.receipts?.[0]?.payment_date,
                            receipt_payment_method: policy.receipts?.[0]?.payment_method,
                        }}
                        designJson={selectedTemplate.design_json}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating || processing}
                        editStageRef={editStageRef}
                        qrBarcodeData={qrBarcodeData}
                        // qrBarcodeData={sampleQrBarcodeData}
                    />
                )}

                {/* Existing Certificates */}
                {existing_certificates.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Certificates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {existing_certificates.map((cert) => (
                                    <div key={cert.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                        <div>
                                            <p className="font-medium">{cert.certificate_number}</p>
                                            <p className="text-sm text-gray-500">
                                                {available_types[cert.type]} • {cert.status}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={cert.status === 'issued' ? 'default' : 'secondary'}>{cert.status}</Badge>
                                            <Button variant="outline" size="sm" onClick={() => router.visit(route('certificates.show', cert.id))}>
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
