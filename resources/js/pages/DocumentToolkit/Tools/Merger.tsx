import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Head } from '@inertiajs/react';
import { FileStack, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Merger() {
    const { t } = useLang();
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: t('Document Toolkit'), href: route('document-toolkit.index') },
        { title: t('Merger'), href: route('document-toolkit.merger') },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            // Only accept PDFs for now based on backend setup
            const validFiles = newFiles.filter((f) => f.type === 'application/pdf');

            if (validFiles.length !== newFiles.length) {
                toast.warning(t('Only PDF files are supported for merging right now.'));
            }

            setFiles((prev) => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(files);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFiles(items);
    };

    const submit = async () => {
        if (files.length < 2) {
            toast.error(t('Please select at least two files to merge.'));
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        formData.append('_token', token);
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const res = await fetch(route('document-toolkit.merge'), {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json',
                },
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
            a.download = `merged_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success(t('Documents merged successfully!'));
            setFiles([]);
        } catch (error) {
            console.error(error);
            toast.error(t('Failed to merge documents.'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Document Merger')} />

            <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileStack className="h-6 w-6 text-purple-500" />
                            {t('Document Merger')}
                        </CardTitle>
                        <CardDescription>
                            {t('Merge multiple PDF files into a single document. Drag and drop rows to reorder them before merging.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex w-full items-center justify-center">
                            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Plus className="mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">{t('Add Files')}</span>
                                    </p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" multiple />
                            </label>
                        </div>

                        {files.length > 0 && (
                            <div className="rounded-md border">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="files-list">
                                        {(provided) => (
                                            <ul className="divide-y" {...provided.droppableProps} ref={provided.innerRef}>
                                                {files.map((file, index) => (
                                                    <Draggable key={`${file.name}-${index}`} draggableId={`${file.name}-${index}`} index={index}>
                                                        {(provided, snapshot) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`flex items-center justify-between bg-background p-4 ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary/20' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="cursor-grab text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <GripVertical className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                                        <span className="font-bold">{index + 1}</span>
                                                                    </div>
                                                                    <div className="grid gap-0.5">
                                                                        <p className="w-48 truncate text-sm font-medium sm:w-80">{file.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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

                        <div className="flex justify-end gap-4 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setFiles([])} disabled={files.length === 0 || processing}>
                                {t('Clear All')}
                            </Button>
                            <Button onClick={submit} disabled={files.length < 2 || processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('Merge Documents')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}
