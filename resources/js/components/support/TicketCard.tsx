import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, MessageSquare, MoreVertical, Ticket, User, XCircle } from 'lucide-react';
import TicketStatusBadge from './TicketStatusBadge';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface Ticket {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    status: 'new' | 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'policy' | 'general';
    requester: User;
    assignee?: User;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    closed_at?: string;
    unread_messages?: number;
}

interface TicketCardProps {
    ticket: Ticket;
    onView: (ticket: Ticket) => void;
    onAssign?: (ticket: Ticket) => void;
    onStatusChange?: (ticket: Ticket) => void;
    showActions?: boolean;
    className?: string;
}

const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
};

const priorityIcons = {
    low: Clock,
    medium: AlertCircle,
    high: AlertCircle,
    urgent: AlertCircle,
};

const categoryColors = {
    technical: 'bg-purple-100 text-purple-800',
    billing: 'bg-green-100 text-green-800',
    policy: 'bg-blue-100 text-blue-800',
    general: 'bg-gray-100 text-gray-800',
};

export default function TicketCard({ ticket, onView, onAssign, onStatusChange, showActions = true, className = '' }: TicketCardProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getPriorityIcon = () => {
        const Icon = priorityIcons[ticket.priority];
        return <Icon className="h-3 w-3" />;
    };

    const getStatusIcon = () => {
        switch (ticket.status) {
            case 'new':
                return <Ticket className="h-4 w-4 text-blue-500" />;
            case 'open':
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'in_progress':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'waiting_customer':
                return <User className="h-4 w-4 text-purple-500" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'closed':
                return <XCircle className="h-4 w-4 text-gray-500" />;
            default:
                return <Ticket className="h-4 w-4" />;
        }
    };

    const formatDescription = (description: string) => {
        const maxLength = 100;
        return description.length > maxLength ? `${description.substring(0, maxLength)}...` : description;
    };

    return (
        <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${className}`} onClick={() => onView(ticket)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.ticket_number}</h3>
                            <p className="text-xs text-gray-500">{ticket.subject}</p>
                        </div>
                    </div>
                    {showActions && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Description */}
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{formatDescription(ticket.description)}</p>

                {/* Badges */}
                <div className="mb-3 flex flex-wrap gap-2">
                    <TicketStatusBadge status={ticket.status} />
                    <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                        <span className="flex items-center space-x-1">
                            {getPriorityIcon()}
                            <span>{ticket.priority}</span>
                        </span>
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${categoryColors[ticket.category]}`}>
                        {ticket.category}
                    </Badge>
                </div>

                {/* Assignee */}
                {ticket.assignee && (
                    <div className="mb-3 flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={ticket.assignee.avatar} />
                            <AvatarFallback className="text-xs">{getInitials(ticket.assignee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-gray-900 dark:text-white">Assigned to {ticket.assignee.name}</div>
                        </div>
                    </div>
                )}

                {/* Requester */}
                <div className="mb-3 flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.requester.avatar} />
                        <AvatarFallback className="text-xs">{getInitials(ticket.requester.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500">Requested by {ticket.requester.name}</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                            {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {ticket.unread_messages && ticket.unread_messages > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {ticket.unread_messages} new
                            </Badge>
                        )}
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>Chat</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {showActions && (
                    <div className="mt-3 flex items-center space-x-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                        {onAssign && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAssign(ticket);
                                }}
                            >
                                Assign
                            </Button>
                        )}
                        {onStatusChange && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(ticket);
                                }}
                            >
                                Change Status
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
