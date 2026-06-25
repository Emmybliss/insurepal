import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompressionLevel, useFileUpload, useServerProcess, type CompressionLevel } from '@/hooks/useDocumentProcessor';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileText, ImageOff, Loader2, Maximize } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DocumentCompressor() {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState<string>('pdf');

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Document Compressor'), href: route('document-toolkit.compressor') },
    ];

    const pdfCompressionLevel = useCompressionLevel('Medium');

    const pdfFile = useFileUpload({
        accept: '.pdf',
        maxSize: 50 * 1024 * 1024,
        validate: (f) => f.type === 'application/pdf',
    });

    const imageFile = useFileUpload({
        accept: 'image/*',
        maxSize: 20 * 1024 * 1024,
        validate: (f) => f.type.startsWith('image/'),
    });

    const pdfProcessor = useServerProcess({
        route: route('document-toolkit.compress'),
        onSuccess: () => toast.success(t('PDF compressed and downloaded!')),
    });

    const imageProcessor = useServerProcess({
        route: route('document-toolkit.optimize-image'),
        onSuccess: () => toast.success(t('Image optimized and downloaded!')),
    });

    const handlePdfSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfFile.file) {
            toast.error(t('Please select a PDF file.'));
            return;
        }

        try {
            await pdfProcessor.submit({
                file: pdfFile.file,
                level: pdfCompressionLevel.level,
            });
            pdfFile.clear();
        } catch (error) {
            const msg = error instanceof Error ? error.message : t('Failed to compress PDF.');
            toast.error(msg);
        }
    };

    const handleImageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile.file) {
            toast.error(t('Please select an image.'));
            return;
        }

        try {
            await imageProcessor.submit({
                file: imageFile.file,
            });
            imageFile.clear();
        } catch (error) {
            const msg = error instanceof Error ? error.message : t('Failed to optimize image.');
            toast.error(msg);
        }
    };

    const compressionLevels: { value: CompressionLevel; label: string; desc: string }[] = [
        { value: 'Low', label: t('Low'), desc: t('Best quality, larger file') },
        { value: 'Medium', label: t('Medium'), desc: t('Good balance (Recommended)') },
        { value: 'High', label: t('High'), desc: t('Smallest size, lower quality') },
    ];

    const pdfCompression = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <ImageOff className="h-6 w-6 text-orange-500" />
                    {t('PDF Compressor')}
                </CardTitle>
                <CardDescription>{t('Reduce PDF file size for easier sharing. Requires Ghostscript on the server.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePdfSubmit} className="space-y-8">
                    <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {pdfFile.file ? (
                                <>
                                    <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                                    <p className="text-sm font-semibold">{pdfFile.file.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB — {t('Click to change')}
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
                        <input type="file" className="hidden" onChange={pdfFile.handleFileChange} accept=".pdf" />
                    </label>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t('Compression Level')}</h3>
                        <RadioGroup
                            value={pdfCompressionLevel.level}
                            onValueChange={(v) => pdfCompressionLevel.setLevel(v as CompressionLevel)}
                            className="grid grid-cols-1 gap-4 md:grid-cols-3"
                        >
                            {compressionLevels.map((opt) => (
                                <div key={opt.value}>
                                    <RadioGroupItem value={opt.value} id={`pdf-c-${opt.value}`} className="peer sr-only" />
                                    <Label
                                        htmlFor={`pdf-c-${opt.value}`}
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
                        <Button type="button" variant="outline" onClick={pdfFile.clear} disabled={!pdfFile.file || pdfProcessor.processing}>
                            {t('Clear')}
                        </Button>
                        <Button type="submit" disabled={!pdfFile.file || pdfProcessor.processing}>
                            {pdfProcessor.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('Compress PDF')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const imageCompression = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <Maximize className="h-6 w-6 text-green-500" />
                    {t('Image Optimizer')}
                </CardTitle>
                <CardDescription>{t('Compress claim photos without visible quality loss. Optimizes JPEG, PNG, and WebP images.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleImageSubmit} className="space-y-6">
                    {!imageFile.preview ? (
                        <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Maximize className="mb-3 h-12 w-12 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">{t('Click to upload image')}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP (max 20MB)</p>
                            </div>
                            <input type="file" className="hidden" onChange={imageFile.handleFileChange} accept="image/*" />
                        </label>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
                                <img src={imageFile.preview} alt="Preview" className="max-h-[380px] rounded-md object-contain" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium">{imageFile.file?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('Original')}: {imageFile.file ? (imageFile.file.size / 1024).toFixed(1) : 0} KB
                                        </p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={imageFile.clear} disabled={imageProcessor.processing}>
                                    {t('Change')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" size="lg" disabled={!imageFile.file || imageProcessor.processing}>
                            {imageProcessor.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('Optimize & Download')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Document Compressor')} />

            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pdf" className="flex items-center gap-2">
                            <ImageOff className="h-4 w-4" />
                            {t('PDF Compress')}
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-2">
                            <Maximize className="h-4 w-4" />
                            {t('Image Optimize')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pdf" className="mt-6">
                        {pdfCompression}
                    </TabsContent>

                    <TabsContent value="image" className="mt-6">
                        {imageCompression}
                    </TabsContent>
                </Tabs>
            </div>
        </AppSidebarLayout>
    );
}
