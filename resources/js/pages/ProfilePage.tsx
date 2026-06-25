import AppearanceTabs from '@/components/appearance-tabs';
import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import useFlashToast from '@/hooks/useFlashToast';
import AppLayout from '@/layouts/app-layout';
import { getImageUrl } from '@/lib/constants';
import { PageProps } from '@inertiajs/core';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    Bell,
    Camera,
    Check,
    Chrome,
    Clock,
    Edit,
    Eye,
    EyeOff,
    Globe,
    Globe2,
    Lock,
    LogOut,
    Mail,
    Monitor,
    Save,
    Settings,
    Shield,
    Smartphone,
    User,
    Wifi,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    user_type: 'staff' | 'customer';
    language: string;
    timezone: string;
    created_at: string;
    updated_at: string;
}

interface UserProfile {
    dob: string | null;
    gender: string | null;
    marital_status: string | null;
    occupation: string | null;
    nat_id: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string;

    contact_name: string | null;
    contact_phone: string | null;
    contact_relationship: string | null;
}

interface NotificationPreferences {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    marketing_notifications: boolean;
}

interface SecuritySettings {
    two_factor_enabled: boolean;
    last_password_change: string | null;
}

interface ActivityLog {
    id: number;
    action: string;
    created_at: string;
    device: string;
    ip: string;
}

interface LoginHistory {
    id: number;
    browser: string;
    os: string;
    date: string;
    created_at: string;
    device: string;
    ip: string;
    location: string;
}

interface ProfilePageProps extends PageProps {
    user: UserData;
    profile: UserProfile;
    notification_preferences: NotificationPreferences;
    security_settings: SecuritySettings;
    recent_activities: ActivityLog[];
    login_history: LoginHistory[];
    completion_rate: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    user,
    profile,
    notification_preferences,
    security_settings,
    recent_activities,
    login_history,
    completion_rate,
}) => {
    useFlashToast();
    const [date, setDate] = React.useState<Date | undefined>(undefined);
    const [status, setStatus] = useState<'online' | 'offline'>('offline');
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const { data, setData, put, post, processing, errors, reset } = useForm({
        // User fields
        name: user.name || '',
        email: user.email,
        phone: user.phone,
        language: user?.language || '',
        timezone: user?.timezone || '',
        avatar: null as File | null,

        // Profile fields
        dob: profile?.dob || '',
        gender: profile?.gender || '',
        marital_status: profile?.marital_status || '',
        occupation: profile?.occupation || '',
        nat_id: profile?.nat_id || '',
        address: profile?.address || '',
        city: profile?.city || '',
        state: profile?.state || '',
        postal_code: profile?.postal_code || '',
        country: profile?.country || 'Nigeria',

        contact_name: profile?.contact_name || '',
        contact_phone: profile?.contact_phone || '',
        contact_relationship: profile?.contact_relationship || '',

        // Notification preferences
        email_notifications: notification_preferences?.email_notifications || false,
        sms_notifications: notification_preferences?.sms_notifications || false,
        push_notifications: notification_preferences?.push_notifications || false,
        marketing_notifications: notification_preferences?.marketing_notifications || false,

        // Security
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    console.log(data.dob);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (!window.Echo) return;

        window.Echo.join('presence.online-status')
            .here((users: any[]) => {
                const isOnline = users.some((u: any) => u.id === user.id);
                setStatus(isOnline ? 'online' : 'offline');
            })
            .joining((joiningUser: any) => {
                if (joiningUser.id === user.id) setStatus('online');
            })
            .leaving((leavingUser: any) => {
                if (leavingUser.id === user.id) setStatus('offline');
            });

        return () => {
            window.Echo.leave('presence.online-status');
        };
    }, [user.id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDeviceIcon = (device: string) => {
        if (device.includes('iPhone') || device.includes('Safari')) return Smartphone;
        if (device.includes('Chrome')) return Chrome;
        if (device.includes('Firefox')) return Globe2;
        return Monitor;
    };

    const handleInputChange = (field: any, value: string | boolean) => {
        setData(field, value);
    };

    const handleSave = () => {
        if (activeTab === 'personal') {
            put(route('update.user.profile'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success('Profile updated successfully!');
                },
                onError: (errors) => {
                    toast.error('Failed to update profile');
                    console.log(errors);
                },
            });
        } else if (activeTab === 'settings') {
            put(route('profile.notifications.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Notification settings updated!');
                },
            });
        } else if (activeTab === 'security') {
            put(route('password.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Password updated successfully!');
                    reset('current_password', 'password', 'password_confirmation');
                },
                onError: (errors) => {
                    if (errors.password) {
                        reset('password', 'password_confirmation');
                        passwordInput.current?.focus();
                    }
                    if (errors.current_password) {
                        reset('current_password');
                        currentPasswordInput.current?.focus();
                    }
                },
            });
        }
    };

    const handleAvatarUpload = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('avatar', e.target.files[0]);

            try {
                await router.post(route('profile.avatar'), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    preserveScroll: true,
                    onSuccess: () => router.reload(),
                });
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };

    const createNotificationHandler = (type: keyof typeof data) => (checked: boolean) => {
        post(route(`profile.${type.replace('_', '-')}`), {
            [type]: checked,
            preserveScroll: true,
            onSuccess: () => {
                setData(type, checked);
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
            },
            onError: () => {
                setData(type, !checked);
            },
        });
    };

    const handleToggleEmailNotifications = createNotificationHandler('email_notifications');
    const handleToggleSmsNotifications = createNotificationHandler('sms_notifications');
    const handleTogglePushNotifications = createNotificationHandler('push_notifications');
    const handleToggleMarketingNotifications = createNotificationHandler('marketing_notifications');

    const handleToggle2FA = (checked: boolean) => {
        post(route('profile.toggle-2fa'), {
            preserveScroll: true,
            onSuccess: () => {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
                router.reload();
            },
        });
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'settings', label: 'Account Settings', icon: Settings },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'activity', label: 'Activity Log', icon: Activity },
    ];

    return (
        <AppLayout>
            <div className="min-h-screen">
                {/* Header */}
                <div className="border-b shadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div>
                                    <h1 className="text-2xl font-semibold">User Profile</h1>
                                    <p className="text-gray-600">Manage your account settings and preferences</p>
                                </div>
                            </div>
                            {saveStatus === 'success' && (
                                <div className="flex items-center space-x-2 rounded-lg bg-green-50 px-4 py-2 text-green-700">
                                    <Check className="h-4 w-4" />
                                    <span>Changes saved successfully</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    {/* Left Panel - Profile Overview */}
                    <div className="w-80 border-r p-6 shadow-sm">
                        {/* Profile Card */}
                        <div className="mb-8 text-center">
                            <div className="relative mb-4">
                                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                                    {user.avatar ? (
                                        <img src={`${getImageUrl()}${user.avatar}`} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-12 w-12 text-primary" />
                                    )}
                                </div>
                                <Button
                                    onClick={handleAvatarUpload}
                                    className="hover:bg-primary-light absolute right-1/2 bottom-0 translate-x-6 transform rounded-full bg-primary p-2 text-white shadow-lg"
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>

                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.user_type === 'staff' ? 'Staff Member' : 'Customer'}</p>

                            <div className="mt-3 flex items-center justify-center">
                                <div
                                    className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                        status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="capitalize">{status}</span>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                <div className="flex items-center justify-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Member since: {formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Completion */}
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                                <span className="text-sm text-gray-600">{completion_rate}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                    className="h-2 rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${completion_rate}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            {!isEditing ? (
                                <Button
                                    onClick={() => {
                                        setActiveTab('personal');
                                        setIsEditing(true);
                                    }}
                                    className="flex w-full items-center justify-center space-x-2 px-4 py-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Edit Profile</span>
                                </Button>
                            ) : (
                                <div className="flex space-x-3">
                                    <Button
                                        onClick={() => {
                                            setIsEditing(false);
                                            reset();
                                        }}
                                        className="flex w-full items-center justify-center space-x-2 px-4 py-2"
                                    >
                                        <X className="h-4 w-4" />
                                        <span>Cancel</span>
                                    </Button>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setActiveTab('security')}
                                className="flex w-full items-center justify-center space-x-2 px-4 py-2"
                            >
                                <Lock className="h-4 w-4" />
                                <span>Change Password</span>
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel - Tabbed Content */}
                    <div className="flex-1 p-6">
                        {/* Tab Navigation */}
                        <div className="mb-6 border-b border-gray-200">
                            <nav className="flex space-x-2 px-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center border-b-2 px-1 py-2 text-sm font-medium ${
                                                activeTab === tab.id ? 'border-accent' : 'border-transparent'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{tab.label}</span>
                                        </Button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="rounded-lg border p-6 shadow-sm">
                            {activeTab === 'personal' && (
                                <div>
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Personal Information</h3>
                                        {!isEditing ? (
                                            <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-4 py-2">
                                                <Edit className="h-4 w-4" />
                                                <span>Edit</span>
                                            </Button>
                                        ) : (
                                            <div className="flex space-x-3">
                                                <Button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        reset();
                                                    }}
                                                    className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span>Cancel</span>
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={processing}
                                                    className="hover:bg-primary-light flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-white"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Full Name</Label>
                                            <Input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Email Address</Label>
                                            <Input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Phone Number</Label>
                                            <Input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Gender</Label>
                                            <Select
                                                value={data.gender}
                                                onValueChange={(value) => handleInputChange('gender', value)}
                                                disabled={!isEditing}
                                            >
                                                <SelectTrigger
                                                    className={`w-full rounded-lg ${
                                                        isEditing
                                                            ? 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary'
                                                            : 'cursor-not-allowed border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    <SelectValue placeholder="Select Gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
                                        </div>

                                        <div>
                                            <DatePickerSimple
                                                id="dob"
                                                label="Date of Birth"
                                                disabled={!isEditing}
                                                date={date}
                                                onSelect={(selectedDate) => {
                                                    setDate(selectedDate);
                                                    setData('dob', selectedDate?.toISOString().split('T')[0] ?? '');
                                                }}
                                            />
                                            {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Occupation</Label>
                                            <Input
                                                type="text"
                                                value={data.occupation}
                                                onChange={(e) => handleInputChange('occupation', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.occupation && <p className="mt-1 text-sm text-red-500">{errors.occupation}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">NIN/SSN/RC/BN Number</Label>
                                            <Input
                                                type="text"
                                                value={data.nat_id}
                                                onChange={(e) => handleInputChange('nat_id', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.nat_id && <p className="mt-1 text-sm text-red-500">{errors.nat_id}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Marital Status</Label>
                                            <Select
                                                value={data.marital_status}
                                                onValueChange={(value) => handleInputChange('marital_status', value)}
                                                disabled={!isEditing}
                                            >
                                                <SelectTrigger
                                                    className={`w-full rounded-lg ${
                                                        isEditing
                                                            ? 'border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary'
                                                            : 'cursor-not-allowed border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="single">Single</SelectItem>
                                                    <SelectItem value="married">Married</SelectItem>
                                                    <SelectItem value="divorced">Divorced</SelectItem>
                                                    <SelectItem value="widowed">Widowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.marital_status && <p className="mt-1 text-sm text-red-500">{errors.marital_status}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label className="mb-2 block text-sm font-medium">Address</Label>
                                            <Input
                                                type="text"
                                                value={data.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">City</Label>
                                            <Input
                                                type="text"
                                                value={data.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">State</Label>
                                            <Input
                                                type="text"
                                                value={data.state}
                                                onChange={(e) => handleInputChange('state', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Postal Code</Label>
                                            <Input
                                                type="text"
                                                value={data.postal_code}
                                                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.postal_code && <p className="mt-1 text-sm text-red-500">{errors.postal_code}</p>}
                                        </div>

                                        <div>
                                            <Label className="mb-2 block text-sm font-medium">Country</Label>
                                            <Input
                                                type="text"
                                                value={data.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <h4 className="mb-4 text-sm font-semibold">Emergency Contact</h4>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                <div>
                                                    <Label className="mb-2 block text-sm font-medium">Name</Label>
                                                    <Input
                                                        type="text"
                                                        value={data.contact_name}
                                                        onChange={(e) => handleInputChange('contact_name', e.target.value)}
                                                        disabled={!isEditing}
                                                    />
                                                    {errors.contact_name && <p className="mt-1 text-sm text-red-500">{errors.contact_name}</p>}
                                                </div>
                                                <div>
                                                    <Label className="mb-2 block text-sm font-medium">Phone</Label>
                                                    <Input
                                                        type="tel"
                                                        value={data.contact_phone}
                                                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                                        disabled={!isEditing}
                                                    />
                                                    {errors.contact_phone && <p className="mt-1 text-sm text-red-500">{errors.contact_phone}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="contact_relationship">
                                                        Relationship<span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={data.contact_relationship}
                                                        onValueChange={(value) => handleInputChange('contact_relationship', value)}
                                                        disabled={!isEditing}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select relationship" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="spouse">Spouse</SelectItem>
                                                            <SelectItem value="parent">Parent</SelectItem>
                                                            <SelectItem value="sibling">Sibling</SelectItem>
                                                            <SelectItem value="child">Child</SelectItem>
                                                            <SelectItem value="friend">Friend</SelectItem>
                                                            <SelectItem value="staff">Staff</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.contact_relationship && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.contact_relationship}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div>
                                    <h3 className="mb-6 text-lg font-semibold">Account Settings</h3>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <Label className="mb-2 block text-sm font-medium">Preferred Language</Label>
                                                <select
                                                    value={data.language}
                                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="English">English</option>
                                                    <option value="French">French</option>
                                                    <option value="Hausa">Hausa</option>
                                                    <option value="Yoruba">Yoruba</option>
                                                    <option value="Igbo">Igbo</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label className="mb-2 block text-sm font-medium">Timezone</Label>
                                                <select
                                                    value={data.timezone}
                                                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                                                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                                                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Notification Preferences */}
                                        <div>
                                            <h4 className="text-md mb-4 font-semibold">Notification Preferences</h4>
                                            <div className="space-y-4">
                                                {(
                                                    [
                                                        {
                                                            key: 'email_notifications',
                                                            label: 'Email Notifications',
                                                            icon: Mail,
                                                            handler: handleToggleEmailNotifications,
                                                        },
                                                        {
                                                            key: 'sms_notifications',
                                                            label: 'SMS Notifications',
                                                            icon: Smartphone,
                                                            handler: handleToggleSmsNotifications,
                                                        },
                                                        {
                                                            key: 'push_notifications',
                                                            label: 'Push Notifications',
                                                            icon: Bell,
                                                            handler: handleTogglePushNotifications,
                                                        },
                                                        {
                                                            key: 'marketing_notifications',
                                                            label: 'Marketing Notifications',
                                                            icon: Globe,
                                                            handler: handleToggleMarketingNotifications,
                                                        },
                                                    ] as const
                                                ).map(({ key, label, icon: Icon, handler }) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <Icon className="h-5 w-5 text-gray-400" />
                                                            <div>
                                                                <p className="text-sm font-medium">{label}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    {key === 'email_notifications' && 'Receive updates via email'}
                                                                    {key === 'sms_notifications' && 'Receive SMS notifications'}
                                                                    {key === 'push_notifications' && 'Browser push notifications'}
                                                                    {key === 'marketing_notifications' && 'Marketing and promotional content'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={data[key]}
                                                            onCheckedChange={(checked) => handler(checked)}
                                                            disabled={processing}
                                                            className="cursor-pointer data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-6">
                                            <Button
                                                onClick={handleSave}
                                                disabled={processing}
                                                className="hover:bg-primary-light flex items-center space-x-2 rounded-lg bg-primary px-6 py-2 text-white"
                                            >
                                                <Save className="h-4 w-4" />
                                                <span>{processing ? 'Saving...' : 'Save Settings'}</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
                                    <AppearanceTabs />
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div>
                                    <h3 className="mb-6 text-lg font-semibold">Security Settings</h3>

                                    <div className="space-y-8">
                                        {/* Change Password */}
                                        <div>
                                            <h4 className="text-md mb-4 font-semibold">Change Password</h4>
                                            <div className="max-w-md space-y-4">
                                                <div>
                                                    <Label className="mb-2 block text-sm font-medium">Current Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            ref={currentPasswordInput}
                                                            type={showCurrentPassword ? 'text' : 'password'}
                                                            value={data.current_password}
                                                            onChange={(e) => handleInputChange('current_password', e.target.value)}
                                                            className={`w-full rounded-lg border px-3 py-2 pr-10 ${
                                                                errors.current_password ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                        >
                                                            {showCurrentPassword ? (
                                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {errors.current_password && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.current_password}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label className="mb-2 block text-sm font-medium">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            ref={passwordInput}
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            value={data.password}
                                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                                            className={`w-full rounded-lg border px-3 py-2 pr-10 ${
                                                                errors.password ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                        >
                                                            {showNewPassword ? (
                                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                                </div>

                                                <div>
                                                    <Label className="mb-2 block text-sm font-medium">Confirm New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            value={data.password_confirmation}
                                                            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                                            className={`w-full rounded-lg border px-3 py-2 pr-10 ${
                                                                errors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {errors.password_confirmation && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
                                                    )}
                                                </div>

                                                <Button
                                                    onClick={handleSave}
                                                    disabled={processing}
                                                    className="hover:bg-primary-light flex items-center space-x-2 rounded-lg bg-primary px-6 py-2 text-white"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    <span>{processing ? 'Updating...' : 'Update Password'}</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Two-Factor Authentication */}
                                        <div className="border-t pt-8">
                                            <div className="mb-6 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-md font-semibold">Two-Factor Authentication</h4>
                                                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                                </div>
                                                <Switch
                                                    id="2fa"
                                                    checked={security_settings?.two_factor_enabled}
                                                    onCheckedChange={handleToggle2FA}
                                                    disabled={processing}
                                                    className="cursor-pointer data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200"
                                                />
                                            </div>
                                            {security_settings?.two_factor_enabled ? (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Check className="h-5 w-5 text-green-600" />
                                                        <span className="text-sm font-medium text-green-800">
                                                            Two-factor authentication is enabled
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-green-700">Your account is protected with 2FA</p>
                                                </div>
                                            ) : (
                                                ''
                                            )}
                                        </div>

                                        {/* Login History */}
                                        <div className="border-t pt-8">
                                            <h4 className="text-md mb-4 font-semibold">Recent Login Activity</h4>
                                            <div className="space-y-3">
                                                {login_history.map((login) => {
                                                    const DeviceIcon = getDeviceIcon(login.device);
                                                    return (
                                                        <div key={login.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                                            <div className="flex items-center space-x-4">
                                                                <DeviceIcon className="h-5 w-5 text-gray-400" />
                                                                <div>
                                                                    <p className="text-sm font-medium capitalize">{login.device}</p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {login.os} • {login.browser}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {login.location} • {login.ip}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm">{formatDate(login.created_at)}</p>
                                                                {login.id === 1 && (
                                                                    <span className="inline-flex items-center space-x-1 text-xs text-green-600">
                                                                        <Wifi className="h-3 w-3" />
                                                                        <span>Current session</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="border-t pt-8">
                                            <h4 className="text-md mb-4 font-semibold text-red-900">Danger Zone</h4>
                                            <div className="space-y-3">
                                                <Button
                                                    variant="outline"
                                                    className="flex items-center space-x-2 rounded-lg border border-red-300 px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white"
                                                    asChild
                                                >
                                                    <Link href={route('logout')} method="post" as="button">
                                                        <LogOut className="h-4 w-4" />
                                                        <span>Logout from all devices</span>
                                                    </Link>
                                                </Button>
                                                <DeleteUser />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div>
                                    <h3 className="mb-6 text-lg font-semibold">Activity Log</h3>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="rounded-lg bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                        Action
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                        Date & Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                        Device
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                        IP Address
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {recent_activities.map((activity) => {
                                                    const DeviceIcon = getDeviceIcon(activity.device);
                                                    return (
                                                        <tr key={activity.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                                    <span className="text-sm font-medium">{activity.action}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm whitespace-nowrap">{formatDate(activity.created_at)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    <DeviceIcon className="h-4 w-4 text-gray-400" />
                                                                    <span className="text-sm">{activity.device}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm whitespace-nowrap">{activity.ip}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                                    Success
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-sm text-gray-600">Showing last 5 activities</p>
                                        <Button className="text-sm font-medium">View all activities</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default ProfilePage;
