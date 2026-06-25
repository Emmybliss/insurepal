import TicketCard from '@/components/support/TicketCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Plus, Search, Ticket, User, XCircle } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface SupportTicket {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    status: 'new' | 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'policy' | 'general';
    requester: User;
    assignee?: User;
    unread_messages: number;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    closed_at?: string;
}

interface SupportTicketsIndexProps {
    tickets: SupportTicket[];
    filters: {
        status?: string;
        priority?: string;
        category?: string;
        assignee?: string;
    };
    stats: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
    };
    canCreateTicket: boolean;
    canManageTickets: boolean;
}

export default function SupportTicketsIndex({ tickets, filters, stats, canCreateTicket }: SupportTicketsIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [assigneeFilter, setAssigneeFilter] = useState(filters.assignee || '');

    // Ensure tickets is always an array
    const ticketsArray = Array.isArray(tickets) ? tickets : [];

    // Ensure stats has default values
    const safeStats = {
        total: stats?.total || 0,
        open: stats?.open || 0,
        in_progress: stats?.in_progress || 0,
        resolved: stats?.resolved || 0,
        closed: stats?.closed || 0,
    };

    const filteredTickets = ticketsArray.filter((ticket) => {
        const matchesSearch =
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.requester.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || statusFilter === 'all' || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || priorityFilter === 'all' || ticket.priority === priorityFilter;
        const matchesCategory = !categoryFilter || categoryFilter === 'all' || ticket.category === categoryFilter;
        const matchesAssignee = !assigneeFilter || ticket.assignee?.id.toString() === assigneeFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AppLayout>
            <Head title="Support Tickets" />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-tracking-light text-3xl font-bold">Support Tickets</h1>
                            <p className="mt-2 text-muted-foreground">Manage and track customer support requests</p>
                        </div>

                        {canCreateTicket && (
                            <Link href={route('support-tickets.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Ticket
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-5">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Ticket className="h-8 w-8 text-blue-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{safeStats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <AlertCircle className="h-8 w-8 text-blue-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Open</p>
                                    <p className="text-2xl font-bold text-blue-600">{safeStats.open}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-yellow-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">{safeStats.in_progress}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600">{safeStats.resolved}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <XCircle className="h-8 w-8 text-gray-500" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Closed</p>
                                    <p className="text-2xl font-bold text-gray-600">{safeStats.closed}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <Input
                                        placeholder="Search tickets..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center space-x-4">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priority</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="policy">Policy</SelectItem>
                                        <SelectItem value="general">General</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setPriorityFilter('all');
                                        setCategoryFilter('all');
                                        setAssigneeFilter('');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets List */}
                <div className="space-y-4">
                    {filteredTickets.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Ticket className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No tickets found</h3>
                                <p className="mb-4 text-gray-500">
                                    {searchTerm || statusFilter || priorityFilter || categoryFilter || assigneeFilter
                                        ? 'Try adjusting your filters to see more results.'
                                        : 'Get started by creating your first support ticket.'}
                                </p>
                                {canCreateTicket && (
                                    <Link href={route('support-tickets.create')}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Ticket
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredTickets.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onView={(ticket) => {
                                    // Handle view ticket
                                    console.log('View ticket:', ticket.id);
                                }}
                                onAssign={(ticket) => {
                                    // Handle assignment
                                    console.log('Assign ticket:', ticket.id);
                                }}
                                onStatusChange={(ticket) => {
                                    // Handle status change
                                    console.log('Change ticket status:', ticket.id);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
