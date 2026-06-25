import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Edit, MapPin, Shield, XCircle } from 'lucide-react';

interface InsuranceCompany {
    id: number;
    name: string;
    company_type: 'underwriter' | 'broker' | 'both';
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    naicom_reg_number: string | null;
    ncrib_reg_number: string | null;
    rc_number: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    company: InsuranceCompany;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Super Admin', href: route('admin.dashboard') },
    { title: 'Insurance Companies', href: route('admin.insurance-companies.index') },
    { title: 'View Company', href: route('admin.insurance-companies.show', { company: ':id' }) },
];

const COMPANY_TYPE_LABELS: Record<string, string> = {
    underwriter: 'Underwriter',
    broker: 'Broker',
    both: 'Both (Underwriter & Broker)',
};

export default function InsuranceCompaniesShow({ company }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Insurance Company`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
                        <p className="text-muted-foreground">Insurance company details</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.insurance-companies.edit', company.id)}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Link href={route('admin.insurance-companies.index')}>
                            <Button variant="outline">Back to List</Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Basic Information
                            </div>
                            {!company.is_active && (
                                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                    <XCircle className="h-3 w-3" />
                                    Inactive
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Company Type</p>
                                <p className="font-medium">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            company.company_type === 'underwriter'
                                                ? 'bg-blue-100 text-blue-800'
                                                : company.company_type === 'broker'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-purple-100 text-purple-800'
                                        }`}
                                    >
                                        <Shield className="mr-1 h-3 w-3" />
                                        {COMPANY_TYPE_LABELS[company.company_type]}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="font-medium">{company.is_active ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">NAICOM Reg Number</p>
                                <p className="font-medium">{company.naicom_reg_number || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">NCRIB Reg Number</p>
                                <p className="font-medium">{company.ncrib_reg_number || '—'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">CAC RC Number</p>
                            <p className="font-medium">{company.rc_number || '—'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{company.email || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{company.phone || '—'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Website</p>
                            <p className="font-medium">{company.website || '—'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{company.address || '—'}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">City</p>
                                <p className="font-medium">{company.city || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">State</p>
                                <p className="font-medium">{company.state || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Country</p>
                                <p className="font-medium">{company.country || '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {company.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{company.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}