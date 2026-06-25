import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { RefreshCw } from 'lucide-react';

function mapPolicyDataForCertificate(policy: any, customer: any, tenant: any) {
    return {
        customer_name: customer?.first_name && customer?.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer?.company_name || 'N/A',
        customer_address: customer?.address || 'N/A',
        customer_phone: customer?.phone || 'N/A',
        customer_email: customer?.email || 'N/A',
        policy_number: policy?.policy_number || 'N/A',
        policy_type: policy?.policyType?.name || policy?.policy_type || 'N/A',
        policy_start_date: policy?.start_date || 'N/A',
        policy_end_date: policy?.end_date || 'N/A',
        insurer_name: policy?.insurer?.name || tenant?.name || 'N/A',
        insurer_logo: policy?.insurer?.logo_url || tenant?.logo_url || null,
        broker_name: tenant?.name || 'N/A',
        broker_address: tenant?.address || 'N/A',
        broker_logo: tenant?.logo_url || null,
    };
}

interface CertificatePreviewProps {
    template: any;
    policyData: any;
    designJson?: any;
    onGenerate: () => void;
    qrBarcodeData?: {
        qr_code_policy: string;
        barcode_policy: string;
    };
    isGenerating?: boolean;
    isRegenerating?: boolean;
}

export default function CertificatePreview({
    template,
    policyData,
    designJson,
    onGenerate,
    qrBarcodeData,
    isGenerating = false,
    isRegenerating = false,
}: CertificatePreviewProps) {
    // Map policy data to a standardized format
    const mappedPolicyData = mapPolicyDataForCertificate(policyData, policyData.customer, policyData.tenant);

    // Enhanced sample data for testing
    const sampleData = {
        certificate_number: 'CERT-2025-001234',
        policy_number: 'POL-2025-567890',
        customer_name: 'John Doe',
        issue_date: new Date().toLocaleDateString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        coverage_amount: '₦5,000,000.00',
        premium_amount: '₦150,000.00',
        company_name: 'Insure Pal Insurance Ltd.',
        company_address: '123 Insurance Street, Lagos, Nigeria',
        company_phone: '+234 800 123 4567',
        company_email: 'info@insurepal.com',
        ...mappedPolicyData,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Certificate Preview</h2>
                    <p className="text-gray-600">Preview how your certificate will look with real data</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onGenerate} disabled={isGenerating}>
                        {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        {isRegenerating ? 'Regenerate Certificate' : 'Generate Certificate'}
                    </Button>
                </div>
            </div>

            {/* Template Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Template Information</span>
                        <Badge variant="outline">{template?.type || 'certificate'}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Template Name</label>
                            <p className="text-sm">{template?.name || 'Untitled Template'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Page Size</label>
                            <p className="text-sm">{template?.design_json?.canvas?.width + 'x' + template?.design_json?.canvas?.height || 'A4'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Orientation</label>
                            <p className="text-sm capitalize">
                                {template?.design_json?.canvas?.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sample Data */}
            <Card>
                <CardHeader>
                    <CardTitle>Sample Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Object.entries(sampleData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">{key.replace(/_/g, ' ')}</span>
                                <span className="text-sm">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
