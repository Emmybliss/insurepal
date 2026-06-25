import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    creditNote: any;
    defaultTemplateKey: string;
    defaultTemplate: any;
    existing_credit_notes: any[];
    available_types: Record<string, string>;
    regenerate_credit_note_id?: number;
    qrBarcodeData: any;
}

export default function GenerateCreditNote({
    creditNote,
    defaultTemplateKey,
    defaultTemplate,
    existing_credit_notes,
    available_types,
    regenerate_credit_note_id,
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
        if (!creditNote) return;

        setIsGenerating(true);

        const formData = new FormData();
        formData.append('template_key', defaultTemplateKey);

        const routeName = regenerate_credit_note_id ? 'credit-notes.regenerate' : 'credit-notes.generate';
        const routeParam = regenerate_credit_note_id || creditNote.id;

        router.post(route(routeName, routeParam), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Credit Note generated successfully');
                router.visit(route('credit-notes.show', creditNote.id));
            },
            onError: (errors) => {
                console.error(errors);
                setIsGenerating(false);
                toast.error('Failed to generate Credit Note!');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Generate Credit Note - ${creditNote.note_number}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {regenerate_credit_note_id ? 'Regenerate Credit Note' : 'Generate Credit Note'}
                        </h1>
                        <p className="text-muted-foreground">
                            {regenerate_credit_note_id
                                ? `Regenerate Credit Note for policy ${creditNote.note_number}`
                                : `Generate a Credit Note for policy ${creditNote.note_number}`}
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
                                <p className="text-sm font-medium">{creditNote.policy?.policy_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Credit Note Number</label>
                                <p className="text-sm font-medium">CN-{creditNote.note_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Customer</label>
                                <p className="text-sm font-medium">{getCustomerName(creditNote.customer)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Product</label>
                                <p className="text-sm font-medium">{creditNote.policy?.policy_product?.name || 'N/A'}</p>
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
                                    src={route('credit-notes.html-preview', { creditNote: creditNote.id, template_key: defaultTemplateKey })}
                                    className="w-full h-[500px] border-0"
                                    title="Credit Note Preview"
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
                            : regenerate_credit_note_id
                                ? 'Regenerate Credit Note'
                                : 'Generate Credit Note'}
                    </Button>
                </div>

                {existing_credit_notes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Credit Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {existing_credit_notes.map((cn: any) => (
                                    <div key={cn.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                        <div>
                                            <p className="font-medium">CN-{cn.note_number}</p>
                                            <p className="text-sm text-gray-500">
                                                {available_types[cn.type]} • {cn.status}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={cn.status === 'issued' ? 'default' : 'secondary'}>{cn.status}</Badge>
                                            <Button variant="outline" size="sm" onClick={() => router.visit(route('credit-notes.show', cn.id))}>
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
