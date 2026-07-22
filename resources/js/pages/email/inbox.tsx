import { ComposeToolbar } from '@/components/email/compose-toolbar';
import { FolderTree } from '@/components/email/folder-tree';
import { MessageList } from '@/components/email/message-list';
import { MessagePreview } from '@/components/email/message-preview';
import { SearchBar } from '@/components/email/search-bar';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmailAccount {
    id: number;
    email: string;
    account_name: string;
    messages_count?: number;
    folders_count?: number;
}

interface EmailFolder {
    id: number;
    name: string;
    type: string;
    account_id: number;
    messages_count?: number;
}

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
    folder: { id: number; name: string; type: string };
}

interface EmailInboxProps {
    messages?: EmailMessage[];
    folders?: EmailFolder[];
    accounts?: EmailAccount[];
    selectedFolderId?: number | null;
    selectedAccountId?: number | null;
}

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function EmailInbox({
    messages = [],
    folders = [],
    accounts = [],
    selectedFolderId = null,
    selectedAccountId = null,
}: EmailInboxProps) {
    const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const [listLoading, setListLoading] = useState(false);

    const handleFolderSelect = (folderId: number | null) => {
        setListLoading(true);
        setSelectedMessage(null);
        setMessageError(null);
        router.get(
            '/email/inbox',
            { folder_id: folderId ?? undefined, account_id: selectedAccountId ?? undefined },
            {
                preserveState: true,
                onFinish: () => setListLoading(false),
            },
        );
    };

    const handleAccountSelect = (accountId: number | null) => {
        setListLoading(true);
        setSelectedMessage(null);
        setMessageError(null);
        router.get(
            '/email/inbox',
            { account_id: accountId ?? undefined, folder_id: selectedFolderId ?? undefined },
            {
                preserveState: true,
                onFinish: () => setListLoading(false),
            },
        );
    };

    const handleSearch = (query: string) => {
        setListLoading(true);
        setSelectedMessage(null);
        setMessageError(null);
        router.get(
            '/email/inbox',
            { search: query || undefined },
            {
                preserveState: true,
                onFinish: () => setListLoading(false),
            },
        );
    };

    const handleMessageSelect = async (id: number) => {
        setMessageLoading(true);
        setMessageError(null);
        try {
            const response = await fetch(`/api/v1/email/messages/${id}`, {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) {
                throw new Error('Failed to load message');
            }
            const data = await response.json();
            if (data.success) {
                setSelectedMessage(data.data);
            } else {
                throw new Error(data.message || 'Failed to load message');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            setMessageError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setMessageLoading(false);
        }
    };

    /** Called by ComposeToolbar — receives a populated FormData ready to POST */
    const handleSend = async (formData: FormData): Promise<void> => {
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
            throw new Error(data.message || data.error || 'Failed to send message');
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage) {
            return;
        }

        const token = getXsrfToken();
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }

        try {
            // Move to trash folder first; if none, delete permanently
            const trashFolder = folders.find((f) => f.type === 'trash' && f.account_id === selectedMessage.account.id);

            if (trashFolder) {
                await fetch(`/api/v1/email/messages/${selectedMessage.id}/move`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder_id: trashFolder.id }),
                });
                toast.success('Message moved to trash');
            } else {
                // No trash folder — full delete
                await fetch(`/api/v1/email/messages/${selectedMessage.id}`, {
                    method: 'DELETE',
                    headers,
                });
                toast.success('Message deleted');
            }

            setSelectedMessage(null);
            // Refresh list
            router.reload({ only: ['messages'] });
        } catch {
            toast.error('Failed to delete message');
        }
    };

    return (
        <AppLayout>
            <Head title="Email Inbox" />
            <div className="flex h-[calc(100vh-4rem)]">
                {/* ── Sidebar: folders + accounts ─────────────────────── */}
                <div className="flex w-56 flex-col border-r bg-muted/30">
                    <div className="p-3">
                        <ComposeToolbar accounts={accounts} onSend={handleSend} />
                    </div>
                    <div className="flex-1 overflow-auto">
                        <FolderTree
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            onSelect={handleFolderSelect}
                            accounts={accounts}
                            selectedAccountId={selectedAccountId}
                            onSelectAccount={handleAccountSelect}
                        />
                    </div>
                </div>

                {/* ── Message list ─────────────────────────────────────── */}
                <div className="flex w-80 flex-col border-r">
                    <div className="border-b p-3">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <div className="flex-1 overflow-auto">
                        <MessageList messages={messages} selectedId={selectedMessage?.id} onSelect={handleMessageSelect} isLoading={listLoading} />
                    </div>
                </div>

                {/* ── Message preview ──────────────────────────────────── */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {messageLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                                </div>
                                <span className="text-sm">Loading message...</span>
                            </div>
                        </div>
                    ) : (
                        <MessagePreview message={selectedMessage} error={messageError} onDelete={handleDeleteMessage} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
