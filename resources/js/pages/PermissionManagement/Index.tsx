import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Key, MoreHorizontal, PlusCircle, Search, Trash } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    description: string;
    category: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
    roles_count: number;
}

interface Props {
    permissions: {
        data: Permission[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        system?: boolean;
        status?: string;
    };
    stats: {
        total: number;
        active: number;
        system: number;
        custom: number;
        categories: number;
    };
}

export default function PermissionsIndex({ permissions, categories, filters, stats }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('permission-management.index'),
            {
                ...filters,
                search: searchTerm,
                category: selectedCategory,
            },
            { preserveState: true },
        );
    };

    const handleDelete = (permissionId: number, permissionName: string) => {
        if (!window.confirm(`Are you sure you want to delete the permission "${permissionName}"?`)) {
            return;
        }

        router.delete(route('permission-management.destroy', permissionId), {
            onSuccess: () => {
                toast.success('Permission deleted successfully');
            },
            onError: (errors) => {
                toast.error(errors.permission || 'Failed to delete permission');
            },
        });
    };

    const handleToggleStatus = (permissionId: number) => {
        router.post(
            route('permission-management.toggle-status', permissionId),
            {},
            {
                onSuccess: () => {
                    toast.success('Permission status updated successfully');
                },
                onError: () => {
                    toast.error('Failed to update status');
                },
            },
        );
    };

    const formatCategoryName = (category: string) => {
        if (!category) return 'Uncategorized';
        return category
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AppLayout>
            <Head title="Permissions Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Permissions Management</h1>
                        <p className="text-muted-foreground">Manage system permissions and their assignments</p>
                    </div>
                    <Button asChild>
                        <Link href={route('permission-management.create')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Permission
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Permissions</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.system}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categories</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.categories}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {formatCategoryName(category)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Permissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Permissions ({permissions?.total || 0})</CardTitle>
                        <CardDescription>Manage system permissions and their role assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Permission Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions?.data.length ? (
                                        permissions.data.map((permission) => (
                                            <TableRow key={permission.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-semibold">{permission.display_name || permission.name}</div>
                                                        <div className="font-mono text-xs text-muted-foreground">{permission.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{formatCategoryName(permission.category)}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">{permission.description || 'No description'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={permission.is_active ? 'default' : 'secondary'}
                                                        className="cursor-pointer"
                                                        onClick={() => handleToggleStatus(permission.id)}
                                                    >
                                                        {permission.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {permission.roles_count > 0 ? (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {permission.roles_count} roles
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Unassigned</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('permission-management.show', permission.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('permission-management.edit', permission.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(permission.id, permission.name)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">
                                                No permissions found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {permissions && permissions.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(permissions.current_page - 1) * permissions.per_page + 1} to{' '}
                                    {Math.min(permissions.current_page * permissions.per_page, permissions.total)} of {permissions.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={permissions.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                route('permission-management.index'),
                                                { ...filters, page: permissions.current_page - 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={permissions.current_page >= permissions.last_page}
                                        onClick={() =>
                                            router.get(
                                                route('permission-management.index'),
                                                { ...filters, page: permissions.current_page + 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
