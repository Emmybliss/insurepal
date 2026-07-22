import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    receipt: any;
    defaultTemplateKey: string;
    defaultTemplate: any;
}

export default function GenerateReceipt({ receipt, defaultTemplateKey, defaultTemplate }: Props) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!receipt) return;

        setIsGenerating(true);

        const formData = new FormData();
        formData.append('template_key', defaultTemplateKey);

        router.post(route('receipts.generate', receipt.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Receipt generated successfully');
                router.visit(route('receipts.index'));
            },
            onError: (errors) => {
                console.error(errors);
                setIsGenerating(false);
                toast.error('Failed to generate Receipt!');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Generate Receipt - ${receipt.receipt_number}`} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Generate Receipt</h1>
                    <p className="text-muted-foreground">Generate a receipt for {receipt.receipt_number}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Receipt Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                                <p className="text-sm font-medium">{receipt.receipt_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Customer</label>
                                <p className="text-sm font-medium">
                                    {receipt.customer?.first_name} {receipt.customer?.last_name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Amount</label>
                                <p className="text-sm font-medium">
                                    {receipt.currency ?? 'NGN'} {Number(receipt.amount).toLocaleString()}
                                </p>
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
                        <p className="mb-4 text-sm text-muted-foreground">
                            Using the default template. You can change the default in{' '}
                            <a href={route('templates.index')} className="text-primary underline">
                                Document Templates
                            </a>
                            .
                        </p>
                        <div className="flex justify-center overflow-auto rounded-lg border bg-gray-50 p-6">
                            <div className="w-full max-w-[210mm] bg-white shadow-2xl">
                                <iframe
                                    src={route('receipts.html-preview', { receipt: receipt.id, template_key: defaultTemplateKey })}
                                    className="h-[500px] w-full border-0"
                                    title="Receipt Preview"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                        {isGenerating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? 'Generating...' : 'Generate Receipt'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
