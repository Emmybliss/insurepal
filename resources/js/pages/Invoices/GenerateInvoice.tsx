import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    invoice: any;
    defaultTemplateKey: string;
    defaultTemplate: any;
}

export default function GenerateInvoice({ invoice, defaultTemplateKey, defaultTemplate }: Props) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!invoice) return;

        setIsGenerating(true);

        const formData = new FormData();
        formData.append('template_key', defaultTemplateKey);

        router.post(route('invoices.generate', invoice.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Invoice generated successfully');
                router.visit(route('invoices.index'));
            },
            onError: (errors) => {
                console.error(errors);
                setIsGenerating(false);
                toast.error('Failed to generate Invoice!');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Generate Invoice - ${invoice.invoice_number}`} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Generate Invoice</h1>
                    <p className="text-muted-foreground">Generate an invoice for {invoice.invoice_number}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Invoice Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                                <p className="text-sm font-medium">{invoice.invoice_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Customer</label>
                                <p className="text-sm font-medium">{invoice.customer?.first_name} {invoice.customer?.last_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Amount</label>
                                <p className="text-sm font-medium">{invoice.currency ?? 'NGN'} {Number(invoice.total_amount).toLocaleString()}</p>
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
                                    src={route('invoices.html-preview', { invoice: invoice.id, template_key: defaultTemplateKey })}
                                    className="w-full h-[500px] border-0"
                                    title="Invoice Preview"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                        {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
