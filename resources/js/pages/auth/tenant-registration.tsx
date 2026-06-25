import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Building, Eye, EyeOff, User } from 'lucide-react';
import { useState } from 'react';

interface FormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name: string;
    tenant_type: 'underwriter' | 'broker' | '';
    phone: string;
    address: string;
    'cf-turnstile-response': string;
}

export default function TenantRegistration() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        tenant_type: '',
        phone: '',
        address: '',
        'cf-turnstile-response': '',
    });

    const { turnstile } = usePage().props as any;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register/tenant');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
            <Head title="Register Your Insurance Business" />

            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                            <Building className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">Start Your Insurance Business</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Join thousands of brokers and underwriters managing their business with Insure Pal
                    </p>
                </div>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Create Your Account</CardTitle>
                        <CardDescription>Get started with a 14-day free trial. No credit card required.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Business Type */}
                            <div className="space-y-2">
                                <Label htmlFor="tenant_type">I am a</Label>
                                <Select value={data.tenant_type} onValueChange={(value: 'underwriter' | 'broker') => setData('tenant_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your business type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="underwriter">
                                            <div className="flex items-center">
                                                <Building className="mr-2 h-4 w-4" />
                                                <div>
                                                    <p className="font-medium">Underwriter</p>
                                                    <p className="text-sm text-muted-foreground">I underwrite and issue insurance policies</p>
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="broker">
                                            <div className="flex items-center">
                                                <User className="mr-2 h-4 w-4" />
                                                <div>
                                                    <p className="font-medium">Broker</p>
                                                    <p className="text-sm text-muted-foreground">I sell insurance products to customers</p>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.tenant_type} />
                            </div>

                            {/* Personal Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="john@company.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            {/* Company Information */}
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="Your Insurance Company Ltd"
                                />
                                <InputError message={errors.company_name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+234 800 000 0000"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Business Address</Label>
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="123 Business Street, Lagos, Nigeria"
                                        rows={3}
                                    />
                                    <InputError message={errors.address} />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter secure password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm password"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>
                            </div>

                            <div>
                                <Turnstile
                                    siteKey={turnstile.siteKey}
                                    onSuccess={(token) => setData('cf-turnstile-response', token)}
                                    onExpire={() => setData('cf-turnstile-response', '')}
                                />
                                {errors['cf-turnstile-response'] && <InputError message={errors['cf-turnstile-response']} />}
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <div className="text-sm">
                                    Already have an account?{' '}
                                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                        Sign in
                                    </Link>
                                </div>
                                <Button type="submit" disabled={processing} className="ml-3">
                                    {processing ? 'Creating Account...' : 'Start Free Trial'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        By creating an account, you agree to our{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
