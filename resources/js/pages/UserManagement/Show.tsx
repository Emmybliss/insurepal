import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Calendar, Edit, Mail, Shield, User, UserCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    email_verified_at: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: Permission[];
    tenant?: {
        id: number;
        name: string;
        type: string;
    };
}

interface Props {
    user: User;
    activityLog?: Array<{
        id: number;
        description: string;
        created_at: string;
    }>;
}

export default function UserManagementShow({ user, activityLog }: Props) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
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

    const handleToggleStatus = () => {
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
                            description: `Account status changed to ${user.is_active ? 'inactive' : 'active'}`,
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

    const handleSendPasswordReset = () => {
        if (confirm(`Send password reset email to "${user.email}"?`)) {
            router.post(
                route('user-management.send-password-reset', user.id),
                {},
                {
                    onStart: () => {
                        toast.loading('Sending password reset email...', { id: 'password-reset' });
                    },
                    onSuccess: () => {
                        toast.success('Password reset email sent successfully', {
                            id: 'password-reset',
                            description: `Reset instructions sent to ${user.email}`,
                            duration: 4000,
                        });
                    },
                    onError: (errors) => {
                        const message = errors?.message || 'Failed to send password reset email';
                        toast.error(message, {
                            id: 'password-reset',
                            description: 'Please check email configuration or try again',
                            duration: 5000,
                        });
                    },
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title={`${user.name} - User Details`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('user-management.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
                        <p className="text-muted-foreground">View user information and manage access</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Information */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="text-xl font-semibold">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <Badge
                                                variant={user.is_active ? 'default' : 'secondary'}
                                                className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            {user.email_verified_at && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    <Mail className="mr-1 h-3 w-3" />
                                                    Email Verified
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{user.email}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                                            </div>
                                            {user.last_login_at && (
                                                <div className="flex items-center">
                                                    <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>Last login {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Roles & Permissions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Roles & Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="mb-3 font-medium">Assigned Roles</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                                                    {role.display_name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No roles assigned</p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="mb-3 font-medium">Direct Permissions</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.length > 0 ? (
                                            user.permissions.map((permission) => (
                                                <Badge key={permission.id} variant="secondary" className="text-xs">
                                                    {permission.display_name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No direct permissions assigned</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Log */}
                        {activityLog && activityLog.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>Recent actions performed by this user</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {activityLog.slice(0, 5).map((activity) => (
                                            <div key={activity.id} className="flex items-center space-x-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <div className="flex-1">
                                                    <span>{activity.description}</span>
                                                    <span className="ml-2 text-muted-foreground">
                                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href={route('user-management.edit', user.id)}>
                                    <Button className="w-full" variant="outline">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit User
                                    </Button>
                                </Link>

                                <Link href={route('user-management.edit-roles', user.id)}>
                                    <Button className="w-full" variant="outline">
                                        <UserCog className="mr-2 h-4 w-4" />
                                        Manage Roles
                                    </Button>
                                </Link>

                                <Button className="w-full" variant="outline" onClick={handleToggleStatus}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    {user.is_active ? 'Deactivate' : 'Activate'} User
                                </Button>

                                <Button className="w-full" variant="outline" onClick={handleSendPasswordReset}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Password Reset
                                </Button>
                            </CardContent>
                        </Card>

                        {/* User Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Roles Assigned</span>
                                    <span className="font-medium">{user.roles.length}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Direct Permissions</span>
                                    <span className="font-medium">{user.permissions.length}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Account Status</span>
                                    <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
