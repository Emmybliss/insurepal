import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import type { CommunicationThread, CommunicationStats, CommunicationParticipant, CommunicationUser, CommunicationMessage } from '@/types/communication';
import { Archive, Eye, Inbox, Mail, MailOpen, MessageSquare, MoreHorizontal, Paperclip, PlusCircle, Search, Send, Trash2, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

type User = CommunicationUser;

interface Participant extends CommunicationParticipant {
    user: User;
}

interface Message extends CommunicationMessage {
    sender?: User;
}

interface Thread extends CommunicationThread {
    creator: User;
    participants: Participant[];
    latestMessage?: Message | null;
}

interface Props {
    threads: {
        data: Thread[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    folder: string;
    stats: CommunicationStats;
    filters: {
        search?: string;
    };
}

export default function InboxIndex({ threads, folder, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedThreads, setSelectedThreads] = useState<number[]>([]);

    const handleSearch = () => {
        router.get(route('inbox.index'), { search, folder }, { preserveState: true, replace: true });
    };

    const switchFolder = (newFolder: string) => {
        router.get(route('inbox.index'), { folder: newFolder, search }, { preserveState: true, replace: true });
    };

    const handleSelectThread = (threadId: number) => {
        setSelectedThreads((prev) => (prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId]));
    };

    const handleSelectAll = () => {
        if (selectedThreads.length === threads.data.length) {
            setSelectedThreads([]);
        } else {
            setSelectedThreads(threads.data.map((thread) => thread.id));
        }
    };

    const markAsRead = () => {
        if (selectedThreads.length === 0) return;

        router.post(
            route('inbox.bulk-action'),
            { thread_ids: selectedThreads, action: 'read' },
            { onSuccess: () => setSelectedThreads([]) }
        );
    };

    const markAsUnread = () => {
        if (selectedThreads.length === 0) return;

        router.post(
            route('inbox.bulk-action'),
            { thread_ids: selectedThreads, action: 'unread' },
            { onSuccess: () => setSelectedThreads([]) }
        );
    };

    const bulkDelete = () => {
        if (selectedThreads.length === 0) return;

        if (confirm('Are you sure you want to delete the selected messages?')) {
            router.post(
                route('inbox.bulk-action'),
                { thread_ids: selectedThreads, action: 'delete' },
                { onSuccess: () => setSelectedThreads([]) }
            );
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'normal':
                return 'bg-blue-100 text-blue-800';
            case 'low':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRecipients = (participants: Participant[]) => {
        return participants
            .filter((p) => p.role !== 'sender')
            .map((p) => p.user.name)
            .join(', ');
    };

    return (
        <AppLayout>
            <Head title="Inbox" />

            <div className="flex h-screen">
                <div className="w-64 border-r p-4">
                    <div className="mb-6">
                        <Link href={route('inbox.create')}>
                            <Button className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Compose
                            </Button>
                        </Link>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => switchFolder('inbox')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                folder === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Inbox className="mr-3 h-5 w-5" />
                                Inbox
                            </div>
                            {stats.by_mode?.email > 0 && <Badge variant="secondary">{stats.by_mode.email}</Badge>}
                        </button>

                        <button
                            onClick={() => switchFolder('unread')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                folder === 'unread' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Mail className="mr-3 h-5 w-5" />
                                Unread
                            </div>
                            {stats.unread > 0 && <Badge variant="secondary">{stats.unread}</Badge>}
                        </button>

                        <button
                            onClick={() => switchFolder('sent')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                folder === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Send className="mr-3 h-5 w-5" />
                                Sent
                            </div>
                        </button>

                        <button
                            onClick={() => switchFolder('drafts')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                folder === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Archive className="mr-3 h-5 w-5" />
                                Drafts
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="flex flex-1 flex-col">
                    <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold capitalize">{folder}</h1>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <Input
                                            placeholder="Search messages..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="w-64 pl-10"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} size="sm">
                                        Search
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {selectedThreads.length > 0 && (
                            <div className="mt-4 flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                    {selectedThreads.length === threads.data.length ? 'Deselect All' : 'Select All'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={markAsRead}>
                                    <MailOpen className="mr-2 h-4 w-4" />
                                    Mark Read
                                </Button>
                                <Button variant="outline" size="sm" onClick={markAsUnread}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Mark Unread
                                </Button>
                                <Button variant="outline" size="sm" onClick={bulkDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                                <span className="text-sm text-gray-500">{selectedThreads.length} selected</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {threads.data.length === 0 ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {folder === 'drafts' ? "You don't have any draft messages." : `Your ${folder} is empty.`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {threads.data.map((thread) => {
                                    const isSelected = selectedThreads.includes(thread.id);
                                    const unread = folder === 'sent' ? false : thread.unread_count ? thread.unread_count > 0 : false;

                                    return (
                                        <div
                                            key={thread.id}
                                            className={`flex cursor-pointer items-center p-4 hover:bg-accent ${
                                                isSelected ? 'bg-blue-50' : ''
                                            } ${unread ? 'bg-blue-25' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectThread(thread.id)}
                                                className="mr-4"
                                            />

                                            <div className="min-w-0 flex-1" onClick={() => router.visit(route('inbox.show', thread.id))}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <UserIcon className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <p
                                                                    className={`text-sm ${unread ? 'font-semibold' : 'font-medium'} truncate text-gray-900`}
                                                                >
                                                                    {folder === 'sent'
                                                                        ? `To: ${getRecipients(thread.participants || [])}`
                                                                        : thread.creator?.name}
                                                                </p>
                                                                <Badge variant="secondary" className={getPriorityColor(thread.priority)}>
                                                                    {thread.priority}
                                                                </Badge>
                                                                {thread.latestMessage && <Paperclip className="h-4 w-4 text-gray-400" />}
                                                            </div>
                                                            <p
                                                                className={`text-sm ${unread ? 'font-medium' : 'font-normal'} truncate text-gray-600`}
                                                            >
                                                                {thread.subject}
                                                            </p>
                                                            {thread.latestMessage && (
                                                                <p className="truncate text-sm text-gray-500">
                                                                    {thread.latestMessage.body.substring(0, 100)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(thread.last_message_at || thread.created_at)}
                                                            </p>
                                                            {unread && <div className="mt-1 ml-auto h-2 w-2 rounded-full bg-blue-500"></div>}
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('inbox.show', thread.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to delete this message?')) {
                                                                            router.delete(route('inbox.destroy', thread.id));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {threads.last_page > 1 && (
                        <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    {threads.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(route('inbox.index'), {
                                                    ...filters,
                                                    folder,
                                                    page: threads.current_page - 1,
                                                })
                                            }
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {threads.current_page < threads.last_page && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(route('inbox.index'), {
                                                    ...filters,
                                                    folder,
                                                    page: threads.current_page + 1,
                                                })
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{(threads.current_page - 1) * threads.per_page + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(threads.current_page * threads.per_page, threads.total)}</span> of{' '}
                                            <span className="font-medium">{threads.total}</span> results
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}