import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, ChevronDown, Key, Shield, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    permissions_count: number;
    users_count?: number;
    created_at: string;
}

interface Permission {
    id: number;
    name: string;
    label: string;
    description: string;
    module: string;
    via_role?: number;
}

interface ProfileProps {
    mustVerifyEmail: boolean;
    status?: string;
    userRoles: Role[];
    userPermissions: Record<string, Permission[]>;
    availableRoles: Role[];
    availablePermissions: Record<string, Permission[]>;
    canManageRoles: boolean;
}

export default function Profile({
    mustVerifyEmail,
    status,
    userRoles,
    userPermissions,
    availableRoles,
    availablePermissions,
    canManageRoles,
}: ProfileProps) {
    const { auth } = usePage<SharedData>().props;
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
    const profileImageRef = useRef<HTMLInputElement>(null);
    const signatureImageRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        profileImageRef.current?.click();
    };

    const handleSignatureClick = () => {
        signatureImageRef.current?.click();
    };

    const toggleModule = (module: string) => {
        setOpenModules((prev) => ({
            ...prev,
            [module]: !prev[module],
        }));
    };

    const { data, setData, post, processing, recentlySuccessful, errors } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        avatar: null as File | null,
        signature: null as File | null,
        _method: 'PATCH',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setPreviewUrl(null);
                setSignaturePreviewUrl(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                        {canManageRoles && <TabsTrigger value="manage">Manage Access</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <div className="space-y-6">
                            <HeadingSmall title="Profile information" description="Update your name and email address" />

                            <form onSubmit={submit} className="space-y-6">
                                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
                                    <div className="group relative cursor-pointer" onClick={handleImageClick}>
                                        <Avatar className="h-24 w-24 border-2 border-muted shadow-md transition-all group-hover:opacity-80">
                                            <AvatarImage src={previewUrl || auth.user.avatar_url} alt={auth.user.name} />
                                            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                                                {auth.user.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Camera className="h-8 w-8 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            ref={profileImageRef}
                                            className="hidden"
                                            accept="image/*"
                                            name="avatar"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData('avatar', file);
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        setPreviewUrl(e.target?.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1 text-center sm:text-left">
                                        <h3 className="text-lg font-medium">Profile Photo</h3>
                                        <p className="text-sm text-muted-foreground">Click the avatar to upload a new profile picture.</p>
                                        {errors.avatar && <p className="mt-1 text-xs text-destructive">{errors.avatar}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                <div className="grid gap-4 pt-4">
                                    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
                                        <div className="group relative cursor-pointer" onClick={handleSignatureClick}>
                                            <div className="flex h-24 w-48 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted shadow-sm transition-all group-hover:bg-accent/50">
                                                {signaturePreviewUrl || auth.user.signature_url ? (
                                                    <img
                                                        src={signaturePreviewUrl || auth.user.signature_url}
                                                        alt="Signature"
                                                        className="h-full w-full object-contain p-2"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                        <Camera className="h-6 w-6 mb-1" />
                                                        <span className="text-xs">Upload Signature</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Camera className="h-8 w-8 text-white" />
                                            </div>
                                            <input
                                                type="file"
                                                ref={signatureImageRef}
                                                className="hidden"
                                                accept="image/*"
                                                name="signature"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setData('signature', file);
                                                        const reader = new FileReader();
                                                        reader.onload = (e) => {
                                                            setSignaturePreviewUrl(e.target?.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-medium">Official Signature</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Upload a clear image of your signature on a white background.
                                                This will be used for documents you prepare.
                                            </p>
                                            {errors.signature && <p className="mt-1 text-xs text-destructive">{errors.signature}</p>}
                                        </div>
                                    </div>
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href="/email/verify"
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the verification email.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </form>
                        </div>

                        <DeleteUser />
                    </TabsContent>

                    <TabsContent value="roles" className="space-y-6">
                        <div className="grid gap-6">
                            {/* User Roles */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Your Roles
                                    </CardTitle>
                                    <CardDescription>Roles you have been assigned that determine your access level</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {userRoles.length > 0 ? (
                                        <div className="grid gap-4">
                                            {userRoles.map((role) => (
                                                <div key={role.id} className="flex items-center justify-between rounded-lg border p-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium">{role.label}</h3>
                                                            <Badge variant="outline">{role.permissions_count} permissions</Badge>
                                                        </div>
                                                        <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                                                    </div>
                                                    <Badge>{role.name}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No roles assigned</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* User Permissions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Your Permissions
                                    </CardTitle>
                                    <CardDescription>Specific permissions you have access to, organized by module</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {Object.keys(userPermissions).length > 0 ? (
                                        <div className="space-y-4">
                                            {Object.entries(userPermissions).map(([module, permissions]) => (
                                                <Collapsible key={module} open={openModules[module]} onOpenChange={() => toggleModule(module)}>
                                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-medium">{module}</h4>
                                                            <Badge variant="secondary">{permissions.length} permissions</Badge>
                                                        </div>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent className="mt-2">
                                                        <div className="ml-4 grid gap-2">
                                                            {permissions.map((permission) => (
                                                                <div
                                                                    key={permission.id}
                                                                    className="flex items-center justify-between rounded border p-2"
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-medium">{permission.label}</p>
                                                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {permission.name}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No permissions assigned</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {canManageRoles && (
                        <TabsContent value="manage" className="space-y-6">
                            <div className="grid gap-6">
                                {/* Available Roles */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            All System Roles
                                        </CardTitle>
                                        <CardDescription>Overview of all roles available in the system</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {availableRoles.length > 0 ? (
                                            <div className="grid gap-4">
                                                {availableRoles.map((role) => (
                                                    <div key={role.id} className="flex items-center justify-between rounded-lg border p-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-medium">{role.label}</h3>
                                                                <Badge variant="outline">{role.permissions_count} permissions</Badge>
                                                                {role.users_count !== undefined && (
                                                                    <Badge variant="secondary">{role.users_count} users</Badge>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                                                        </div>
                                                        <Badge>{role.name}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No roles available</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Available Permissions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Key className="h-5 w-5" />
                                            All System Permissions
                                        </CardTitle>
                                        <CardDescription>Complete overview of all permissions in the system</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {Object.keys(availablePermissions).length > 0 ? (
                                            <div className="space-y-4">
                                                {Object.entries(availablePermissions).map(([module, permissions]) => (
                                                    <Collapsible key={module}>
                                                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-accent">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-medium">{module}</h4>
                                                                <Badge variant="secondary">{permissions.length} permissions</Badge>
                                                            </div>
                                                            <ChevronDown className="h-4 w-4" />
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="mt-2">
                                                            <div className="ml-4 grid gap-2">
                                                                {permissions.map((permission) => (
                                                                    <div
                                                                        key={permission.id}
                                                                        className="flex items-center justify-between rounded border p-2"
                                                                    >
                                                                        <div>
                                                                            <p className="text-sm font-medium">{permission.label}</p>
                                                                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                                        </div>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {permission.name}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No permissions available</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </SettingsLayout>
        </AppLayout>
    );
}
