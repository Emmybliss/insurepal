import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Eye, MoreHorizontal, PlusCircle, Search, Shield, Trash, Users } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface Role {
    id: number;
    name: string;
    label?: string;
    description: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
    permissions: Array<{
        id: number;
        name: string;
    }>;
}

interface Props {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    filters: {
        search?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    };
}

export default function RolesIndex({ roles, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get(route('admin.roles.index'), { search: value }, { preserveState: true, replace: true });
    };

    const handleSort = (field: string) => {
        const order = filters?.sort_by === field && filters?.sort_order === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.roles.index'), { ...filters, sort_by: field, sort_order: order }, { preserveState: true });
    };

    const handleDelete = async (roleId: number, roleName: string, usersCount: number, permissionsCount: number) => {
        const result = await Swal.fire({
            title: 'Delete Role?',
            html: `
                <div class="text-left">
                    <p>Are you sure you want to delete the role:</p>
                    <p class="font-mono bg-gray-100 p-2 rounded mt-2 mb-2"><strong>${roleName}</strong></p>
                    ${
                        usersCount > 0 || permissionsCount > 0
                            ? `<div class="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                            <p class="text-orange-800 text-sm">
                                ⚠️ This role has:
                                ${usersCount > 0 ? `<br/>• <strong>${usersCount}</strong> assigned user(s)` : ''}
                                ${permissionsCount > 0 ? `<br/>• <strong>${permissionsCount}</strong> permission(s)` : ''}
                                <br/><br/>Deleting it will remove all these associations.
                            </p>
                        </div>`
                            : '<p class="text-gray-600 text-sm mt-2">This role has no users or permissions assigned.</p>'
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
                    router.delete(route('admin.roles.destroy', roleId), {
                        onSuccess: () => {
                            resolve(true);
                        },
                        onError: (errors) => {
                            Swal.showValidationMessage(errors.error || 'Failed to delete role');
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
                text: `Role "${roleName}" has been deleted successfully.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
            });

            toast.success('Role deleted successfully', {
                description: `"${roleName}" has been removed from the system`,
            });
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-red-100 text-red-800',
            underwriter: 'bg-blue-100 text-blue-800',
            broker: 'bg-green-100 text-green-800',
            staff: 'bg-yellow-100 text-yellow-800',
            customer: 'bg-gray-100 text-gray-800',
        };
        return colors[roleName] || 'bg-purple-100 text-purple-800';
    };

    return (
        <AdminLayout>
            <Head title="Roles Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles Management</h1>
                        <p className="text-muted-foreground">Manage user roles and their permissions</p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.roles.create')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Role
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles?.total || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles?.data?.filter((role) => role.users_count > 0).length || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{roles?.data.reduce((sum, role) => sum + role.users_count, 0) || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Permissions</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {roles?.data.length
                                    ? Math.round(roles.data.reduce((sum, role) => sum + role.permissions_count, 0) / roles.data.length)
                                    : 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-cyan-900" size={20} />
                            <Input type="text" value={searchTerm} onChange={handleSearch} placeholder="Search..." className="w-1/2 py-2 pr-4 pl-10" />
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Roles ({roles?.total || 0})</CardTitle>
                        <CardDescription>Manage user roles and their associated permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                                            Role Name
                                            {filters?.sort_by === 'name' && <span className="ml-2">{filters?.sort_order === 'asc' ? '↑' : '↓'}</span>}
                                        </TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead>Users</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles?.data.length ? (
                                        roles.data.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                                            {role.name.replace('_', ' ').toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">{role.description || 'No description'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Badge variant="secondary">{role.permissions_count} permissions</Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="max-w-xs">
                                                                    {role.permissions.slice(0, 5).map((permission, index) => (
                                                                        <div key={index} className="text-xs">
                                                                            {permission.name}
                                                                        </div>
                                                                    ))}
                                                                    {role.permissions.length > 5 && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            ...and {role.permissions.length - 5} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{role.users_count} users</Badge>
                                                </TableCell>
                                                <TableCell>{formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.roles.show', role.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('admin.roles.edit', role.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {role.name !== 'super_admin' && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDelete(role.id, role.name, role.users_count, role.permissions_count)
                                                                    }
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">
                                                No roles found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {roles && roles?.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(roles?.current_page - 1) * roles?.per_page + 1} to{' '}
                                    {Math.min(roles?.current_page * roles?.per_page, roles?.total)} of {roles?.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={roles?.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                route('admin.roles.index'),
                                                { ...filters, page: roles?.current_page - 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={roles?.current_page >= roles?.last_page}
                                        onClick={() =>
                                            router.get(
                                                route('admin.roles.index'),
                                                { ...filters, page: roles?.current_page + 1 },
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
