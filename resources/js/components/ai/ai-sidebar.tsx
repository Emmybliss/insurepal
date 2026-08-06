import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Copy,
    Edit2,
    MoreHorizontal,
    MessageSquare,
    Pin,
    Plus,
    Search,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

export interface Conversation {
    id: number;
    title: string;
    created_at: string;
    updated_at?: string;
    is_pinned?: boolean;
}

interface AISidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    activeId: number | null;
    onSelectConversation: (id: number) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: number) => void;
    onRenameConversation: (id: number, newTitle: string) => void;
    onPinConversation: (id: number, pinned: boolean) => void;
    onDuplicateConversation: (id: number) => void;
    isLoading?: boolean;
}

export function AISidebar({
    isOpen,
    onClose,
    conversations,
    activeId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    onRenameConversation,
    onPinConversation,
    onDuplicateConversation,
    isLoading = false,
}: AISidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    // Filter conversations by search query
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((c) => c.title.toLowerCase().includes(q));
    }, [conversations, searchQuery]);

    // Group history into categories: Pinned, Today, Yesterday, Last 7 Days, Older
    const groups = useMemo(() => {
        const pinned: Conversation[] = [];
        const today: Conversation[] = [];
        const yesterday: Conversation[] = [];
        const last7Days: Conversation[] = [];
        const older: Conversation[] = [];

        const now = new Date();
        const todayStr = now.toDateString();

        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toDateString();

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        filtered.forEach((conv) => {
            if (conv.is_pinned) {
                pinned.push(conv);
                return;
            }

            const date = new Date(conv.updated_at || conv.created_at);
            const dateStr = date.toDateString();

            if (dateStr === todayStr) {
                today.push(conv);
            } else if (dateStr === yesterdayStr) {
                yesterday.push(conv);
            } else if (date >= sevenDaysAgo) {
                last7Days.push(conv);
            } else {
                older.push(conv);
            }
        });

        return [
            { label: 'Pinned', items: pinned },
            { label: 'Today', items: today },
            { label: 'Yesterday', items: yesterday },
            { label: 'Previous 7 Days', items: last7Days },
            { label: 'Older', items: older },
        ].filter((g) => g.items.length > 0);
    }, [filtered]);

    const handleStartRename = (conv: Conversation, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingId(conv.id);
        setEditingTitle(conv.title);
    };

    const handleSaveRename = (id: number) => {
        if (editingTitle.trim()) {
            onRenameConversation(id, editingTitle.trim());
        }
        setEditingId(null);
    };

    if (!isOpen) return null;

    return (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border/50 bg-sidebar/95 backdrop-blur-xl transition-all md:relative md:z-10">
            {/* Header / New Chat */}
            <div className="flex flex-col gap-2.5 p-3.5 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20">
                            IP
                        </div>
                        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">InsurePal AI</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    onClick={onNewChat}
                    className="w-full justify-start gap-2 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-semibold">New Chat</span>
                </Button>

                {/* Search Box */}
                <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 rounded-lg border-border/60 bg-sidebar-accent/50 pl-8 text-xs placeholder:text-muted-foreground/70 focus-visible:ring-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Conversation Group List */}
            <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3 text-xs">
                {isLoading ? (
                    <div className="space-y-2 p-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full rounded-lg" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="px-3 py-8 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
                        <p className="font-medium">No conversations found</p>
                        <p className="text-[11px] opacity-70">Start a new chat to ask InsurePal AI</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                {group.label}
                            </div>
                            {group.items.map((conv) => {
                                const isActive = activeId === conv.id;
                                const isEditing = editingId === conv.id;

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => !isEditing && onSelectConversation(conv.id)}
                                        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-xs'
                                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate pr-6">
                                            {conv.is_pinned ? (
                                                <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500/20" />
                                            ) : (
                                                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                                            )}

                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveRename(conv.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    onBlur={() => handleSaveRename(conv.id)}
                                                    autoFocus
                                                    className="w-full bg-background px-1 py-0.5 text-xs rounded border border-primary outline-hidden"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="truncate text-xs leading-tight">{conv.title || 'Untitled Conversation'}</span>
                                            )}
                                        </div>

                                        {/* Action Dropdown Menu */}
                                        {!isEditing && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent text-muted-foreground"
                                                    >
                                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 text-xs">
                                                    <DropdownMenuItem onClick={(e) => handleStartRename(conv, e as any)}>
                                                        <Edit2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onPinConversation(conv.id, !conv.is_pinned)}>
                                                        <Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                        {conv.is_pinned ? 'Unpin' : 'Pin to top'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onDuplicateConversation(conv.id)}>
                                                        <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteConversation(conv.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Context Token Usage */}
            <div className="border-t border-border/40 p-3 bg-sidebar-accent/20">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            AI Memory
                        </span>
                        <span>14.2k / 128k tokens</span>
                    </div>
                    <Progress value={11} className="h-1.5 bg-muted" />
                </div>
            </div>
        </aside>
    );
}
