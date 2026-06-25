import { Head, usePage } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Building2, LoaderCircle, Users } from 'lucide-react';
import { useState } from 'react';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useFormAction } from '@/hooks/use-form-action';
import AuthLayout from '@/layouts/auth-layout';

export default function RegisterSubscriber() {
    const [tenantType, setTenantType] = useState<'underwriter' | 'broker'>('broker');

    const { data, setData, processing, errors, post } = useFormAction({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        type: 'broker',
        admin_name: '',
        admin_email: '',
        password: '',
        password_confirmation: '',
        'cf-turnstile-response': '',
        known_company_id: '',
        known_company_source: '',
    });

    const { turnstile } = usePage().props as any;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register-subscriber');
    };

    return (
        <AuthLayout title="Create Subscriber Account" description="Register your company to start using Insure Pal">
            <Head title="Register Subscriber" />
            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    {/* Tenant Type Selection */}
                    <div className="grid gap-4">
                        <Label className="text-base font-semibold">Account Type</Label>
                        <RadioGroup
                            value={data.type}
                            onValueChange={(value: 'underwriter' | 'broker') => {
                                setData('type', value);
                                setTenantType(value);
                            }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50">
                                <RadioGroupItem value="broker" id="broker" />
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <Label htmlFor="broker" className="cursor-pointer font-medium">
                                            Broker
                                        </Label>
                                        <p className="text-xs text-muted-foreground">Manage policies for individual and corporate clients</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50">
                                <RadioGroupItem value="underwriter" id="underwriter" />
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <Label htmlFor="underwriter" className="cursor-pointer font-medium">
                                            Underwriter
                                        </Label>
                                        <p className="text-xs text-muted-foreground">Issue policies and manage broker relationships</p>
                                    </div>
                                </div>
                            </div>
                        </RadioGroup>
                        <InputError message={errors.type} />
                    </div>

                    {/* Company Details */}
                    <div className="grid gap-4">
                        <h3 className="text-base font-semibold">Company Information</h3>

                        <div className="grid gap-2">
                            <Label htmlFor="company_name">Company Name *</Label>
                            <CompanySearchCombobox
                                companyType={tenantType}
                                value={data.company_name}
                                scope="registry"
                                onSelect={(company) => {
                                    setData({
                                        ...data,
                                        company_name: company.name,
                                        email: company.email || data.email,
                                        phone: company.phone || data.phone,
                                        address: company.address || data.address,
                                        known_company_id: company.id,
                                        known_company_source: company.source,
                                    });
                                }}
                                placeholder={`Search for a ${tenantType}...`}
                            />
                            <InputError message={errors.company_name} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Company Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="company@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+234 xxx xxx xxxx"
                                />
                                <InputError message={errors.phone} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Company Address</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Enter your company address"
                                rows={3}
                            />
                            <InputError message={errors.address} />
                        </div>
                    </div>

                    {/* Admin User Details */}
                    <div className="grid gap-4">
                        <h3 className="text-base font-semibold">Administrator Account</h3>

                        <div className="grid gap-2">
                            <Label htmlFor="admin_name">Full Name *</Label>
                            <Input
                                id="admin_name"
                                type="text"
                                required
                                value={data.admin_name}
                                onChange={(e) => setData('admin_name', e.target.value)}
                                placeholder="Administrator full name"
                            />
                            <InputError message={errors.admin_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="admin_email">Admin Email *</Label>
                            <Input
                                id="admin_email"
                                type="email"
                                required
                                value={data.admin_email}
                                onChange={(e) => setData('admin_email', e.target.value)}
                                placeholder="admin@company.com"
                            />
                            <InputError message={errors.admin_email} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Confirm password"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <Turnstile
                            siteKey={turnstile.siteKey}
                            onSuccess={(token) => setData('cf-turnstile-response', token)}
                            onExpire={() => setData('cf-turnstile-response', '')}
                        />
                        {errors['cf-turnstile-response'] && <InputError message={errors['cf-turnstile-response']} />}
                    </div>

                    <Button type="submit" className="mt-4 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Create {tenantType === 'broker' ? 'Broker' : 'Underwriter'} Account
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-4 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <a
                        href={route('auth.google')}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </a>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account? <TextLink href="/login">Log in</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
