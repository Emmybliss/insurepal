import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageProps, PaginatedData } from '@/types';
import { Claim, ClaimFilters, ClaimStats } from '@/types/claim';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Clock, FileText, Plus, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props extends PageProps {
    claims: PaginatedData<Claim>;
    stats: ClaimStats;
    filters: ClaimFilters;
}

export default function Index({ claims, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [claimType, setClaimType] = useState(filters.claim_type || '');

    const handleFilter = (searchOverride?: string, statusOverride?: string, claimTypeOverride?: string) => {
        router.get(
            route('claims.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search,
                status: statusOverride !== undefined ? statusOverride : status,
                claim_type: claimTypeOverride !== undefined ? claimTypeOverride : claimType,
                date_from: filters.date_from,
                date_to: filters.date_to,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setClaimType('');
        router.get(route('claims.index'));
    };

    return (
        <AppLayout>
            <Head title="Claims Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Claims Management</h1>
                        <p className="text-muted-foreground">Manage and track insurance claims</p>
                    </div>
                    <Link href={route('claims.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Claim
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approved}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rejected}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Settled</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.settled}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Search and filter claims</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="w-full flex-1">
                                <SearchInput
                                    placeholder="Search claims..."
                                    value={search}
                                    onChange={(val) => {
                                        setSearch(val);
                                        handleFilter(val, status, claimType);
                                    }}
                                />
                            </div>

                            <Select
                                value={status || 'all'}
                                onValueChange={(val) => {
                                    const newStatus = val === 'all' ? '' : val;
                                    setStatus(newStatus);
                                    handleFilter(search, newStatus, claimType);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="info_requested">Info Requested</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="settled">Settled</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={claimType || 'all'}
                                onValueChange={(val) => {
                                    const newType = val === 'all' ? '' : val;
                                    setClaimType(newType);
                                    handleFilter(search, status, newType);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="accident">Accident</SelectItem>
                                    <SelectItem value="theft">Theft</SelectItem>
                                    <SelectItem value="damage">Damage</SelectItem>
                                    <SelectItem value="fire">Fire</SelectItem>
                                    <SelectItem value="flood">Flood</SelectItem>
                                    <SelectItem value="medical">Medical</SelectItem>
                                    <SelectItem value="death">Death</SelectItem>
                                    <SelectItem value="disability">Disability</SelectItem>
                                    <SelectItem value="liability">Liability</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                {(search || status || claimType) && (
                                    <Button onClick={handleReset} variant="outline" className="flex-1">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Claims List</CardTitle>
                        <CardDescription>View and manage all claims</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim Reference</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Incident Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Days Open</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No claims found. Create your first claim to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    claims.data.map((claim) => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="font-medium">{claim.claim_reference}</TableCell>
                                            <TableCell>{claim.customer?.display_name || 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{claim.claim_type.replace('_', ' ')}</TableCell>
                                            <TableCell>{formatDate(claim.incident_date)}</TableCell>
                                            <TableCell>{formatCurrency(claim.claim_amount)}</TableCell>
                                            <TableCell>
                                                <ClaimStatusBadge status={claim.status} />
                                            </TableCell>
                                            <TableCell>{claim.days_open} days</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('claims.show', claim.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {claims.data.length > 0 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {claims.from} to {claims.to} of {claims.total} claims
                                </p>
                                <div className="flex gap-2">
                                    {claims.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
