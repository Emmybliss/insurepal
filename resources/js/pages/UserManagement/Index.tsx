import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Eye, MoreHorizontal, PlusCircle, Search, Shield, Trash2, UserCheck, UserCog, Users } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
    permissions: Array<{
        id: number;
        name: string;
    }>;
    tenant?: {
        id: number;
        name: string;
        type: string;
    };
}

interface Props {
    users?: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        role?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    };
    availableRoles: Array<{
        id: number;
        name: string;
    }>;
}

const UserManagementIndex = ({ users, filters, availableRoles }: Props) => {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    const [loading, setLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('user-management.index'), { ...filters, search: searchTerm, role: selectedRole }, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const order = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
        router.get(route('user-management.index'), { ...filters, sort_by: field, sort_order: order }, { preserveState: true });
    };

    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-red-100 text-red-800',
            underwriter: 'bg-blue-100 text-blue-800',
            broker: 'bg-green-100 text-green-800',
            staff: 'bg-yellow-100 text-yellow-800',
        };
        return colors[roleName] || 'bg-purple-100 text-purple-800';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRoleName = (roleName: string) => {
        return roleName.replace('_', ' ').toUpperCase();
    };

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            router.delete(route('user-management.destroy', user.id), {
                onStart: () => {
                    toast.loading('Deleting user...', { id: 'delete-user' });
                },
                onSuccess: () => {
                    toast.success(`User "${user.name}" has been deleted successfully`, {
                        id: 'delete-user',
                        description: 'All associated data has been removed',
                        duration: 4000,
                    });
                },
                onError: (errors) => {
                    const message = errors?.message || 'Failed to delete user. They may have associated data.';
                    toast.error(message, {
                        id: 'delete-user',
                        description: 'Please try again or contact support',
                        duration: 5000,
                    });
                },
            });
        }
    };

    const handleToggleStatus = (user: User) => {
        const action = user.is_active ? 'deactivate' : 'activate';
        const statusText = user.is_active ? 'deactivated' : 'activated';

        if (confirm(`Are you sure you want to ${action} user "${user.name}"?`)) {
            router.post(
                route('user-management.toggle-status', user.id),
                {},
                {
                    onStart: () => {
                        toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing user...`, {
                            id: 'toggle-status',
                        });
                    },
                    onSuccess: () => {
                        toast.success(`User "${user.name}" has been ${statusText} successfully`, {
                            id: 'toggle-status',
                            description: `Status updated to ${user.is_active ? 'inactive' : 'active'}`,
                            duration: 4000,
                        });
                    },
                    onError: (errors) => {
                        const message = errors?.message || `Failed to ${action} user`;
                        toast.error(message, {
                            id: 'toggle-status',
                            description: 'Please try again or contact support',
                            duration: 5000,
                        });
                    },
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title="User Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage users and their role assignments</p>
                    </div>
                    <Link href={route('user-management.create')}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users?.total || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users?.data.filter((user) => user.is_active).length || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Roles</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users?.data.filter((user) => user.roles.length > 0).length || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Online Today</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {users?.data.filter(
                                    (user) => user.last_login_at && new Date(user.last_login_at).toDateString() === new Date().toDateString(),
                                ).length || 0}
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
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">All Roles</option>
                                {availableRoles?.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {formatRoleName(role.name)}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users ({users?.total || 0})</CardTitle>
                        <CardDescription>Manage user roles and permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                                            User
                                            {filters?.sort_by === 'name' && <span className="ml-2">{filters?.sort_order === 'asc' ? '↑' : '↓'}</span>}
                                        </TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.data.length ? (
                                        users.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.slice(0, 2).map((role) => (
                                                            <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                                                                {formatRoleName(role.name)}
                                                            </Badge>
                                                        ))}
                                                        {user.roles.length > 2 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{user.roles.length - 2}
                                                            </Badge>
                                                        )}
                                                        {user.roles.length === 0 && (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                No roles
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {user.permissions.length} direct
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={user.is_active ? 'default' : 'secondary'}
                                                        className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                                    >
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.last_login_at
                                                        ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                                                        : 'Never'}
                                                </TableCell>
                                                <TableCell>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('user-management.show', user.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('user-management.edit', user.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit User
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={route('user-management.edit-roles', user.id)}>
                                                                    <UserCog className="mr-2 h-4 w-4" />
                                                                    Manage Roles
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleStatus(user)}
                                                                className={user.is_active ? 'text-yellow-600' : 'text-green-600'}
                                                            >
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(user)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
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
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {users && users?.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(users?.current_page - 1) * users?.per_page + 1} to{' '}
                                    {Math.min(users?.current_page * users?.per_page, users?.total)} of {users?.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={users?.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                route('user-management.index'),
                                                { ...filters, page: users?.current_page - 1 },
                                                { preserveState: true },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={users?.current_page >= users?.last_page}
                                        onClick={() =>
                                            router.get(
                                                route('user-management.index'),
                                                { ...filters, page: users?.current_page + 1 },
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
};
export default UserManagementIndex;
