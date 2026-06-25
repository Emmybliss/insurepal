import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { CommunicationParticipant, CommunicationThread } from '@/types/communication';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Paperclip, User } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    body: string;
    sender: User;
    created_at: string;
    attachments: Array<{
        id: number;
        original_name: string;
        url: string;
    }>;
}

interface Thread extends CommunicationThread {
    creator: User;
    assignee?: User | null;
    participants: Array<CommunicationParticipant & { user: User }>;
    messages: Message[];
}

interface Props {
    thread: Thread;
}

export default function InboxShow({ thread }: Props) {
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

    return (
        <AppLayout>
            <Head title={thread.subject || 'Message'} />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6">
                    <Link href={route('inbox.index')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Inbox
                        </Button>
                    </Link>
                </div>

                <div className="mb-6 rounded-lg border p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{thread.subject}</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className={getPriorityColor(thread.priority)}>
                                    {thread.priority}
                                </Badge>
                                <Badge variant="outline">{thread.status}</Badge>
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <p>Created: {formatDate(thread.created_at)}</p>
                            <p>Last activity: {formatDate(thread.last_message_at || thread.updated_at)}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="mb-2 text-sm font-medium text-gray-500">Participants</h3>
                        <div className="flex flex-wrap gap-2">
                            {thread.participants?.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center gap-2 rounded-full bg-gray-100  dark:bg-gray-800 px-3 py-1"
                                >
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{participant.user.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {participant.role}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {thread.messages?.map((message) => (
                        <div
                            key={message.id}
                            className="rounded-lg border  p-6"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full">
                                        <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{message.sender.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {message.sender.email}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {formatDate(message.created_at)}
                                </p>
                            </div>

                            <div className="prose max-w-none">
                                <p className="whitespace-pre-wrap">{message.body}</p>
                            </div>

                            {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Paperclip className="h-4 w-4" />
                                        Attachments ({message.attachments.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {message.attachments.map((attachment) => (
                                            <a
                                                key={attachment.id}
                                                href={route('attachments.download', attachment.id)}
                                                className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
                                            >
                                                <Paperclip className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">
                                                    {attachment.original_name}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}