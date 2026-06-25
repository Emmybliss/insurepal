import AssignmentDropdown from '@/components/support/AssignmentDropdown';
import TicketStatusBadge from '@/components/support/TicketStatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    Mail,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Phone,
    Send,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    is_online?: boolean;
    last_seen?: string;
}

interface SupportTicket {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
    requester: User;
    assignee?: User;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    closed_at?: string;
    metadata?: Record<string, any>;
}

interface TicketMessage {
    id: number;
    body: string;
    sender: User;
    is_internal: boolean;
    attachments?: Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        url: string;
    }>;
    created_at: string;
    updated_at: string;
}

interface SupportTicketShowProps {
    ticket: SupportTicket;
    messages: TicketMessage[];
    currentUser: User;
    canManageTicket: boolean;
    canAssignTicket: boolean;
    canResolveTicket: boolean;
    canCloseTicket: boolean;
    canReopenTicket: boolean;
}

export default function SupportTicketShow({
    ticket,
    messages,
    canManageTicket,
    canAssignTicket,
    canResolveTicket,
    canCloseTicket,
    canReopenTicket,
}: SupportTicketShowProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [showActions, setShowActions] = useState(false);

    // Show flash success message (e.g., after creating a ticket)
    const { props } = usePage<{ flash?: { success?: string } }>();
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash?.success]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case 'in_progress':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'closed':
                return <XCircle className="h-4 w-4 text-gray-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'technical':
                return <AlertCircle className="h-4 w-4" />;
            case 'billing':
                return <User className="h-4 w-4" />;
            case 'general':
                return <MessageSquare className="h-4 w-4" />;
            case 'feature_request':
                return <Edit className="h-4 w-4" />;
            case 'bug_report':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        // TODO: Implement message sending
        console.log('Sending message:', newMessage, 'Internal:', isInternal);
        setNewMessage('');
    };

    const handleStatusChange = (status: string) => {
        // TODO: Implement status change
        console.log('Changing status to:', status);
    };

    const handleAssign = (assigneeId: number | null) => {
        // TODO: Implement assignment
        console.log('Assigning to:', assigneeId);
    };

    return (
        <>
            <Head title={`${ticket.ticket_number} - ${ticket.subject}`} />

            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>

                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="mb-2 flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_number}</h1>
                                    <TicketStatusBadge status={ticket.status} />
                                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                                </div>
                                <h2 className="mb-2 text-xl font-semibold text-gray-800">{ticket.subject}</h2>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        {getCategoryIcon(ticket.category)}
                                        <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created {formatDate(ticket.created_at)}</span>
                                    </div>
                                    {ticket.assignee && (
                                        <div className="flex items-center space-x-1">
                                            <User className="h-4 w-4" />
                                            <span>Assigned to {ticket.assignee.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Ticket Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5" />
                                        <span>Description</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose max-w-none">
                                        <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Messages */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5" />
                                        <span>Messages ({messages.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {messages.length === 0 ? (
                                            <div className="py-8 text-center text-gray-500">
                                                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                                <p>No messages yet</p>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div key={message.id} className="flex space-x-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={message.sender.avatar} />
                                                        <AvatarFallback>{message.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div
                                                            className={cn(
                                                                'rounded-lg p-3',
                                                                message.is_internal ? 'border border-yellow-200 bg-yellow-50' : 'bg-gray-50',
                                                            )}
                                                        >
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="font-medium text-gray-900">{message.sender.name}</span>
                                                                    {message.is_internal && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Internal
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
                                                            </div>
                                                            <p className="whitespace-pre-wrap text-gray-700">{message.body}</p>
                                                            {message.attachments && message.attachments.length > 0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {message.attachments.map((attachment) => (
                                                                        <div
                                                                            key={attachment.id}
                                                                            className="flex items-center space-x-2 rounded border bg-white p-2"
                                                                        >
                                                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                                                            <span className="text-sm text-gray-700">{attachment.name}</span>
                                                                            <span className="text-xs text-gray-500">
                                                                                ({(attachment.size / 1024).toFixed(1)} KB)
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Add Message */}
                            {ticket.status !== 'closed' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Add Message</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_internal"
                                                    checked={isInternal}
                                                    onChange={(e) => setIsInternal(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                <Label htmlFor="is_internal" className="text-sm">
                                                    Internal note (not visible to customer)
                                                </Label>
                                            </div>

                                            <Textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type your message..."
                                                rows={4}
                                            />

                                            <div className="flex items-center justify-between">
                                                <Button variant="outline" size="sm">
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    Attach File
                                                </Button>

                                                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Ticket Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ticket Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            {getStatusIcon(ticket.status)}
                                            <span className="text-sm text-gray-900 capitalize">{ticket.status.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Priority</Label>
                                        <div className="mt-1">
                                            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Category</Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            {getCategoryIcon(ticket.category)}
                                            <span className="text-sm text-gray-900 capitalize">{ticket.category.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Created</Label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(ticket.created_at)}</p>
                                    </div>

                                    {ticket.resolved_at && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Resolved</Label>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(ticket.resolved_at)}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Requester Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requester</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={ticket.requester.avatar} />
                                            <AvatarFallback>{ticket.requester.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">{ticket.requester.name}</p>
                                            <p className="text-sm text-gray-500">{ticket.requester.email}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Phone className="mr-2 h-4 w-4" />
                                            Call
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Email
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assignment */}
                            {canAssignTicket && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Assignment</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <AssignmentDropdown users={[]} selectedUserId={ticket.assignee?.id} onSelect={handleAssign} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            {canManageTicket && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {ticket.status === 'open' && (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusChange('in_progress')}>
                                                <Clock className="mr-2 h-4 w-4" />
                                                Start Progress
                                            </Button>
                                        )}

                                        {ticket.status === 'in_progress' && canResolveTicket && (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusChange('resolved')}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Resolve
                                            </Button>
                                        )}

                                        {ticket.status === 'resolved' && canCloseTicket && (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusChange('closed')}>
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Close
                                            </Button>
                                        )}

                                        {ticket.status === 'closed' && canReopenTicket && (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusChange('open')}>
                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                Reopen
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
