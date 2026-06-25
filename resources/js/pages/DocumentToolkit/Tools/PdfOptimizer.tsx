import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileSearch, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PdfOptimizer() {
    const { t } = useLang();
    const [file, setFile] = useState<File | null>(null);
    const [level, setLevel] = useState('Medium');
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('PDF Optimizer'), href: route('document-toolkit.pdf-optimizer') },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.type !== 'application/pdf') {
                toast.error(t('Only PDF files are supported.'));
                return;
            }
            setFile(selected);
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error(t('Please select a PDF to optimize.'));
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        formData.append('_token', token);
        formData.append('file', file);
        formData.append('level', level);

        try {
            const res = await fetch(route('document-toolkit.optimize-pdf'), {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                // Parse JSON error from server
                const err = await res.json().catch(() => ({ message: 'Server error check console' }));
                const validationMsg = err.errors ? (Object.values(err.errors)[0] as string[])[0] : null;
                throw new Error(validationMsg || err.message || 'Request failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimized_${file.name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success(t('PDF optimized and downloaded!'));
            setFile(null);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : t('Failed to optimize PDF.');
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    const compressionLevels = [
        {
            value: 'Low',
            label: t('Light'),
            description: t('Best quality, slight size reduction'),
        },
        {
            value: 'Medium',
            label: t('Balanced'),
            description: t('Good quality, significant size reduction'),
        },
        {
            value: 'High',
            label: t('Maximum'),
            description: t('Smallest size, some quality trade-off'),
        },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('PDF Optimizer')} />

            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileSearch className="h-6 w-6 text-blue-500" />
                            {t('PDF Optimizer')}
                        </CardTitle>
                        <CardDescription>
                            {t('Reduce the file size of PDF documents using Ghostscript — ideal for large scanned policies and reports.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            {/* Drop Zone */}
                            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                                            <p className="text-sm font-semibold text-foreground">{file.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB — {t('Click to change')}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground">
                                                <span className="font-semibold">{t('Click to upload PDF')}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">PDF only (max 50MB)</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                            </label>

                            {/* Optimization Level */}
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold">{t('Optimization Strength')}</h3>
                                <RadioGroup value={level} onValueChange={setLevel} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {compressionLevels.map((opt) => (
                                        <div key={opt.value}>
                                            <RadioGroupItem value={opt.value} id={`lvl-${opt.value}`} className="peer sr-only" />
                                            <Label
                                                htmlFor={`lvl-${opt.value}`}
                                                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                                            >
                                                <span className="text-base font-semibold">{opt.label}</span>
                                                <span className="mt-1 text-center text-xs text-muted-foreground">{opt.description}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Info Banner */}
                            <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                <strong>{t('How it works:')}</strong>{' '}
                                {t(
                                    'This tool uses Ghostscript on the server to rewrite your PDF with optimized compression settings. Requires Ghostscript to be installed on the server.',
                                )}
                            </div>

                            <div className="flex justify-end gap-4 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setFile(null)} disabled={!file || processing}>
                                    {t('Clear')}
                                </Button>
                                <Button type="submit" size="lg" disabled={!file || processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('Optimize PDF')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
