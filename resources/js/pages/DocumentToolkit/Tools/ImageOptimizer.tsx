import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head } from '@inertiajs/react';
import { CheckCircle, Image as ImageIcon, Loader2, Maximize } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const csrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

export default function ImageOptimizer() {
    const { t } = useLang();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Image Optimizer'), href: route('document-toolkit.optimizer') },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (!selected.type.startsWith('image/')) {
                toast.error(t('Only image files are supported.'));
                return;
            }
            if (preview) URL.revokeObjectURL(preview);
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const clearFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error(t('Please select an image.'));
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append('_token', csrfToken());
        formData.append('file', file);

        try {
            const res = await fetch(route('document-toolkit.optimize-image'), {
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
            a.download = `optimized_${file.name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t('Image optimized and downloaded!'));
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : t('Failed to optimize image.');
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Image Optimizer')} />
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Maximize className="h-6 w-6 text-green-500" />
                            {t('Image Optimizer')}
                        </CardTitle>
                        <CardDescription>
                            {t('Compress claim photos without visible quality loss. Optimizes JPEG, PNG, and WebP images.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {!preview ? (
                                <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">{t('Click to upload image')}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP (max 20MB)</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
                                        <img src={preview} alt="Preview" className="max-h-[380px] rounded-md object-contain" />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                                            <div>
                                                <p className="text-sm font-medium">{file?.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('Original')}: {file ? (file.size / 1024).toFixed(1) : 0} KB
                                                </p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={clearFile} disabled={processing}>
                                            {t('Change')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" size="lg" disabled={!file || processing}>
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('Optimize & Download')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
