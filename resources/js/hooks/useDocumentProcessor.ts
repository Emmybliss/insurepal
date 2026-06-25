import { useCallback, useState } from 'react';

const csrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

export type CompressionLevel = 'Low' | 'Medium' | 'High';

export interface FileState {
    file: File;
    preview?: string;
}

export interface UseFileUploadOptions {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    validate?: (file: File) => boolean;
    onValidationError?: (message: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
    const { accept, maxSize = 50 * 1024 * 1024, validate, onValidationError } = options;

    const [file, setFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files) return;

            const newFiles = Array.from(e.target.files);

            for (const f of newFiles) {
                if (f.size > maxSize) {
                    onValidationError?.(`File exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
                    return;
                }

                if (validate && !validate(f)) {
                    onValidationError?.('Invalid file type');
                    return;
                }
            }

            if (options.multiple) {
                setFiles((prev) => [...prev, ...newFiles]);
                if (newFiles[0]) {
                    setPreview(URL.createObjectURL(newFiles[0]));
                }
            } else {
                setFile(newFiles[0]);
                setPreview(URL.createObjectURL(newFiles[0]));
            }
        },
        [maxSize, validate, options.multiple, onValidationError],
    );

    const clear = useCallback(() => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setFiles([]);
        setPreview(null);
    }, [preview]);

    const removeFile = useCallback(
        (index?: number) => {
            if (options.multiple && index !== undefined) {
                setFiles((prev) => {
                    const removed = prev[index];
                    if (removed) URL.revokeObjectURL(URL.createObjectURL(removed));
                    return prev.filter((_, i) => i !== index);
                });
            } else {
                clear();
            }
        },
        [options.multiple, clear],
    );

    return {
        file,
        files,
        preview,
        handleFileChange,
        clear,
        removeFile,
        accept,
        setFile,
        setFiles,
    };
}

export interface UseServerProcessOptions {
    route: string;
    onSuccess?: (filename: string) => void;
    onError?: (message: string) => void;
}

export function useServerProcess(options: UseServerProcessOptions) {
    const { route, onSuccess, onError } = options;
    const [processing, setProcessing] = useState(false);

    const submit = useCallback(
        async (data: Record<string, unknown>, additionalHeaders?: Record<string, string>) => {
            setProcessing(true);

            try {
                const formData = new FormData();
                formData.append('_token', csrfToken());

                for (const [key, value] of Object.entries(data)) {
                    if (value instanceof File) {
                        formData.append(key, value);
                    } else if (Array.isArray(value)) {
                        value.forEach((v) => formData.append(key, v));
                    } else if (value !== undefined && value !== null) {
                        formData.append(key, String(value));
                    }
                }

                const res = await fetch(route, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Accept: 'application/json',
                        ...additionalHeaders,
                    },
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({
                        message: 'Server error',
                    }));
                    const validationMsg = err.errors ? (Object.values(err.errors)[0] as string[])[0] : null;
                    throw new Error(validationMsg || err.message || 'Request failed');
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = res.headers.get('Content-Disposition');
                let filename = 'downloaded_file';
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                onSuccess?.(filename);
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
                onError?.(msg);
                throw error;
            } finally {
                setProcessing(false);
            }
        },
        [route, onSuccess, onError],
    );

    return { processing, submit };
}

export function useCompressionLevel(defaultLevel: CompressionLevel = 'Medium') {
    const [level, setLevel] = useState<CompressionLevel>(defaultLevel);

    return { level, setLevel };
}
