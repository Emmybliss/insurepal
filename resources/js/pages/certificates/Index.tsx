import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, FileText, MoreHorizontal, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    first_name: string;
    last_name: string;
    company_name?: string;
    type: string;
}

interface PolicyProduct {
    name: string;
}

interface Policy {
    id: number;
    policy_number: string;
    customer: Customer;
    policy_product: PolicyProduct;
}

interface CertificateTemplate {
    name: string;
    type: string;
}

interface Certificate {
    id: number;
    certificate_number: string;
    type: string;
    status: string;
    generated_at: string;
    issued_at?: string;
    policy: Policy;
    template: CertificateTemplate;
}

interface PaginatedCertificates {
    data: Certificate[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    certificates: PaginatedCertificates;
    filters: {
        status?: string;
        type?: string;
        policy_id?: string;
        search?: string;
    };
    statuses: Record<string, string>;
    types: Record<string, string>;
}

export default function CertificatesIndex({ certificates, filters, statuses, types }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');

    const handleSearch = () => {
        router.get(
            route('certificates.index'),
            {
                search,
                status,
                type,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setType('');
        router.get(
            route('certificates.index'),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const getCustomerName = (customer: Customer) => {
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'generated':
                return 'bg-blue-100 text-blue-800';
            case 'issued':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'policy_certificate':
                return 'bg-purple-100 text-purple-800';
            case 'policy_schedule':
                return 'bg-indigo-100 text-indigo-800';
            case 'endorsement':
                return 'bg-orange-100 text-orange-800';
            case 'coverage_note':
                return 'bg-teal-100 text-teal-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title="Certificates" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
                        <p className="text-gray-600">Manage and track policy certificates</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.post(route('certificates.bulk-generate'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            Bulk Generate
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <Input
                                        placeholder="Search certificates..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* <SelectItem value="">All statuses</SelectItem> */}
                                        {Object.entries(statuses).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All types</SelectItem>
                                        {Object.entries(types).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    Search
                                </Button>
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Certificates</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold">{certificates.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Generated</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold text-blue-600">{certificates.data.filter((c) => c.status === 'generated').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Issued</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold text-green-600">{certificates.data.filter((c) => c.status === 'issued').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold text-gray-600">{certificates.data.filter((c) => c.status === 'draft').length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Certificates</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Certificate Number</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Policy</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Generated</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {certificates.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="mb-4 h-12 w-12 text-gray-400" />
                                                <h3 className="mb-2 text-lg font-medium text-gray-900">No certificates found</h3>
                                                <p className="mb-4 text-gray-500">No certificates match your current filters.</p>
                                                <Button variant="outline" onClick={handleClearFilters}>
                                                    Clear filters
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    certificates.data.map((certificate) => (
                                        <TableRow key={certificate.id}>
                                            <TableCell>
                                                <Link
                                                    href={route('certificates.show', certificate.id)}
                                                    className="font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    {certificate.certificate_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getTypeColor(certificate.type)}>
                                                    {types[certificate.type] || certificate.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{certificate.policy.policy_number}</div>
                                                    <div className="text-sm text-gray-500">{certificate.policy.policy_product.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{getCustomerName(certificate.policy.customer)}</div>
                                                <div className="text-sm text-gray-500 capitalize">{certificate.policy.customer.type}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(certificate.status)}>
                                                    {statuses[certificate.status] || certificate.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatDate(certificate.generated_at)}</div>
                                                {certificate.issued_at && (
                                                    <div className="text-xs text-gray-500">Issued: {formatDate(certificate.issued_at)}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => window.open(route('certificates.preview', certificate.id), '_blank')}
                                                        title="Preview"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => (window.location.href = route('certificates.download', certificate.id))}
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" title="More actions">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {certificates.last_page > 1 && (
                            <div className="border-t px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing {(certificates.current_page - 1) * certificates.per_page + 1} to{' '}
                                        {Math.min(certificates.current_page * certificates.per_page, certificates.total)} of {certificates.total}{' '}
                                        results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={certificates.current_page === 1}
                                            onClick={() =>
                                                router.get(route('certificates.index'), {
                                                    ...filters,
                                                    page: certificates.current_page - 1,
                                                })
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm">
                                            Page {certificates.current_page} of {certificates.last_page}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={certificates.current_page === certificates.last_page}
                                            onClick={() =>
                                                router.get(route('certificates.index'), {
                                                    ...filters,
                                                    page: certificates.current_page + 1,
                                                })
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
