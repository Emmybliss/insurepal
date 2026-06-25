import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { Building2, Calendar, Mail, MapPin, Percent, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

export default function BrokerCreate() {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Brokers', href: route('brokers.index') },
        { title: 'Create Broker', href: '#' },
    ];

    return (
        <>
            <Head title="Create New Broker" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create New Broker</h1>
                            <p className="text-muted-foreground">Add a new broker to your network</p>
                        </div>
                    </div>

                    <Form
                        action={route('brokers.store')}
                        method="post"
                        className="space-y-6"
                        onStart={() => {
                            toast.loading('Creating broker account...', { id: 'create-broker' });
                        }}
                        onSuccess={() => {
                            toast.success('Broker created successfully!', {
                                id: 'create-broker',
                                description: 'The broker account has been set up and login credentials sent',
                                duration: 5000,
                            });
                        }}
                        onError={(errors) => {
                            console.log(errors);
                            toast.error('Failed to create broker', {
                                id: 'create-broker',
                                description: 'Please check the form errors and try again',
                                duration: 5000,
                            });
                        }}
                    >
                        {({ data, setData, processing, errors }) => (
                            <>
                                {/* Company Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Company Information
                                        </CardTitle>
                                        <CardDescription>Basic information about the broker company</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="company_name">Company Name</Label>
                                                <CompanySearchCombobox
                                                    companyType="broker"
                                                    value={data.company_name}
                                                    scope="registry"
                                                    onSelect={(company) => {
                                                        setData({
                                                            ...data,
                                                            company_name: company.name,
                                                            contact_email: company.email || data.contact_email,
                                                            contact_phone: company.phone || data.contact_phone,
                                                            address: company.address || data.address,
                                                            known_company_id: company.id,
                                                            known_company_source: company.source,
                                                        });
                                                    }}
                                                    placeholder="Search for a broker..."
                                                />
                                                <input type="hidden" name="company_name" value={data.company_name} />
                                                <input type="hidden" name="known_company_id" value={data.known_company_id || ''} />
                                                <input type="hidden" name="known_company_source" value={data.known_company_source || ''} />
                                                <InputError message={errors.company_name} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="contact_phone">Company Phone</Label>
                                                <div className="relative">
                                                    <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                    <Input
                                                        id="contact_phone"
                                                        name="contact_phone"
                                                        type="tel"
                                                        placeholder="+234 xxx xxx xxxx"
                                                        className="pl-10"
                                                        required
                                                        value={data.contact_phone || ''}
                                                        onChange={(e) => setData('contact_phone', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.contact_phone} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="contact_email">Company Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                <Input
                                                    id="contact_email"
                                                    name="contact_email"
                                                    type="email"
                                                    placeholder="company@example.com"
                                                    className="pl-10"
                                                    required
                                                    value={data.contact_email || ''}
                                                    onChange={(e) => setData('contact_email', e.target.value)}
                                                />
                                            </div>
                                            <InputError message={errors.contact_email} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                                <Textarea
                                                    id="address"
                                                    name="address"
                                                    placeholder="Enter company address"
                                                    className="min-h-[80px] pl-10"
                                                    value={data.address || ''}
                                                    onChange={(e) => setData('address', e.target.value)}
                                                />
                                            </div>
                                            <InputError message={errors.address} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input id="city" name="city" type="text" placeholder="Lagos" />
                                                <InputError message={errors.city} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input id="state" name="state" type="text" placeholder="Lagos State" />
                                                <InputError message={errors.state} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="postal_code">Postal Code</Label>
                                                <Input id="postal_code" name="postal_code" type="text" placeholder="100001" />
                                                <InputError message={errors.postal_code} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input id="country" name="country" type="text" defaultValue="Nigeria" />
                                                <InputError message={errors.country} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="logo">Company Logo</Label>
                                                <Input
                                                    id="logo"
                                                    name="logo"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // File input within Form component handles submission automatically
                                                        }
                                                    }}
                                                />
                                                <p className="mt-1 text-[10px] text-muted-foreground">
                                                    Recommended: Square image, max 2MB (JPG, PNG)
                                                </p>
                                                <InputError message={errors.logo} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Primary Contact */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Primary Contact
                                        </CardTitle>
                                        <CardDescription>Primary contact person who will manage this broker account</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="primary_contact_name">Contact Name</Label>
                                                <Input
                                                    id="primary_contact_name"
                                                    name="primary_contact_name"
                                                    type="text"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                                <InputError message={errors.primary_contact_name} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="primary_contact_email">Contact Email</Label>
                                                <div className="relative">
                                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                    <Input
                                                        id="primary_contact_email"
                                                        name="primary_contact_email"
                                                        type="email"
                                                        placeholder="john@company.com"
                                                        className="pl-10"
                                                        required
                                                    />
                                                </div>
                                                <InputError message={errors.primary_contact_email} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Business Settings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Percent className="h-5 w-5" />
                                            Business Settings
                                        </CardTitle>
                                        <CardDescription>Commission rates and payment terms for this broker</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                                <div className="relative">
                                                    <Percent className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                    <Input
                                                        id="commission_rate"
                                                        name="commission_rate"
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        step="0.1"
                                                        placeholder="10.0"
                                                        defaultValue="10"
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <InputError message={errors.commission_rate} />
                                                <p className="text-xs text-muted-foreground">Default commission rate for this broker</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                                    <Input
                                                        id="payment_terms"
                                                        name="payment_terms"
                                                        type="number"
                                                        min="1"
                                                        max="365"
                                                        placeholder="30"
                                                        defaultValue="30"
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <InputError message={errors.payment_terms} />
                                                <p className="text-xs text-muted-foreground">Number of days for payment settlement</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Submit Actions */}
                                <div className="flex items-center justify-end gap-4">
                                    <Link href={route('brokers.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating Broker...' : 'Create Broker'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </AppLayout>
        </>
    );
}
