import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer, InvoiceItem, Policy, Tenant } from '@/types';

function mapInvoiceData(invoice: any, customer: any, tenant: any) {
    return {
        customer_name: customer?.first_name && customer?.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer?.company_name || 'N/A',
        customer_address: customer?.address || 'N/A',
        customer_phone: customer?.phone || 'N/A',
        customer_email: customer?.email || 'N/A',
        policy_number: invoice?.policy?.policy_number || 'N/A',
        invoice_number: invoice?.invoice_number || invoice?.number || 'N/A',
        invoice_date: invoice?.invoice_date || invoice?.date || 'N/A',
        due_date: invoice?.due_date || 'N/A',
        total_amount: invoice?.total_amount || invoice?.total || '0.00',
        subtotal: invoice?.subtotal || invoice?.items?.reduce((s: number, i: any) => s + Number(i.amount || 0), 0).toFixed(2) || '0.00',
        tax_amount: invoice?.tax_amount || '0.00',
        discount_amount: invoice?.discount_amount || '0.00',
        payment_terms: invoice?.payment_terms || 'N/A',
        currency: invoice?.currency || 'NGN',
        items: invoice?.items || [],
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

interface InvoiceData {
    id: number;
    invoice_number: string;
    customer?: Customer;
    tenant?: Tenant;
    policy?: Policy;
    items?: InvoiceItem[];
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

interface InvoicePreviewProps {
    template: Template | null;
    invoiceData: InvoiceData;
    designJson?: DesignJson;
    onGenerate: () => void;
    isGenerating?: boolean;
}

export default function InvoicePreview({
    template,
    invoiceData,
    designJson,
    onGenerate,
    isGenerating = false,
}: InvoicePreviewProps) {
    const [previewMode, setPreviewMode] = useState<'design' | 'preview'>('design');

    const containerRef = useRef<HTMLDivElement>(null);

    const mappedData = mapInvoiceData(invoiceData, invoiceData.customer, invoiceData.tenant);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Invoice Preview</h2>
                    <p className="text-gray-600">Preview your invoice template with actual data</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'design' ? 'preview' : 'design')}>
                        <Eye className="mr-2 h-4 w-4" />
                        {previewMode === 'design' ? 'Show Preview' : 'Show Design'}
                    </Button>
                    {previewMode === 'preview' && (
                        <Button onClick={onGenerate} disabled={isGenerating}>
                            {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Generate Invoice
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Template Information</span>
                        <Badge variant="outline">{template?.type || 'invoice'}</Badge>
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
                    <CardTitle>Invoice Preview</CardTitle>
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
                                    src={route('invoices.html-preview', { invoice: invoiceData.id, template_id: template?.id })}
                                    className="w-full h-full border-0"
                                    title="Invoice Preview"
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
