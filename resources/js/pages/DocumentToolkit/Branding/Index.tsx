import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FileDown, FileText, Pencil, PenTool, Trash2, Upload } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function BrandingIndex({ documents }: { documents: any }) {
    const { t } = useLang();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, progress, errors, reset } = useForm({
        file: null as File | null,
        name: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error(t('Please select a valid PDF file.'));
                return;
            }
            setData('file', file);
            setData('name', file.name.replace('.pdf', ''));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error(t('Please select a valid PDF file.'));
                return;
            }
            setData('file', file);
            setData('name', file.name.replace('.pdf', ''));
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) {
            toast.error(t('Please select a file first.'));
            return;
        }

        post(route('document-toolkit.branding.upload'), {
            onSuccess: () => {
                toast.success(t('Document uploaded successfully.'));
                reset();
            },
        });
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: t('Document Toolkit'), href: route('document-toolkit.index') },
                { title: t('PDF Branding & Overlays'), href: route('document-toolkit.branding.index') },
            ]}
        >
            <Head title={t('PDF Branding & Overlays')} />

            {/* <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6"> */}
            <Card className="mx-auto mt-10 max-w-7xl space-y-6 p-4 md:p-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <PenTool className="h-6 w-6 text-indigo-500" />
                        {t('Document Branding')}
                    </CardTitle>
                    <CardDescription>{t('Upload and customize documents with signatures, stamps, and watermarks.')}</CardDescription>
                </CardHeader>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{t('Upload Document')}</CardTitle>
                            <CardDescription>{t('Select a PDF to begin editing.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                                        isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'
                                    }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                    {data.file ? (
                                        <p className="text-sm font-medium text-primary">{data.file.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium">{t('Click or drag PDF here')}</p>
                                            <p className="text-xs text-muted-foreground">{t('Max file size: 20MB')}</p>
                                        </>
                                    )}
                                </div>
                                {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}

                                {data.file && (
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? t('Uploading...') : t('Upload & Edit')}
                                    </Button>
                                )}
                                {progress && (
                                    <div className="h-1 w-full bg-muted">
                                        <div className="h-1 bg-primary" style={{ width: `${progress.percentage}%` }}></div>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('Your Documents')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {documents.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <FileText className="mb-4 h-12 w-12 opacity-20" />
                                    <p>{t('No documents found. Upload one to get started.')}</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {documents.data.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{doc.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(doc.created_at).toLocaleDateString()} • {doc.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {doc.status === 'processed' && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={route('document-toolkit.branding.file', [doc.id, 'processed'])} target="_blank">
                                                            <FileDown className="mr-2 h-4 w-4" />
                                                            {t('Download')}
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="default" size="sm" asChild>
                                                    <Link href={route('document-toolkit.branding.editor', doc.id)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        {t('Edit')}
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    asChild
                                                >
                                                    <Link href={route('document-toolkit.branding.delete', doc.id)} method="delete" as="button">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Card>
            {/* </div> */}
        </AppSidebarLayout>
    );
}
