import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer, Policy, Tenant } from '@/types';

function mapReceiptData(receipt: any, customer: any, tenant: any) {
    return {
        customer_name: customer?.first_name && customer?.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer?.company_name || 'N/A',
        customer_address: customer?.address || 'N/A',
        customer_phone: customer?.phone || 'N/A',
        customer_email: customer?.email || 'N/A',
        policy_number: receipt?.policy?.policy_number || 'N/A',
        receipt_number: receipt?.receipt_number || receipt?.number || 'N/A',
        receipt_date: receipt?.receipt_date || receipt?.date || 'N/A',
        amount_paid: receipt?.amount_paid || receipt?.amount || '0.00',
        payment_method: receipt?.payment_method || 'N/A',
        transaction_reference: receipt?.transaction_reference || receipt?.reference || 'N/A',
        invoice_number: receipt?.invoice?.invoice_number || 'N/A',
        currency: receipt?.currency || 'NGN',
        company_name: tenant?.name || 'N/A',
        company_address: tenant?.address || 'N/A',
        company_logo: tenant?.logo_url || null,
    };
}
import { Eye, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';

interface Template {
    id: number;
    name: string;
    type: string;
    page_size?: string;
    orientation?: string;
    design_json?: {
        canvas: {
            width: number;
            height: number;
            backgroundColor: string;
        };
        elements: any[];
    };
}

interface ReceiptData {
    id: number;
    receipt_number: string;
    customer?: Customer;
    tenant?: Tenant;
    policy?: Policy;
    [key: string]: any;
}

interface DesignJson {
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    elements: any[];
}

interface ReceiptPreviewProps {
    template: Template | null;
    receiptData: ReceiptData;
    designJson?: DesignJson;
    onGenerate: () => void;
    isGenerating?: boolean;
}

export default function ReceiptPreview({
    template,
    receiptData,
    designJson,
    onGenerate,
    isGenerating = false,
}: ReceiptPreviewProps) {
    const [previewMode, setPreviewMode] = useState<'design' | 'preview'>('design');

    const containerRef = useRef<HTMLDivElement>(null);

    const mappedData = mapReceiptData(receiptData, receiptData.customer, receiptData.tenant);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Receipt Preview</h2>
                    <p className="text-gray-600">Preview your receipt template with actual data</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'design' ? 'preview' : 'design')}>
                        <Eye className="mr-2 h-4 w-4" />
                        {previewMode === 'design' ? 'Show Preview' : 'Show Design'}
                    </Button>
                    {previewMode === 'preview' && (
                        <Button onClick={onGenerate} disabled={isGenerating}>
                            {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Generate Receipt
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Template Information</span>
                        <Badge variant="outline">{template?.type || 'receipt'}</Badge>
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
                            <p className="text-sm">{template?.page_size || 'A4'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Orientation</label>
                            <p className="text-sm capitalize">{template?.orientation || 'Portrait'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Receipt Preview</CardTitle>
                </CardHeader>
                <CardContent ref={containerRef}>
                    {previewMode === 'design' ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                            Design preview mode. Switch to preview to see populated data.
                        </div>
                    ) : (
                        <div className="flex justify-center rounded-lg border bg-gray-50 p-6 overflow-auto custom-scrollbar">
                            <div className="shadow-2xl bg-white">
                                <iframe
                                    src={route('receipts.html-preview', { receipt: receiptData.id, template_id: template?.id })}
                                    className="w-full h-full border-0"
                                    title="Receipt Preview"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Mapping Data Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Object.entries(mappedData).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b pb-1">
                                <span className="text-xs font-medium text-gray-500">{key.replace(/_/g, ' ')}</span>
                                <span className="max-w-[200px] truncate text-xs">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
