import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import useFlashToast from '@/hooks/useFlashToast';
import { Head, useForm } from '@inertiajs/react';
import { Building2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface Tenant {
    id: number;
    name: string;
    company_name?: string;
    type?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    naicom_reg_number?: string;
    cac_reg_number?: string;
    website?: string;
}

interface Props {
    tenant: Tenant;
}

export default function CompanyDetails({ tenant }: Props) {
    useFlashToast();
    const { data, setData, post, processing, errors } = useForm({
        company_name: tenant?.company_name || tenant?.name || '',
        type: tenant?.type || '',
        address: tenant?.address || '',
        city: tenant?.city || '',
        state: tenant?.state || '',
        country: tenant?.country || 'Nigeria',
        phone: tenant?.phone || '',
        email: tenant?.email || '',
        naicom_reg_number: tenant?.naicom_reg_number || '',
        cac_reg_number: tenant?.cac_reg_number || '',
        website: tenant?.website || '',
        known_company_id: (tenant as any).known_company_id || '',
        known_company_source: (tenant as any).known_company_source || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('onboarding.save-company-details'), {
            onError: (errors) => {
                console.error('Failed to save details', errors);
                toast.error('Failed to onboard tenant');
            },
        });
    };

    return (
        <>
            <Head title="Complete Your Profile" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Complete Your Company Profile</h1>
                        <p className="mt-4 text-lg text-gray-600">Just a few more details to get you started</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Plan Selected</span>
                            </div>
                            <div className="h-0.5 w-16 bg-green-600"></div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-900">Payment Complete</span>
                            </div>
                            <div className="h-0.5 w-16 bg-primary"></div>
                            <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-white">3</div>
                                <span className="ml-2 text-sm font-medium text-primary">Company Details</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>This information will be used on your policies, certificates, and other documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Business Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Business Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select your business type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="underwriter">Underwriter</SelectItem>
                                            <SelectItem value="broker">Broker</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company_name">
                                        Company Name <span className="text-red-500">*</span>
                                    </Label>
                                    <CompanySearchCombobox
                                        companyType={data.type as any || 'all'}
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
                                                naicom_reg_number: company.naicom_reg_number || data.naicom_reg_number,
                                            });
                                        }}
                                        placeholder="Search for your company..."
                                    />
                                    {errors.company_name && <p className="text-sm text-red-600">{errors.company_name}</p>}
                                </div>

                                {/* Contact Information */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Company Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="company@example.com"
                                            required
                                        />
                                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">
                                            Phone Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+234 xxx xxxx xxx"
                                            required
                                        />
                                        {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">
                                        Street Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Enter your company address"
                                        rows={3}
                                        required
                                    />
                                    {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                                </div>

                                {/* Location */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">
                                            City <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Lagos"
                                            required
                                        />
                                        {errors.city && <p className="text-sm text-red-600">{errors.city}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">
                                            State <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder="Lagos"
                                            required
                                        />
                                        {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">
                                            Country <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="country"
                                            type="text"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            placeholder="Nigeria"
                                            required
                                        />
                                        {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
                                    </div>
                                </div>

                                {/* Optional Information */}
                                <div className="border-t pt-6">
                                    <h3 className="mb-4 text-lg font-semibold">Additional Information (Optional)</h3>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="naicom_reg_number">NAICOM Registration Number</Label>
                                            <Input
                                                id="naicom_reg_number"
                                                type="text"
                                                value={data.naicom_reg_number}
                                                onChange={(e) => setData('naicom_reg_number', e.target.value)}
                                                placeholder="Enter NAICOM registration number"
                                            />
                                            {errors.naicom_reg_number && <p className="text-sm text-red-600">{errors.naicom_reg_number}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cac_reg_number">CAC Registration Number</Label>
                                            <Input
                                                id="cac_reg_number"
                                                type="text"
                                                value={data.cac_reg_number}
                                                onChange={(e) => setData('cac_reg_number', e.target.value)}
                                                placeholder="Enter CAC registration number"
                                            />
                                            {errors.cac_reg_number && <p className="text-sm text-red-600">{errors.cac_reg_number}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                            placeholder="https://www.yourcompany.com"
                                        />
                                        {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-4 border-t pt-6">
                                    <Button type="submit" disabled={processing} size="lg" className="min-w-[200px]">
                                        {processing ? 'Saving...' : 'Complete Setup'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Need help? Contact our support team at{' '}
                            <a href="mailto:support@insurepal.app" className="text-primary hover:underline">
                                support@insurepal.app
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
