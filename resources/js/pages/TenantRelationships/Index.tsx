import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, CheckCircle, Clock, Search, Trash2, UserPlus, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    company_name: string;
    type: string;
    email: string;
    city?: string;
    state?: string;
    country?: string;
}

interface TenantRelationship {
    id: number;
    requester_id: number;
    requested_id: number;
    status: 'pending' | 'accepted' | 'declined' | 'removed';
    relationship_type: string;
    request_message?: string;
    decline_reason?: string;
    created_at: string;
    accepted_at?: string;
    declined_at?: string;
    removed_at?: string;
    requester: Tenant;
    requested: Tenant;
}

interface Props {
    relationships: {
        data: TenantRelationship[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    counts: {
        all: number;
        sent: number;
        received: number;
        pending: number;
        accepted: number;
    };
    currentTab: string;
}

export default function Index({ relationships, counts, currentTab }: Props) {
    const [selectedTab, setSelectedTab] = useState(currentTab || 'all');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
        router.get(route('tenant-relationships.index', { tab }), {}, { preserveState: true });
    };

    const handleAccept = (relationshipId: number) => {
        if (confirm('Are you sure you want to accept this connection request?')) {
            setProcessingId(relationshipId);
            router.post(
                route('tenant-relationships.accept', relationshipId),
                {},
                {
                    onFinish: () => setProcessingId(null),
                },
            );
        }
    };

    const handleDecline = (relationshipId: number) => {
        const reason = prompt('Optional: Provide a reason for declining this request');
        if (reason !== null) {
            setProcessingId(relationshipId);
            router.post(
                route('tenant-relationships.decline', relationshipId),
                { decline_reason: reason },
                {
                    onFinish: () => setProcessingId(null),
                },
            );
        }
    };

    const handleRemove = (relationshipId: number) => {
        if (confirm('Are you sure you want to remove this connection? This action cannot be undone.')) {
            setProcessingId(relationshipId);
            router.delete(route('tenant-relationships.destroy', relationshipId), {
                onFinish: () => setProcessingId(null),
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'outline' as const, icon: Clock, className: 'border-yellow-500 text-yellow-700' },
            accepted: { variant: 'outline' as const, icon: CheckCircle, className: 'border-green-500 text-green-700' },
            declined: { variant: 'outline' as const, icon: XCircle, className: 'border-red-500 text-red-700' },
            removed: { variant: 'outline' as const, icon: Trash2, className: 'border-gray-500 text-gray-700' },
        };

        const config = variants[status as keyof typeof variants];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <Icon className="mr-1 h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getOtherTenant = (relationship: TenantRelationship, currentTenantId: number): Tenant => {
        return relationship.requester_id === currentTenantId ? relationship.requested : relationship.requester;
    };

    return (
        <AppLayout>
            <Head title="Business Connections" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Business Connections</h1>
                        <p className="mt-2 text-gray-600">Manage your partnerships with brokers and underwriters</p>
                    </div>
                    <Link href={route('tenant-relationships.discover')}>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Discover Partners
                        </Button>
                    </Link>
                </div>

                {/* Tabs */}
                <Tabs value={selectedTab} onValueChange={handleTabChange}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="all">
                            All{' '}
                            <Badge className="ml-2" variant="secondary">
                                {counts.all}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            Sent{' '}
                            <Badge className="ml-2" variant="secondary">
                                {counts.sent}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="received">
                            Received{' '}
                            <Badge className="ml-2" variant="secondary">
                                {counts.received}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pending">
                            Pending{' '}
                            <Badge className="ml-2" variant="secondary">
                                {counts.pending}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="accepted">
                            Active{' '}
                            <Badge className="ml-2" variant="secondary">
                                {counts.accepted}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedTab}>
                        {relationships.data.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Search className="mb-4 h-12 w-12 text-gray-400" />
                                    <h3 className="mb-2 text-lg font-semibold">No relationships found</h3>
                                    <p className="mb-4 text-gray-600">
                                        {selectedTab === 'all' ? 'You have no business Connections yet.' : `No ${selectedTab} relationships found.`}
                                    </p>
                                    <Link href={route('tenant-relationships.discover')}>
                                        <Button>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Discover Partners
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {relationships.data.map((relationship) => {
                                    const otherTenant = getOtherTenant(relationship, relationship.requester_id);
                                    const isRequester = relationship.requester_id === relationship.requester_id;
                                    const isPending = relationship.status === 'pending';
                                    const isAccepted = relationship.status === 'accepted';

                                    return (
                                        <Card key={relationship.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                            <Building2 className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl">{otherTenant.company_name || otherTenant.name}</CardTitle>
                                                            <CardDescription>
                                                                {otherTenant.type === 'broker' ? 'Broker' : 'Underwriter'} • {otherTenant.city},{' '}
                                                                {otherTenant.state || otherTenant.country}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(relationship.status)}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {relationship.request_message && (
                                                    <div className="mb-4 rounded-lg bg-gray-50 p-3">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Message:</strong> {relationship.request_message}
                                                        </p>
                                                    </div>
                                                )}

                                                {relationship.decline_reason && (
                                                    <div className="mb-4 rounded-lg bg-red-50 p-3">
                                                        <p className="text-sm text-red-700">
                                                            <strong>Decline Reason:</strong> {relationship.decline_reason}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-600">
                                                        {isRequester ? 'Sent to' : 'Received from'} {otherTenant.name} •{' '}
                                                        {new Date(relationship.created_at).toLocaleDateString()}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {isPending && !isRequester && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleAccept(relationship.id)}
                                                                    disabled={processingId === relationship.id}
                                                                >
                                                                    <CheckCircle className="mr-1 h-4 w-4" />
                                                                    Accept
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleDecline(relationship.id)}
                                                                    disabled={processingId === relationship.id}
                                                                >
                                                                    <XCircle className="mr-1 h-4 w-4" />
                                                                    Decline
                                                                </Button>
                                                            </>
                                                        )}

                                                        {isPending && isRequester && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRemove(relationship.id)}
                                                                disabled={processingId === relationship.id}
                                                            >
                                                                <Trash2 className="mr-1 h-4 w-4" />
                                                                Cancel Request
                                                            </Button>
                                                        )}

                                                        {isAccepted && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleRemove(relationship.id)}
                                                                disabled={processingId === relationship.id}
                                                            >
                                                                <Trash2 className="mr-1 h-4 w-4" />
                                                                Remove Partnership
                                                            </Button>
                                                        )}

                                                        <Link href={route('tenant-relationships.show', relationship.id)}>
                                                            <Button size="sm" variant="outline">
                                                                View Details
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {relationships.last_page > 1 && (
                            <div className="mt-6 flex justify-center gap-2">
                                {Array.from({ length: relationships.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === relationships.current_page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => router.get(route('tenant-relationships.index', { tab: selectedTab, page }))}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
