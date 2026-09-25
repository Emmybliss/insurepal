import { cn } from '@/lib/utils';
import { AlertTriangle, FileText, Inbox, Send, Trash2 } from 'lucide-react';
import React from 'react';

interface EmailFolder {
    id: number;
    name: string;
    type: string;
    account_id?: number;
    messages_count?: number;
}

interface FolderTreeProps {
    folders: EmailFolder[];
    selectedFolderId?: number | null;
    selectedFolderType?: string | null;
    onSelectFolder: (folderId: number | null, folderType?: string | null) => void;
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

const STANDARD_FOLDER_TYPES = [
    { type: 'inbox', label: 'Inbox' },
    { type: 'sent', label: 'Sent' },
    { type: 'drafts', label: 'Drafts' },
    { type: 'trash', label: 'Trash' },
    { type: 'spam', label: 'Spam' },
];

export function FolderTree({
    folders,
    selectedFolderId,
    selectedFolderType,
    onSelectFolder,
    selectedAccountId,
    accounts,
    onSelectAccount,
}: FolderTreeProps) {
    const isUnifiedMode = !selectedAccountId;

    const getUnifiedCount = (type: string) => {
        return folders
            .filter((f) => f.type === type)
            .reduce((sum, f) => sum + (f.messages_count || 0), 0);
    };

    return (
        <div className="space-y-1">
            {accounts.length > 1 && (
                <div className="space-y-1 px-3 py-2">
                    <button
                        type="button"
                        onClick={() => onSelectAccount?.(null)}
                        className={cn('w-full rounded px-2 py-1 text-left text-sm transition-colors', !selectedAccountId && 'bg-muted font-semibold text-primary')}
                    >
                        All Accounts
                    </button>
                    {accounts.map((account) => (
                        <button
                            type="button"
                            key={account.id}
                            onClick={() => onSelectAccount?.(account.id)}
                            className={cn(
                                'w-full truncate rounded px-2 py-1 text-left text-sm transition-colors',
                                selectedAccountId === account.id && 'bg-muted font-semibold text-primary',
                            )}
                        >
                            {account.account_name || account.email}
                        </button>
                    ))}
                    <div className="my-2 border-t" />
                </div>
            )}

            {isUnifiedMode
                ? STANDARD_FOLDER_TYPES.map(({ type, label }) => {
                      const Icon = folderIcons[type] || Inbox;
                      const count = getUnifiedCount(type);
                      const isSelected = selectedFolderType === type && !selectedFolderId;

                      return (
                          <button
                              type="button"
                              key={type}
                              onClick={() => onSelectFolder(null, type)}
                              className={cn(
                                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                  isSelected ? 'bg-muted font-semibold text-primary' : 'hover:bg-muted/50 text-foreground',
                              )}
                          >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-left">{label}</span>
                              {count > 0 && <span className="text-xs font-mono text-muted-foreground">{count}</span>}
                          </button>
                      );
                  })
                : folders.map((folder) => {
                      const Icon = folderIcons[folder.type] || Inbox;
                      const isSelected = selectedFolderId === folder.id || (selectedFolderType === folder.type && !selectedFolderId);

                      return (
                          <button
                              type="button"
                              key={folder.id}
                              onClick={() => onSelectFolder(folder.id, folder.type)}
                              className={cn(
                                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                  isSelected ? 'bg-muted font-semibold text-primary' : 'hover:bg-muted/50 text-foreground',
                              )}
                          >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-left capitalize">{folder.name.toLowerCase()}</span>
                              {folder.messages_count !== undefined && folder.messages_count > 0 && (
                                  <span className="text-xs font-mono text-muted-foreground">{folder.messages_count}</span>
                              )}
                          </button>
                      );
                  })}
        </div>
    );
}
