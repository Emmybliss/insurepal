import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, RefreshCw } from 'lucide-react';

function mapDebitNoteData(debitNote: any, customer: any, tenant: any) {
    return {
        customer_name: customer?.first_name && customer?.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer?.company_name || 'N/A',
        customer_address: customer?.address || 'N/A',
        customer_phone: customer?.phone || 'N/A',
        customer_email: customer?.email || 'N/A',
        policy_number: debitNote?.policy?.policy_number || 'N/A',
        note_number: debitNote?.note_number || debitNote?.debit_note_number || 'N/A',
        note_date: debitNote?.note_date || debitNote?.date || 'N/A',
        issue_date: debitNote?.issue_date || debitNote?.date || 'N/A',
        due_date: debitNote?.due_date || 'N/A',
        amount: debitNote?.amount || '0.00',
        tax_amount: debitNote?.tax_amount || '0.00',
        total_amount: debitNote?.total_amount || debitNote?.amount || '0.00',
        reason: debitNote?.reason || debitNote?.description || 'N/A',
        description: debitNote?.description || debitNote?.reason || 'N/A',
        currency: debitNote?.currency || 'NGN',
        company_name: tenant?.name || 'N/A',
        company_address: tenant?.address || 'N/A',
        company_logo: tenant?.logo_url || null,
    };
}
import { useRef, useState } from 'react';

interface DebitNotePreviewProps {
    template: any;
    debitNoteData: any;
    designJson?: any;
    onGenerate: () => void;
    qrBarcodeData?: {
        qr_code_policy: string;
        qr_code_debit_note: string;
        barcode_policy: string;
        barcode_debit_note: string;
        [key: string]: string;
    };
    isGenerating?: boolean;
    isRegenerating?: boolean;
}

export default function DebitNotePreview({
    template,
    debitNoteData,
    designJson,
    onGenerate,
    qrBarcodeData,
    isGenerating = false,
    isRegenerating = false,
}: DebitNotePreviewProps) {
    const [previewMode, setPreviewMode] = useState<'design' | 'preview'>('design');

    const containerRef = useRef<HTMLDivElement>(null);

    // Map debit note data to a standardized format
    // If debitNoteData already has debit_note_number, it might be already flattened
    const isAlreadyMapped = !!debitNoteData.debit_note_number;
    const mappedData = isAlreadyMapped ? { ...debitNoteData } : mapDebitNoteData(debitNoteData, debitNoteData.customer, debitNoteData.tenant);

    // Ensure we have the debit_note_id for the HTML preview route
    const debitNoteId = debitNoteData.debit_note_id || debitNoteData.id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Debit Note Preview</h2>
                    <p className="text-gray-600">Preview how your debit note will look with real data</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'design' ? 'preview' : 'design')}>
                        <Eye className="mr-2 h-4 w-4" />
                        {previewMode === 'design' ? 'Show Preview' : 'Show Design'}
                    </Button>
                    {previewMode === 'preview' && (
                        <Button onClick={onGenerate} disabled={isGenerating}>
                            {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            {isRegenerating ? 'Regenerate Debit Note' : 'Generate Debit Note'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Template Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Template Information</span>
                        <Badge variant="outline">{template?.type || 'debit_note'}</Badge>
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

            {/* Preview Area */}
            <Card>
                <CardHeader>
                    <CardTitle>Debit Note Preview</CardTitle>
                </CardHeader>
                <CardContent ref={containerRef}>
                    {previewMode === 'design' ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                <p className="text-gray-500">Design preview will be rendered here</p>
                                <p className="mt-2 text-sm text-gray-400">The visual designer canvas will be displayed here when implemented</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center rounded-lg border bg-gray-50 p-6 overflow-auto custom-scrollbar">
                            <div className="shadow-2xl bg-white">
                                <iframe
                                    src={route('debit-notes.html-preview', { debitNote: debitNoteId, template_id: template?.id })}
                                    className="w-full h-full border-0"
                                    title="Debit Note Preview"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Debit Note Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="underline">Debit Note Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Object.entries(mappedData).map(([key, value]) => (
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
