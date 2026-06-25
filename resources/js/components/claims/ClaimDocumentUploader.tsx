import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';
import { ClaimDocument, DocumentType } from '@/types/claim';
import { router } from '@inertiajs/react';
import { Download, File, FileText, Image, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface ClaimDocumentUploaderProps {
    claimId: number;
    documents: ClaimDocument[];
    canUpload: boolean;
    documentTypes: Array<{ value: DocumentType; label: string }>;
}

export function ClaimDocumentUploader({ claimId, documents, canUpload, documentTypes }: ClaimDocumentUploaderProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileDocTypes, setFileDocTypes] = useState<DocumentType[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles([...selectedFiles, ...files]);
        setFileDocTypes([...fileDocTypes, ...files.map(() => 'other' as DocumentType)]);
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setFileDocTypes(fileDocTypes.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        router.post(
            route('claims.upload-documents', claimId),
            {
                documents: selectedFiles,
                document_types: fileDocTypes,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setSelectedFiles([]);
                    setFileDocTypes([]);
                    setIsUploading(false);
                },
                onError: () => {
                    setIsUploading(false);
                },
            },
        );
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.match(/jpg|jpeg|png|gif|webp/i)) {
            return <Image className="h-5 w-5 text-blue-500" />;
        }
        if (fileType === 'pdf') {
            return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Documents
                </CardTitle>
                <CardDescription>Supporting documents and evidence for this claim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Section */}
                {canUpload && (
                    <div className="space-y-4 rounded-lg border-2 border-dashed p-4">
                        <div className="space-y-2">
                            <Label htmlFor="documents">Upload Documents</Label>
                            <Input
                                id="documents"
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                            <p className="text-sm text-muted-foreground">Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)</p>
                        </div>

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Files ({selectedFiles.length})</Label>
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 rounded border p-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                        <Select
                                            value={fileDocTypes[index]}
                                            onValueChange={(value) => {
                                                const newTypes = [...fileDocTypes];
                                                newTypes[index] = value as DocumentType;
                                                setFileDocTypes(newTypes);
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleFileRemove(index)}
                                            disabled={isUploading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                                    {isUploading ? 'Uploading...' : 'Upload Documents'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Existing Documents */}
                <div className="space-y-2">
                    <Label>Uploaded Documents ({documents.length})</Label>
                    {documents.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 rounded border p-3">
                                    {getFileIcon(doc.file_type)}
                                    <div className="flex-1">
                                        <p className="font-medium">{doc.file_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {doc.document_type.replace('_', ' ')} • {formatFileSize(doc.file_size)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploaded by {doc.uploaded_by_user?.name} • {formatDateTime(doc.created_at)}
                                        </p>
                                    </div>
                                    <a href={`/storage/${doc.file_path}`} download target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
