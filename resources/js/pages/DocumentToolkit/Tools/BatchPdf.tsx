import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Head } from '@inertiajs/react';
import imageCompression from 'browser-image-compression';
import jsPDF from 'jspdf';
import { Download, GripVertical, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BatchImageToPdf() {
    const { t } = useLang();
    const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
    const [processing, setProcessing] = useState(false);
    const [reportName, setReportName] = useState('Claim_Evidence_Report');

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Batch PDF'), href: route('document-toolkit.batch-pdf') },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter((f) => f.type.startsWith('image/'));

            if (validFiles.length !== newFiles.length) {
                toast.warning(t('Only image files are supported.'));
            }

            const filesWithPreview = validFiles.map((file) => ({
                file,
                preview: URL.createObjectURL(file),
            }));

            setFiles((prev) => [...prev, ...filesWithPreview]);
        }
    };

    const removeFile = (index: number) => {
        const item = files[index];
        URL.revokeObjectURL(item.preview);
        setFiles(files.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setFiles([]);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(files);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFiles(items);
    };

    // Client-side PDF generation for efficiency and privacy
    const generatePdf = async () => {
        if (files.length === 0) {
            toast.error(t('Please add at least one image.'));
            return;
        }

        setProcessing(true);
        const toastId = toast.loading(t('Compressing images and generating PDF...'));

        try {
            // A4 dimensions in mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - margin * 2;

            // Add Title page or Header
            pdf.setFontSize(16);
            pdf.text(reportName, margin, margin + 5);
            pdf.setFontSize(10);
            pdf.text(`${t('Generated on')}: ${new Date().toLocaleDateString()}`, margin, margin + 12);
            pdf.text(`${t('Total Images')}: ${files.length}`, margin, margin + 17);

            // Set initial Y position for first image
            let currentY = margin + 25;

            for (let i = 0; i < files.length; i++) {
                const item = files[i];

                // Compress image before adding to PDF to keep final PDF size small
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(item.file, options);
                const imageData = await fileToBase64(compressedFile);

                // Calculate dimensions to fit width
                const imgProps = pdf.getImageProperties(imageData);
                const ratio = imgProps.width / imgProps.height;
                const imgHeight = contentWidth / ratio;

                // Check if we need a new page
                if (currentY + imgHeight > pageHeight - margin) {
                    if (i > 0) {
                        // Don't add a new page if it's the very first image and it's just very tall
                        pdf.addPage();
                        currentY = margin;
                    }
                }

                // Add Image label
                pdf.setFontSize(10);
                pdf.text(`Image ${i + 1}: ${item.file.name}`, margin, currentY);
                currentY += 5; // Space below label

                // Scale height if still too tall for a full page
                let finalHeight = imgHeight;
                let finalWidth = contentWidth;

                if (finalHeight > pageHeight - margin * 2 - 10) {
                    finalHeight = pageHeight - margin * 2 - 10;
                    finalWidth = finalHeight * ratio;
                }

                // Center image if scaled down width-wise
                const xOffset = margin + (contentWidth - finalWidth) / 2;

                pdf.addImage(imageData, 'JPEG', xOffset, currentY, finalWidth, finalHeight);
                currentY += finalHeight + margin; // Space for next image
            }

            pdf.save(`${reportName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            toast.success(t('PDF Generated successfully!'), { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(t('Failed to generate PDF.'), { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Batch Image to PDF')} />

            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <ImagePlus className="h-6 w-6 text-pink-500" />
                            {t('Batch Image to PDF')}
                        </CardTitle>
                        <CardDescription>
                            {t(
                                'Upload claim photos and automatically format them into a structured PDF document. (Processes securely in your browser)',
                            )}
                        </CardDescription>
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
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
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
                                {files.length === 0 ? (
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
                                                        {files.map((item, index) => (
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
                                                                                <img
                                                                                    src={item.preview}
                                                                                    alt=""
                                                                                    className="h-full w-full object-cover"
                                                                                />
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
                                                                            onClick={() => removeFile(index)}
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
                                {files.length} {files.length === 1 ? t('image') : t('images')} {t('selected')}
                            </p>
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={clearAll} disabled={files.length === 0 || processing}>
                                    {t('Clear All')}
                                </Button>
                                <Button onClick={generatePdf} disabled={files.length === 0 || processing}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    {t('Generate PDF')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
