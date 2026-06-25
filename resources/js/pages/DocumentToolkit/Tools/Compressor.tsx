import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileText, ImageOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const csrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

export default function Compressor() {
    const { t } = useLang();
    const [file, setFile] = useState<File | null>(null);
    const [level, setLevel] = useState('Medium');
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Compressor'), href: route('document-toolkit.compressor') },
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
            toast.error(t('Please select a file to compress.'));
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append('_token', csrfToken());
        formData.append('file', file);
        formData.append('level', level);

        try {
            const res = await fetch(route('document-toolkit.compress'), {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Server error check console' }));
                const validationMsg = err.errors ? (Object.values(err.errors)[0] as string[])[0] : null;
                throw new Error(validationMsg || err.message || 'Request failed due to an unknown error');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed_${file.name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t('Document compressed successfully!'));
            setFile(null);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : t('Failed to compress document.');
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Document Compressor')} />
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <ImageOff className="h-6 w-6 text-orange-500" />
                            {t('Document Compressor')}
                        </CardTitle>
                        <CardDescription>{t('Reduce PDF file size for easier sharing. Requires Ghostscript on the server.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-8">
                            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                                            <p className="text-sm font-semibold">{file.name}</p>
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

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">{t('Compression Level')}</h3>
                                <RadioGroup value={level} onValueChange={setLevel} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {[
                                        { value: 'Low', label: t('Low'), desc: t('Best quality, larger file') },
                                        { value: 'Medium', label: t('Medium'), desc: t('Good balance (Recommended)') },
                                        { value: 'High', label: t('High'), desc: t('Smallest size, lower quality') },
                                    ].map((opt) => (
                                        <div key={opt.value}>
                                            <RadioGroupItem value={opt.value} id={`c-${opt.value}`} className="peer sr-only" />
                                            <Label
                                                htmlFor={`c-${opt.value}`}
                                                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                                            >
                                                <span className="text-base font-semibold">{opt.label}</span>
                                                <span className="mt-1 text-center text-xs text-muted-foreground">{opt.desc}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="flex justify-end gap-4 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setFile(null)} disabled={!file || processing}>
                                    {t('Clear')}
                                </Button>
                                <Button type="submit" disabled={!file || processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('Compress PDF')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
