import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Download, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ImportResult {
    created: number;
    skipped: number;
    errors: string[];
}

interface ImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ImportModal({ open, onOpenChange }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleClose = () => {
        const shouldReload = result !== null;
        setFile(null);
        setProcessing(false);
        setResult(null);
        onOpenChange(false);
        if (shouldReload) {
            router.reload({ only: ['customers'] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file to import.');
            return;
        }

        setProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(route('customers.import.excel').toString(), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                toast.error(json.message || json.error || 'Failed to import customers.');
                return;
            }

            const json = await response.json();
            setResult({
                created: json.created ?? 0,
                skipped: json.skipped ?? 0,
                errors: json.errors ?? [],
            });

            if (json.created > 0) {
                toast.success(`${json.created} customer(s) imported successfully.`);
            }
            if (json.errors?.length > 0) {
                toast.error(`${json.errors.length} row(s) had errors.`);
            }
        } catch (err) {
            console.error('Import error:', err);
            toast.error('Failed to import customers. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(true); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Customers</DialogTitle>
                    <DialogDescription>Upload an Excel file to bulk import customers.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm font-medium">Step 1: Download the template</p>
                        <p className="text-xs text-muted-foreground">Fill in the template with your customer data.</p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                            <a href={route('customers.export.template').toString()}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </a>
                        </Button>
                    </div>

                    {!result ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="import-file">Step 2: Upload your completed file</Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    disabled={processing}
                                />
                                <p className="text-xs text-muted-foreground">Accepted formats: .xlsx, .xls (max 5MB)</p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing || !file}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <p className="text-sm font-medium">Import Results</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p className="text-green-600">✓ {result.created} customer(s) created</p>
                                    {result.skipped > 0 && (
                                        <p className="text-amber-600">⏭ {result.skipped} row(s) skipped (duplicate emails)</p>
                                    )}
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-destructive">{result.errors.length} error(s):</p>
                                        <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
                                            {result.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleClose}>Done</Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
