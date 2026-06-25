import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, Eye, Inbox, Mail, MailOpen, MessageSquare, MoreHorizontal, Paperclip, PlusCircle, Search, Send, Trash2, User } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface MessageRecipient {
    id: number;
    recipient_id: number;
    read_at?: string;
    recipient: User;
}

interface Message {
    id: number;
    subject: string;
    body: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    sender_id: number;
    sent_at?: string;
    attachments?: Array<{
        name: string;
        path: string;
        size: number;
        type: string;
    }>;
    created_at: string;
    sender: User;
    message_recipients: MessageRecipient[];
    is_read?: boolean;
    is_draft?: boolean;
}

interface Props {
    messages: {
        data: Message[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    currentFolder: string;
    counts: {
        inbox: number;
        sent: number;
        drafts: number;
        unread: number;
    };
    filters: {
        search?: string;
    };
}

export default function MessagesIndex({ messages, currentFolder, counts, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMessages, setSelectedMessages] = useState<number[]>([]);

    const handleSearch = () => {
        router.get(route('messages.index'), { search, folder: currentFolder }, { preserveState: true, replace: true });
    };

    const switchFolder = (folder: string) => {
        router.get(route('messages.index'), { folder, search }, { preserveState: true, replace: true });
    };

    const handleSelectMessage = (messageId: number) => {
        setSelectedMessages((prev) => (prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]));
    };

    const handleSelectAll = () => {
        if (selectedMessages.length === messages.data.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(messages.data.map((message) => message.id));
        }
    };

    const markAsRead = () => {
        if (selectedMessages.length === 0) return;

        router.post(
            route('messages.mark-as-read'),
            {
                message_ids: selectedMessages,
            },
            {
                onSuccess: () => setSelectedMessages([]),
            },
        );
    };

    const markAsUnread = () => {
        if (selectedMessages.length === 0) return;

        router.post(
            route('messages.mark-as-unread'),
            {
                message_ids: selectedMessages,
            },
            {
                onSuccess: () => setSelectedMessages([]),
            },
        );
    };

    const bulkDelete = () => {
        if (selectedMessages.length === 0) return;

        if (confirm('Are you sure you want to delete the selected messages?')) {
            router.post(
                route('messages.bulk-delete'),
                {
                    message_ids: selectedMessages,
                },
                {
                    onSuccess: () => setSelectedMessages([]),
                },
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

    const getRecipients = (messageRecipients: MessageRecipient[]) => {
        return messageRecipients.map((mr) => mr.recipient.name).join(', ');
    };

    return (
        <AppLayout>
            <Head title="Messages" />

            <div className="flex h-screen">
                {/* Sidebar */}
                <div className="w-64 border-r p-4">
                    <div className="mb-6">
                        <Link href={route('messages.create')}>
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
                                currentFolder === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Inbox className="mr-3 h-5 w-5" />
                                Inbox
                            </div>
                            {counts.inbox > 0 && <Badge variant="secondary">{counts.inbox}</Badge>}
                        </button>

                        <button
                            onClick={() => switchFolder('unread')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                currentFolder === 'unread' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Mail className="mr-3 h-5 w-5" />
                                Unread
                            </div>
                            {counts.unread > 0 && <Badge variant="secondary">{counts.unread}</Badge>}
                        </button>

                        <button
                            onClick={() => switchFolder('sent')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                currentFolder === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Send className="mr-3 h-5 w-5" />
                                Sent
                            </div>
                            {counts.sent > 0 && <Badge variant="secondary">{counts.sent}</Badge>}
                        </button>

                        <button
                            onClick={() => switchFolder('drafts')}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 ${
                                currentFolder === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <div className="flex items-center">
                                <Archive className="mr-3 h-5 w-5" />
                                Drafts
                            </div>
                            {counts.drafts > 0 && <Badge variant="secondary">{counts.drafts}</Badge>}
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col">
                    {/* Header */}
                    <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold capitalize">{currentFolder}</h1>

                            <div className="flex items-center space-x-4">
                                {/* Search */}
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

                        {/* Bulk Actions */}
                        {selectedMessages.length > 0 && (
                            <div className="mt-4 flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                    {selectedMessages.length === messages.data.length ? 'Deselect All' : 'Select All'}
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
                                <span className="text-sm text-gray-500">{selectedMessages.length} selected</span>
                            </div>
                        )}
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-auto">
                        {messages.data.length === 0 ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {currentFolder === 'drafts' ? "You don't have any draft messages." : `Your ${currentFolder} is empty.`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {messages.data.map((message) => {
                                    const isSelected = selectedMessages.includes(message.id);
                                    const isUnread = currentFolder === 'sent' ? false : !message.is_read;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex cursor-pointer items-center p-4 hover:bg-accent ${
                                                isSelected ? 'bg-blue-50' : ''
                                            } ${isUnread ? 'bg-blue-25' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectMessage(message.id)}
                                                className="mr-4"
                                            />

                                            <div className="min-w-0 flex-1" onClick={() => router.visit(route('messages.show', message.id))}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <User className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <p
                                                                    className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'} truncate text-gray-900`}
                                                                >
                                                                    {currentFolder === 'sent'
                                                                        ? `To: ${getRecipients(message.message_recipients)}`
                                                                        : message.sender.name}
                                                                </p>
                                                                <Badge variant="secondary" className={getPriorityColor(message.priority)}>
                                                                    {message.priority}
                                                                </Badge>
                                                                {message.attachments && message.attachments.length > 0 && (
                                                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                                                )}
                                                                {message.is_draft && <Badge variant="outline">Draft</Badge>}
                                                            </div>
                                                            <p
                                                                className={`text-sm ${isUnread ? 'font-medium' : 'font-normal'} truncate text-gray-600`}
                                                            >
                                                                {message.subject}
                                                            </p>
                                                            <p className="truncate text-sm text-gray-500">{message.body.substring(0, 100)}...</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(message.sent_at || message.created_at)}
                                                            </p>
                                                            {isUnread && <div className="mt-1 ml-auto h-2 w-2 rounded-full bg-blue-500"></div>}
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('messages.show', message.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                {message.is_draft && (
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={route('messages.edit', message.id)}>
                                                                            <MessageSquare className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to delete this message?')) {
                                                                            router.delete(route('messages.destroy', message.id));
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

                    {/* Pagination */}
                    {messages.last_page > 1 && (
                        <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    {messages.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(route('messages.index'), {
                                                    ...filters,
                                                    folder: currentFolder,
                                                    page: messages.current_page - 1,
                                                })
                                            }
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {messages.current_page < messages.last_page && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.get(route('messages.index'), {
                                                    ...filters,
                                                    folder: currentFolder,
                                                    page: messages.current_page + 1,
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
                                            Showing <span className="font-medium">{(messages.current_page - 1) * messages.per_page + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(messages.current_page * messages.per_page, messages.total)}</span>{' '}
                                            of <span className="font-medium">{messages.total}</span> results
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {Array.from({ length: Math.min(5, messages.last_page) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={page === messages.current_page ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(route('messages.index'), {
                                                            ...filters,
                                                            folder: currentFolder,
                                                            page,
                                                        })
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
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
