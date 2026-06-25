import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    debitNote: any;
    defaultTemplateKey: string;
    defaultTemplate: any;
    existing_debit_notes: any[];
    available_types: Record<string, string>;
    regenerate_debit_note_id?: number;
    qrBarcodeData: any;
}

export default function GenerateDebitNote({
    debitNote,
    defaultTemplateKey,
    defaultTemplate,
    existing_debit_notes,
    available_types,
    regenerate_debit_note_id,
    qrBarcodeData,
}: Props) {
    const [isGenerating, setIsGenerating] = useState(false);

    const getCustomerName = (customer: any) => {
        if (!customer) return 'N/A';
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const handleGenerate = () => {
        if (!debitNote) return;

        setIsGenerating(true);

        const formData = new FormData();
        formData.append('template_key', defaultTemplateKey);

        const routeName = regenerate_debit_note_id ? 'debit-notes.regenerate' : 'debit-notes.generate';
        const routeParam = regenerate_debit_note_id || debitNote.id;

        router.post(route(routeName, routeParam), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Debit Note generated successfully');
                router.visit(route('debit-notes.show', debitNote.id));
            },
            onError: (errors) => {
                console.error(errors);
                setIsGenerating(false);
                toast.error('Failed to generate Debit Note!');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Generate Debit Note - ${debitNote.note_number}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {regenerate_debit_note_id ? 'Regenerate Debit Note' : 'Generate Debit Note'}
                        </h1>
                        <p className="text-muted-foreground">
                            {regenerate_debit_note_id
                                ? `Regenerate Debit Note for policy ${debitNote.note_number}`
                                : `Generate a Debit Note for policy ${debitNote.note_number}`}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Policy Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Policy Number</label>
                                <p className="text-sm font-medium">{debitNote.policy?.policy_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Debit Note Number</label>
                                <p className="text-sm font-medium">DN-{debitNote.note_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Customer</label>
                                <p className="text-sm font-medium">{getCustomerName(debitNote.customer)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Product</label>
                                <p className="text-sm font-medium">{debitNote.policy?.policy_product?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Template: {defaultTemplate?.label || defaultTemplateKey}
                            {defaultTemplate && (
                                <Badge variant="outline" className="ml-2">
                                    {defaultTemplate.type}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Using the default template. You can change the default in{' '}
                            <a href={route('templates.index')} className="text-primary underline">
                                Document Templates
                            </a>
                            .
                        </p>
                        <div className="flex justify-center rounded-lg border bg-gray-50 p-6 overflow-auto">
                            <div className="shadow-2xl bg-white w-full max-w-[210mm]">
                                <iframe
                                    src={route('debit-notes.html-preview', { debitNote: debitNote.id, template_key: defaultTemplateKey })}
                                    className="w-full h-[500px] border-0"
                                    title="Debit Note Preview"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                        {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating
                            ? 'Generating...'
                            : regenerate_debit_note_id
                                ? 'Regenerate Debit Note'
                                : 'Generate Debit Note'}
                    </Button>
                </div>

                {existing_debit_notes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Debit Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {existing_debit_notes.map((dn: any) => (
                                    <div key={dn.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                        <div>
                                            <p className="font-medium">DN-{dn.note_number}</p>
                                            <p className="text-sm text-gray-500">
                                                {available_types[dn.type]} • {dn.status}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={dn.status === 'issued' ? 'default' : 'secondary'}>{dn.status}</Badge>
                                            <Button variant="outline" size="sm" onClick={() => router.visit(route('debit-notes.show', dn.id))}>
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
