import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2, Paperclip, Send, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface AttachedFile {
    file: File;
    id: string;
}

interface InsurePalDoc {
    label: string;
    path: string;
}

interface ComposeToolbarProps {
    accounts: { id: number; email: string; account_name: string }[];
    onSend?: (data: FormData) => Promise<void>;
    /** Pre-attached InsurePal documents (e.g. policy PDF, invoice) */
    defaultDocuments?: InsurePalDoc[];
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposeToolbar({ accounts, onSend, defaultDocuments = [] }: ComposeToolbarProps) {
    const [open, setOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? 0);
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const getXsrfToken = (): string => {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const newFiles: AttachedFile[] = files.map((f) => ({ file: f, id: crypto.randomUUID() }));
        setAttachedFiles((prev) => [...prev, ...newFiles]);
        // reset so same file can be re-attached
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (id: string) => {
        setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const resetForm = () => {
        setTo('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setAttachedFiles([]);
    };

    const handleSend = async () => {
        if (!to || !subject || !body || !accountId || isSending) {
            return;
        }

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('account_id', String(accountId));
            formData.append('to', to);
            if (cc) {
                formData.append('cc', cc);
            }
            if (bcc) {
                formData.append('bcc', bcc);
            }
            formData.append('subject', subject);
            formData.append('body_html', `<p>${body.replace(/\n/g, '<br>')}</p>`);

            attachedFiles.forEach(({ file }) => {
                formData.append('attachments[]', file);
            });

            defaultDocuments.forEach(({ path }) => {
                formData.append('document_paths[]', path);
            });

            if (onSend) {
                await onSend(formData);
            } else {
                const token = getXsrfToken();
                const headers: Record<string, string> = {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                };
                if (token) {
                    headers['X-XSRF-TOKEN'] = token;
                }

                const res = await fetch('/api/v1/email/compose', {
                    method: 'POST',
                    headers,
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to send message');
                }
            }

            toast.success('Message sent successfully');
            setOpen(false);
            resetForm();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send message';
            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const allAttachments: { label: string; size?: number; isDoc?: boolean }[] = [
        ...attachedFiles.map(({ file, id }) => ({ label: file.name, size: file.size, id })),
        ...defaultDocuments.map(({ label }) => ({ label, isDoc: true })),
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" /> Compose
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    {/* From account */}
                    <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-xs text-muted-foreground">From</Label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(Number(e.target.value))}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            disabled={isSending}
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name || account.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* To / Cc / Bcc */}
                    <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-xs text-muted-foreground">To</Label>
                        <Input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="recipient@example.com"
                            disabled={isSending}
                            type="email"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-xs text-muted-foreground">Cc</Label>
                        <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com (optional)" disabled={isSending} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-xs text-muted-foreground">Bcc</Label>
                        <Input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@example.com (optional)" disabled={isSending} />
                    </div>

                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" disabled={isSending} />

                    <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your message..."
                        className="min-h-[180px] resize-none"
                        disabled={isSending}
                    />

                    {/* Attachment chips */}
                    {allAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachedFiles.map(({ file, id }) => (
                                <div key={id} className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs">
                                    <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    <span className="max-w-[160px] truncate">{file.name}</span>
                                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(id)}
                                        className="ml-0.5 text-muted-foreground hover:text-destructive"
                                        disabled={isSending}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {defaultDocuments.map(({ label, path }) => (
                                <div
                                    key={path}
                                    className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                                >
                                    <FileText className="h-3 w-3 shrink-0" />
                                    <span className="max-w-[160px] truncate">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="*/*" />

                    {/* Toolbar row */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                                <Paperclip className="mr-1.5 h-4 w-4" />
                                Attach files
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (!isSending) {
                                        setOpen(false);
                                        resetForm();
                                    }
                                }}
                                disabled={isSending}
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" /> Discard
                            </Button>
                            <Button onClick={handleSend} disabled={!to || !subject || !body || isSending} size="sm">
                                {isSending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                                {isSending ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
