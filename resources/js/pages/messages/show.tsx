import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Download, Edit, Mail, MoreHorizontal, Paperclip, Reply, Trash2, User } from 'lucide-react';

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
    message: Message;
}

export default function ShowMessage({ message }: Props) {
    const currentUser = message.sender_id === 1; // This should come from auth context
    const isOwnMessage = currentUser;

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this message?')) {
            router.delete(route('messages.destroy', message.id));
        }
    };

    const handleDownloadAttachment = (index: number) => {
        window.open(route('messages.download-attachment', { message: message.id, index }), '_blank');
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getRecipients = () => {
        return message.message_recipients.map((mr) => mr.recipient.name).join(', ');
    };

    return (
        <AppLayout>
            <Head title={`Message: ${message.subject}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('messages.index')} className="flex items-center text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Message Details</h1>
                            <p className="text-gray-600">{message.is_draft ? 'Draft message' : 'Received message'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {message.is_draft && isOwnMessage && (
                            <Button onClick={() => router.post(route('messages.send', message.id))}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Now
                            </Button>
                        )}

                        {!message.is_draft && !isOwnMessage && (
                            <Button
                                onClick={() =>
                                    router.visit(route('messages.create'), {
                                        data: { reply_to: message.id },
                                    })
                                }
                            >
                                <Reply className="mr-2 h-4 w-4" />
                                Reply
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {message.is_draft && isOwnMessage && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('messages.edit', message.id)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Draft
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="space-y-4">
                            {/* Message Status and Priority */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Badge variant="secondary" className={getPriorityColor(message.priority)}>
                                        {message.priority} priority
                                    </Badge>
                                    {message.is_draft && <Badge variant="outline">Draft</Badge>}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {formatDate(message.sent_at || message.created_at)}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{message.subject}</h2>
                            </div>

                            {/* Sender and Recipients */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <User className="h-8 w-8 text-gray-400" />
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">From:</span>
                                            <span className="text-sm text-gray-600">{message.sender.name}</span>
                                            <span className="text-sm text-gray-500">({message.sender.email})</span>
                                        </div>
                                        {message.message_recipients.length > 0 && (
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">To:</span>
                                                <span className="text-sm text-gray-600">{getRecipients()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Paperclip className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {message.attachments.map((attachment, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 hover:bg-gray-100"
                                            >
                                                <div className="flex min-w-0 items-center space-x-3">
                                                    <Paperclip className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-gray-900">{attachment.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleDownloadAttachment(index)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        {/* Message Body */}
                        <div className="prose max-w-none">
                            <div className="leading-relaxed whitespace-pre-wrap text-gray-900">{message.body}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recipients Read Status */}
                {message.message_recipients.length > 0 && !message.is_draft && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Mail className="h-5 w-5" />
                                <span>Delivery Status</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {message.message_recipients.map((recipient) => (
                                    <div key={recipient.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <User className="h-6 w-6 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{recipient.recipient.name}</p>
                                                <p className="text-xs text-gray-500">{recipient.recipient.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {recipient.read_at ? (
                                                <div>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        Read
                                                    </Badge>
                                                    <p className="mt-1 text-xs text-gray-500">{formatDate(recipient.read_at)}</p>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                    Unread
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                {!message.is_draft && !isOwnMessage && (
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={() =>
                                router.visit(route('messages.create'), {
                                    data: { reply_to: message.id },
                                })
                            }
                        >
                            <Reply className="mr-2 h-4 w-4" />
                            Reply to this message
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
