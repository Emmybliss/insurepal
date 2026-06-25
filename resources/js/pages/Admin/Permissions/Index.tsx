import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Key, MoreHorizontal, PlusCircle, Search, Shield, Trash } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface Permission {
    id: number;
    name: string;
    label: string | null;
    module: string | null;
    description: string | null;
    is_active: boolean;
    roles_count: number;
    created_at: string;
    roles: Array<{
        id: number;
        name: string;
        label?: string;
    }>;
}

interface Props {
    permissions?: {
        data: Permission[];

        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        module?: string;
        status?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    };
    modules: string[];
}

export default function PermissionsIndex({ permissions, filters, modules }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedModule, setSelectedModule] = useState(filters.module || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [loading, setLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.permissions.index'),
            {
                ...filters,
                search: searchTerm,
                module: selectedModule,
                status: selectedStatus,
            },
            { preserveState: true },
        );
    };

    const handleSort = (field: string) => {
        const order = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.permissions.index'), { ...filters, sort_by: field, sort_order: order }, { preserveState: true });
    };

    const handleDelete = async (permissionId: number, permissionName: string, rolesCount: number) => {
        const result = await Swal.fire({
            title: 'Delete Permission?',
            html: `
                <div class="text-left">
                    <p>Are you sure you want to delete the permission:</p>
                    <p class="font-mono bg-gray-100 p-2 rounded mt-2 mb-2"><strong>${permissionName}</strong></p>
                    ${
                        rolesCount > 0
                            ? `<div class="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                            <p class="text-orange-800 text-sm">
                                ⚠️ This permission is currently assigned to <strong>${rolesCount}</strong> role(s).
                                Deleting it will remove it from all assigned roles.
                            </p>
                        </div>`
                            : '<p class="text-gray-600 text-sm mt-2">This permission is not assigned to any roles.</p>'
                    }
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            focusCancel: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve) => {
                    router.delete(route('admin.permissions.destroy', permissionId), {
                        onSuccess: () => {
                            resolve(true);
                        },
                        onError: (errors) => {
                            Swal.showValidationMessage(errors.error || 'Failed to delete permission');
                            resolve(false);
                        },
                    });
                });
            },
            allowOutsideClick: () => !Swal.isLoading(),
        });

        if (result.isConfirmed) {
            await Swal.fire({
                title: 'Deleted!',
                text: `Permission "${permissionName}" has been deleted successfully.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });

            toast.success('Permission deleted successfully', {
                description: `"${permissionName}" has been removed from the system`,
            });
        }
    };

    const formatPermissionName = (name: string) => {
        return name.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatModuleName = (module: string | null | undefined) => {
        if (!module) return 'General';
        return module
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AdminLayout>
            <Head title="Permissions Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Permissions Management</h1>
                        <p className="text-muted-foreground">Manage system permissions and their assignments</p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.permissions.create')}>
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
                            <div className="text-2xl font-bold">{permissions?.total || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {permissions?.data.filter((permission) => permission.roles_count > 0).length || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Modules</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{modules.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {permissions?.data.filter((permission) => permission.roles_count === 0).length || 0}
                            </div>
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
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">All Modules</option>
                                {modules.map((module) => (
                                    <option key={module} value={module}>
                                        {formatModuleName(module)}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">All Status</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Permissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Permissions ({permissions?.total || 0})</CardTitle>
                        <CardDescription>System permissions and their role assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                                            Permission Name
                                            {filters.sort_by === 'name' && <span className="ml-2">{filters.sort_order === 'asc' ? '↑' : '↓'}</span>}
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('label')}>
                                            Label
                                            {filters.sort_by === 'label' && <span className="ml-2">{filters.sort_order === 'asc' ? '↑' : '↓'}</span>}
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('module')}>
                                            Module
                                            {filters.sort_by === 'module' && <span className="ml-2">{filters.sort_order === 'asc' ? '↑' : '↓'}</span>}
                                        </TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned Roles</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions?.data.length ? (
                                        permissions.data.map((permission) => (
                                            <TableRow key={permission.id}>
                                                <TableCell className="font-medium">
                                                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                                        {permission.name}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{permission.label || formatPermissionName(permission.name)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{formatModuleName(permission.module)}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">{permission.description || 'No description'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                                                        {permission.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {permission.roles.slice(0, 3).map((role) => (
                                                            <Badge key={role.id} variant="secondary" className="text-xs">
                                                                {role.label || role.name.replace('_', ' ')}
                                                            </Badge>
                                                        ))}
                                                        {permission.roles.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{permission.roles.length - 3} more
                                                            </Badge>
                                                        )}
                                                        {permission.roles.length === 0 && (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Unassigned
                                                            </Badge>
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
                                                                <Link href={route('admin.permissions.show', permission.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.permissions.edit', permission.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(permission.id, permission.name, permission.roles_count)}
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
                                            <TableCell colSpan={7} className="text-center">
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
                                                route('admin.permissions.index'),
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
                                                route('admin.permissions.index'),
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
        </AdminLayout>
    );
}
