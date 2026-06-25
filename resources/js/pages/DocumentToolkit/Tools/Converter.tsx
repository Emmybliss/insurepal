import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileUpload, useServerProcess } from '@/hooks/useDocumentProcessor';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileText, FileUp, GripVertical, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const csrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

export default function Converter() {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState<string>('document');
    const [reportName, setReportName] = useState('Claim_Evidence_Report');

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Converter'), href: route('document-toolkit.converter') },
    ];

    // Single document conversion
    const docFile = useFileUpload({
        accept: '.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
        maxSize: 50 * 1024 * 1024,
    });

    const docProcessor = useServerProcess({
        route: route('document-toolkit.convert'),
        onSuccess: () => toast.success(t('Document converted successfully!')),
    });

    // Batch images
    const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
    const [batchProcessing, setBatchProcessing] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const filesWithPreview = newFiles.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
            }));
            setImageFiles((prev) => [...prev, ...filesWithPreview]);
        }
    };

    const removeImage = (index: number) => {
        const item = imageFiles[index];
        URL.revokeObjectURL(item.preview);
        setImageFiles(imageFiles.filter((_, i) => i !== index));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(imageFiles);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setImageFiles(items);
    };

    const handleDocSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docFile.file) {
            toast.error(t('Please select a file to convert.'));
            return;
        }

        try {
            await docProcessor.submit({
                file: docFile.file,
                format: 'pdf',
            });
            docFile.clear();
        } catch (error) {
            const msg = error instanceof Error ? error.message : t('Failed to convert document.');
            toast.error(msg);
        }
    };

    const handleBatchSubmit = async () => {
        if (imageFiles.length === 0) {
            toast.error(t('Please add at least one image.'));
            return;
        }

        setBatchProcessing(true);
        const toastId = toast.loading(t('Converting images to PDF...'));

        try {
            const formData = new FormData();
            formData.append('_token', csrfToken());
            formData.append('conversion_type', 'batch');
            formData.append('title', reportName);

            imageFiles.forEach((item) => {
                formData.append('images[]', item.file);
            });

            const res = await fetch(route('document-toolkit.convert'), {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Server error' }));
                throw new Error(err.message || 'Conversion failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success(t('PDF generated successfully!'), { id: toastId });
            setImageFiles([]);
        } catch (error) {
            const msg = error instanceof Error ? error.message : t('Failed to convert images.');
            toast.error(msg);
        } finally {
            setBatchProcessing(false);
        }
    };

    const documentTab = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="h-6 w-6 text-blue-500" />
                    {t('Document Converter')}
                </CardTitle>
                <CardDescription>{t('Convert Word (.docx) or Excel (.xlsx) files to PDF. Requires LibreOffice on the server.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleDocSubmit} className="space-y-6">
                    <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {docFile.file ? (
                                <>
                                    <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
                                    <p className="text-sm font-semibold">{docFile.file.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {(docFile.file.size / 1024 / 1024).toFixed(2)} MB — {t('Click to change')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">{t('Click to upload')}</span> {t('or drag and drop')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">DOCX, XLSX, JPEG, PNG</p>
                                </>
                            )}
                        </div>
                        <input type="file" className="hidden" onChange={docFile.handleFileChange} accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                    </label>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={docFile.clear} disabled={!docFile.file || docProcessor.processing}>
                            {t('Clear')}
                        </Button>
                        <Button type="submit" disabled={!docFile.file || docProcessor.processing}>
                            {docProcessor.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('Convert to PDF')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const imageTab = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <ImagePlus className="h-6 w-6 text-pink-500" />
                    {t('Batch Image to PDF')}
                </CardTitle>
                <CardDescription>{t('Upload claim photos and automatically format them into a structured PDF document.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-4 md:col-span-1">
                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="reportName">
                                {t('Document Title')}
                            </label>
                            <input
                                id="reportName"
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                                placeholder={t('e.g. Claim Evidence')}
                            />
                        </div>

                        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Plus className="mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground">{t('Add Photos')}</p>
                            </div>
                            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                        </label>

                        <div className="rounded-lg border bg-primary/5 p-4 text-sm text-muted-foreground">
                            <p className="mb-1 font-semibold text-foreground">{t('Pro Tip:')}</p>
                            <p>
                                {t(
                                    'Organize images chronologically. You can drag and drop images on the right to reorder them before generating the PDF.',
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {imageFiles.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-muted/10 text-muted-foreground">
                                <ImagePlus className="mb-2 h-12 w-12 opacity-50" />
                                <p>{t('No images added yet.')}</p>
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto rounded-md border">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="image-list">
                                        {(provided) => (
                                            <ul className="divide-y" {...provided.droppableProps} ref={provided.innerRef}>
                                                {imageFiles.map((item, index) => (
                                                    <Draggable
                                                        key={`${item.file.name}-${index}`}
                                                        draggableId={`${item.file.name}-${index}`}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`flex items-center justify-between bg-background p-3 ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary/20' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <GripVertical className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded border bg-muted">
                                                                        <img src={item.preview} alt="" className="h-full w-full object-cover" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium">{item.file.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="ml-2 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => removeImage(index)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </li>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </ul>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        {imageFiles.length} {imageFiles.length === 1 ? t('image') : t('images')} {t('selected')}
                    </p>
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                imageFiles.forEach((f) => URL.revokeObjectURL(f.preview));
                                setImageFiles([]);
                            }}
                            disabled={imageFiles.length === 0 || batchProcessing}
                        >
                            {t('Clear All')}
                        </Button>
                        <Button onClick={handleBatchSubmit} disabled={imageFiles.length === 0 || batchProcessing}>
                            {batchProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            {t('Generate PDF')}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Document Converter')} />
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="document" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Document')}
                        </TabsTrigger>
                        <TabsTrigger value="images" className="flex items-center gap-2">
                            <ImagePlus className="h-4 w-4" />
                            {t('Images (Batch)')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="document" className="mt-6">
                        {documentTab}
                    </TabsContent>

                    <TabsContent value="images" className="mt-6">
                        {imageTab}
                    </TabsContent>
                </Tabs>
            </div>
        </AppSidebarLayout>
    );
}
