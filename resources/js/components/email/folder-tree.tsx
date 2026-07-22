import { cn } from '@/lib/utils';
import { AlertTriangle, FileText, Inbox, Send, Trash2 } from 'lucide-react';

interface EmailFolder {
    id: number;
    name: string;
    type: string;
    messages_count?: number;
}

interface FolderTreeProps {
    folders: EmailFolder[];
    selectedFolderId?: number | null;
    onSelect: (folderId: number | null) => void;
    selectedAccountId?: number | null;
    accounts: { id: number; email: string; account_name: string }[];
    onSelectAccount?: (accountId: number | null) => void;
}

const folderIcons: Record<string, typeof Inbox> = {
    inbox: Inbox,
    sent: Send,
    drafts: FileText,
    trash: Trash2,
    spam: AlertTriangle,
};

export function FolderTree({ folders, selectedFolderId, onSelect, selectedAccountId, accounts, onSelectAccount }: FolderTreeProps) {
    return (
        <div className="space-y-1">
            {accounts.length > 1 && (
                <div className="space-y-1 px-3 py-2">
                    <button
                        onClick={() => onSelectAccount?.(null)}
                        className={cn('w-full rounded px-2 py-1 text-left text-sm', !selectedAccountId && 'bg-muted font-medium')}
                    >
                        All Accounts
                    </button>
                    {accounts.map((account) => (
                        <button
                            key={account.id}
                            onClick={() => onSelectAccount?.(account.id)}
                            className={cn(
                                'w-full truncate rounded px-2 py-1 text-left text-sm',
                                selectedAccountId === account.id && 'bg-muted font-medium',
                            )}
                        >
                            {account.account_name || account.email}
                        </button>
                    ))}
                    <div className="my-2 border-t" />
                </div>
            )}

            {folders.map((folder) => {
                const Icon = folderIcons[folder.type] || Inbox;
                return (
                    <button
                        key={folder.id}
                        onClick={() => onSelect(folder.id)}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                            selectedFolderId === folder.id ? 'bg-muted font-medium' : 'hover:bg-muted/50',
                        )}
                    >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-left capitalize">{folder.name.toLowerCase()}</span>
                        {folder.messages_count !== undefined && folder.messages_count > 0 && (
                            <span className="text-xs text-muted-foreground">{folder.messages_count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
