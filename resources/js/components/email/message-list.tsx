import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Inbox, Paperclip, Star } from 'lucide-react';

interface EmailMessage {
    id: number;
    subject: string;
    from_address: string;
    from_name: string;
    body_text: string;
    received_at: string;
    is_read: boolean;
    is_flagged: boolean;
    account: { email: string; account_name: string };
    folder: { name: string; type: string };
    attachments_count?: number;
}

interface MessageListProps {
    messages: EmailMessage[];
    selectedId?: number | null;
    onSelect: (id: number) => void;
    isLoading?: boolean;
}

function MessageSkeleton() {
    return (
        <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
        </div>
    );
}

export function MessageList({ messages, selectedId, onSelect, isLoading }: MessageListProps) {
    if (isLoading) {
        return (
            <div className="divide-y">
                {Array.from({ length: 8 }).map((_, i) => (
                    <MessageSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Inbox className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No messages found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different folder or search query</p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {messages.map((message) => (
                <button
                    key={message.id}
                    onClick={() => onSelect(message.id)}
                    className={cn(
                        'w-full px-4 py-3 text-left transition-colors hover:bg-muted/50',
                        selectedId === message.id && 'bg-muted',
                        !message.is_read && 'bg-primary/5',
                    )}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm', !message.is_read && 'font-semibold')}>{message.from_name || message.from_address}</p>
                            <p className={cn('truncate text-sm', !message.is_read ? 'font-medium' : 'text-muted-foreground')}>
                                {message.subject || '(No subject)'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{message.body_text?.slice(0, 100)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {message.is_flagged && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                            {message.attachments_count && message.attachments_count > 0 ? (
                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                            ) : null}
                            <span className="text-xs whitespace-nowrap text-muted-foreground">
                                {formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
