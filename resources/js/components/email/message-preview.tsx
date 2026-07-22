import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { AlertCircle, Download, FileText, Forward, Loader2, MailQuestion, Paperclip, Reply, ReplyAll, Send, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface EmailAttachment {
    id: number;
    filename: string;
    mime_type: string;
    size_bytes: number;
}

interface EmailMessage {
    id: number;
    subject: string;
    from_address: string;
    from_name: string;
    to_recipients: string[];
    cc_recipients?: string[];
    body_html: string;
    body_text: string;
    received_at: string;
    is_read: boolean;
    is_flagged: boolean;
    attachments: EmailAttachment[];
    account: { id: number; email: string; account_name: string };
}

interface ReplyAttachedFile {
    file: File;
    id: string;
}

interface MessagePreviewProps {
    message: EmailMessage | null;
    onDelete?: () => void;
    error?: string | null;
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

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

type ComposeMode = 'reply' | 'reply_all' | 'forward' | null;

export function MessagePreview({ message, onDelete, error }: MessagePreviewProps) {
    const [composeMode, setComposeMode] = useState<ComposeMode>(null);
    const [replyBody, setReplyBody] = useState('');
    const [forwardTo, setForwardTo] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyFiles, setReplyFiles] = useState<ReplyAttachedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openCompose = (mode: ComposeMode) => {
        setComposeMode(mode);
        setReplyBody('');
        setForwardTo('');
        setReplyFiles([]);
    };

    const closeCompose = () => {
        setComposeMode(null);
        setReplyBody('');
        setForwardTo('');
        setReplyFiles([]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const newFiles: ReplyAttachedFile[] = files.map((f) => ({ file: f, id: crypto.randomUUID() }));
        setReplyFiles((prev) => [...prev, ...newFiles]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeReplyFile = (id: string) => {
        setReplyFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSendReply = async () => {
        if (!message || !replyBody.trim() || isSending) {
            return;
        }

        setIsSending(true);

        const token = getXsrfToken();
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }

        try {
            const formData = new FormData();
            formData.append('body', replyBody);
            if (composeMode === 'reply_all') {
                formData.append('reply_all', '1');
            }
            replyFiles.forEach(({ file }) => formData.append('attachments[]', file));

            const endpoint = composeMode === 'forward' ? `/api/v1/email/compose/forward/${message.id}` : `/api/v1/email/compose/reply/${message.id}`;

            if (composeMode === 'forward') {
                if (!forwardTo.trim()) {
                    toast.error('Please enter a recipient to forward to.');
                    return;
                }
                formData.append('to', forwardTo);
            }

            const res = await fetch(endpoint, { method: 'POST', headers, body: formData });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || data.error || 'Failed to send');
            }

            toast.success(composeMode === 'forward' ? 'Message forwarded' : 'Reply sent');
            closeCompose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to send');
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadAttachment = async (attachment: EmailAttachment) => {
        try {
            const res = await fetch(`/api/v1/email/attachments/${attachment.id}/download`, {
                headers: { Accept: '*/*', 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!res.ok) {
                throw new Error('Download failed');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download attachment');
        }
    };

    // ── Error / empty states ──────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="mb-3 h-12 w-12 text-destructive" />
                <p className="text-sm font-medium text-destructive">Failed to load message</p>
                <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <MailQuestion className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Select a message to read</p>
                <p className="mt-1 text-xs text-muted-foreground">Your email will appear here</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* ── Message header ─────────────────────────────────────────── */}
            <div className="border-b px-6 py-4">
                <h2 className="mb-2 text-lg font-semibold">{message.subject || '(No subject)'}</h2>

                <div className="space-y-0.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{message.from_name || message.from_address}</span>
                        {message.from_name && <span className="text-xs">&lt;{message.from_address}&gt;</span>}
                    </div>
                    <div className="flex gap-1.5 text-xs">
                        <span>To:</span>
                        <span>{message.to_recipients?.join(', ')}</span>
                    </div>
                    {message.cc_recipients && message.cc_recipients.length > 0 && (
                        <div className="flex gap-1.5 text-xs">
                            <span>Cc:</span>
                            <span>{message.cc_recipients.join(', ')}</span>
                        </div>
                    )}
                    <p className="text-xs">{format(new Date(message.received_at), 'MMM d, yyyy h:mm a')}</p>
                </div>

                {/* Action toolbar */}
                <div className="mt-3 flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCompose(composeMode === 'reply' ? null : 'reply')}
                        className={composeMode === 'reply' ? 'bg-muted' : ''}
                    >
                        <Reply className="mr-1 h-4 w-4" /> Reply
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCompose(composeMode === 'reply_all' ? null : 'reply_all')}
                        className={composeMode === 'reply_all' ? 'bg-muted' : ''}
                    >
                        <ReplyAll className="mr-1 h-4 w-4" /> Reply All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCompose(composeMode === 'forward' ? null : 'forward')}
                        className={composeMode === 'forward' ? 'bg-muted' : ''}
                    >
                        <Forward className="mr-1 h-4 w-4" /> Forward
                    </Button>
                    {onDelete && (
                        <Button variant="ghost" size="sm" onClick={onDelete} className="ml-auto text-destructive hover:text-destructive">
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Email body ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6">
                {message.body_html ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.body_html }} />
                ) : (
                    <pre className="font-sans text-sm whitespace-pre-wrap">{message.body_text}</pre>
                )}
            </div>

            {/* ── Attachments ────────────────────────────────────────────── */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="border-t px-6 py-3">
                    <p className="mb-2 text-sm font-medium">Attachments ({message.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="max-w-[180px] truncate">{attachment.filename}</span>
                                <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size_bytes)}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleDownloadAttachment(attachment)}
                                    title={`Download ${attachment.filename}`}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Inline Reply / Forward composer ────────────────────────── */}
            {composeMode && (
                <div className="border-t bg-muted/20 px-6 py-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                                {composeMode === 'reply' && `Reply to ${message.from_address}`}
                                {composeMode === 'reply_all' && 'Reply All'}
                                {composeMode === 'forward' && 'Forward'}
                            </p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeCompose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Forward-only: To field */}
                        {composeMode === 'forward' && (
                            <div className="flex items-center gap-2">
                                <label className="w-6 shrink-0 text-xs text-muted-foreground">To</label>
                                <input
                                    type="email"
                                    value={forwardTo}
                                    onChange={(e) => setForwardTo(e.target.value)}
                                    placeholder="recipient@example.com"
                                    disabled={isSending}
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                            </div>
                        )}

                        <Textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder={composeMode === 'forward' ? 'Add a message before the forwarded email...' : 'Write your reply...'}
                            className="min-h-[100px] resize-none bg-background"
                            disabled={isSending}
                        />

                        {/* Reply attachment chips */}
                        {replyFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {replyFiles.map(({ file, id }) => (
                                    <div key={id} className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs">
                                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="max-w-[140px] truncate">{file.name}</span>
                                        <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                                        <button
                                            type="button"
                                            onClick={() => removeReplyFile(id)}
                                            className="text-muted-foreground hover:text-destructive"
                                            disabled={isSending}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

                        <div className="flex items-center justify-between">
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                                <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                                Attach
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={closeCompose} disabled={isSending}>
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSendReply}
                                    disabled={!replyBody.trim() || isSending || (composeMode === 'forward' && !forwardTo.trim())}
                                >
                                    {isSending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                                    {isSending ? 'Sending...' : composeMode === 'forward' ? 'Forward' : 'Send Reply'}
                                </Button>
                            </div>
                        </div>

                        {/* Quoted original message for forward */}
                        {composeMode === 'forward' && message.body_html && (
                            <div className="rounded border border-l-2 border-l-muted-foreground/30 pl-3">
                                <p className="mb-1 text-xs text-muted-foreground">
                                    ——— Forwarded from {message.from_address} on {format(new Date(message.received_at), 'MMM d, yyyy h:mm a')} ———
                                </p>
                                <div
                                    className="prose prose-xs dark:prose-invert max-w-none text-xs opacity-70"
                                    dangerouslySetInnerHTML={{ __html: message.body_html }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
