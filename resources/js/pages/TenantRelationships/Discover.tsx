import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, CheckCircle, Clock, Mail, MapPin, Phone, Search, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    company_name: string;
    type: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    license_number?: string;
    relationship_status?: 'pending' | 'accepted' | 'declined' | 'removed' | null;
}

interface Props {
    tenants: {
        data: Tenant[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        type?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    currentTenant: {
        id: number;
        type: string;
    };
}

export default function Discover({ tenants, filters, currentTenant }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedCity, setSelectedCity] = useState(filters.city || '');
    const [selectedState, setSelectedState] = useState(filters.state || '');
    const [selectedCountry, setSelectedCountry] = useState(filters.country || 'all');

    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = () => {
        router.get(
            route('tenant-relationships.discover'),
            {
                search: searchQuery,
                type: selectedType !== 'all' ? selectedType : undefined,
                city: selectedCity || undefined,
                state: selectedState || undefined,
                country: selectedCountry !== 'all' ? selectedCountry : undefined,
            },
            { preserveState: true },
        );
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setSelectedCity('');
        setSelectedState('');
        setSelectedCountry('all');
        router.get(route('tenant-relationships.discover'));
    };

    const handleOpenRequestDialog = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setRequestMessage('');
        setRequestDialogOpen(true);
    };

    const handleSendRequest = () => {
        if (!selectedTenant) return;

        setIsSubmitting(true);
        router.post(
            route('tenant-relationships.store'),
            {
                requested_id: selectedTenant.id,
                request_message: requestMessage,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setRequestDialogOpen(false);
                    setRequestMessage('');
                    setSelectedTenant(null);
                },
            },
        );
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) return null;

        const variants = {
            pending: { variant: 'outline' as const, icon: Clock, className: 'border-yellow-500 text-yellow-700', text: 'Request Pending' },
            accepted: { variant: 'outline' as const, icon: CheckCircle, className: 'border-green-500 text-green-700', text: 'Connected' },
            declined: { variant: 'outline' as const, icon: XCircle, className: 'border-red-500 text-red-700', text: 'Request Declined' },
            removed: { variant: 'outline' as const, icon: XCircle, className: 'border-gray-500 text-gray-700', text: 'Disconnected' },
        };

        const config = variants[status as keyof typeof variants];
        if (!config) return null;

        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <Icon className="mr-1 h-3 w-3" />
                {config.text}
            </Badge>
        );
    };

    const canSendRequest = (tenant: Tenant) => {
        return !tenant.relationship_status || tenant.relationship_status === 'declined' || tenant.relationship_status === 'removed';
    };

    return (
        <AppLayout>
            <Head title="Discover Partners" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Discover Business Partners</h1>
                        <p className="mt-2 text-gray-600">
                            Find and connect with {currentTenant.type === 'underwriter' ? 'brokers' : 'underwriters'} to expand your network
                        </p>
                    </div>
                    <Link href={route('tenant-relationships.index')}>
                        <Button variant="outline">View My Relationships</Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Search & Filter</CardTitle>
                        <CardDescription>Find the perfect partner for your business</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <div className="lg:col-span-2">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="Search by name or company..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="broker">Broker</SelectItem>
                                        <SelectItem value="underwriter">Underwriter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    placeholder="City"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    type="text"
                                    placeholder="State"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Found {tenants.total} {tenants.total === 1 ? 'partner' : 'partners'}
                    </p>
                </div>

                {tenants.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Search className="mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold">No partners found</h3>
                            <p className="mb-4 text-center text-gray-600">
                                Try adjusting your search criteria or filters to find potential partners.
                            </p>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tenants.data.map((tenant) => (
                            <Card key={tenant.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                            <Building2 className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{tenant.company_name || tenant.name}</CardTitle>
                                            <CardDescription className="capitalize">{tenant.type}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="space-y-3">
                                        {(tenant.city || tenant.state || tenant.country) && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                <span>{[tenant.city, tenant.state, tenant.country].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}

                                        {tenant.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">{tenant.email}</span>
                                            </div>
                                        )}

                                        {tenant.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="h-4 w-4 flex-shrink-0" />
                                                <span>{tenant.phone}</span>
                                            </div>
                                        )}

                                        {tenant.license_number && (
                                            <div className="text-sm text-gray-600">
                                                <strong>License:</strong> {tenant.license_number}
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            {tenant.relationship_status ? (
                                                getStatusBadge(tenant.relationship_status)
                                            ) : (
                                                <Badge variant="outline" className="border-gray-300 text-gray-600">
                                                    No Connection
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardContent className="border-t pt-4">
                                    {canSendRequest(tenant) ? (
                                        <Button className="w-full" onClick={() => handleOpenRequestDialog(tenant)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Request
                                        </Button>
                                    ) : tenant.relationship_status === 'pending' ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Request Pending
                                        </Button>
                                    ) : tenant.relationship_status === 'accepted' ? (
                                        <Link href={route('tenant-relationships.index')}>
                                            <Button className="w-full" variant="outline">
                                                View Relationship
                                            </Button>
                                        </Link>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {tenants.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: tenants.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === tenants.current_page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    router.get(
                                        route('tenant-relationships.discover', {
                                            ...filters,
                                            page,
                                        }),
                                    )
                                }
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Send Request Dialog */}
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send Business Relationship Request</DialogTitle>
                            <DialogDescription>
                                Send a request to {selectedTenant?.company_name || selectedTenant?.name} to establish a business partnership.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{selectedTenant?.company_name || selectedTenant?.name}</h4>
                                        <p className="text-sm text-gray-600 capitalize">{selectedTenant?.type}</p>
                                        {selectedTenant?.city && (
                                            <p className="text-sm text-gray-600">
                                                {selectedTenant.city}, {selectedTenant.state || selectedTenant.country}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="request-message">Message (Optional)</Label>
                                <Textarea
                                    id="request-message"
                                    placeholder="Introduce yourself and explain why you'd like to partner..."
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    rows={4}
                                    className="mt-2"
                                />
                                <p className="mt-1 text-sm text-gray-500">A friendly message can help establish a positive connection.</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendRequest} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
