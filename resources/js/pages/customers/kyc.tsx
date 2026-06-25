import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Download,
    FileCheck2,
    FileText,
    MapPin,
    ShieldAlert,
    Upload,
    User,
    XCircle,
} from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    occupation?: string;
    annual_income?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    is_active: boolean;
    logo?: string;
    user?: {
        name: string;
        avatar_url?: string;
    };
    created_at: string;
}

interface KycRecord {
    id?: number;
    status: string;
    identity_type?: string;
    identity_number?: string;
    nin?: string;
    bvn?: string;
    identity_document_path?: string;
    address_document_path?: string;
    verified_at?: string;
    notes?: string;
    updated_at?: string;
}

interface Props {
    customer: Customer;
    kyc: KycRecord | null;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'verified':
            return { label: 'Verified', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        case 'rejected':
            return { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' };
        default:
            return { label: 'Pending Review', icon: AlertCircle, className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
};

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>
        {value ? (
            <p className="text-sm font-medium text-foreground">{value}</p>
        ) : (
            <p className="text-sm text-muted-foreground/50 italic">Not provided</p>
        )}
    </div>
);

export default function CustomerKyc({ customer, kyc }: Props) {
    const idDocRef = useRef<HTMLInputElement>(null);
    const addrDocRef = useRef<HTMLInputElement>(null);

    const getCustomerName = () =>
        customer.type === 'corporate' ? customer.company_name : `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();

    const statusCfg = getStatusConfig(kyc?.status ?? 'pending');
    const StatusIcon = statusCfg.icon;

    const { data, setData, post, processing, errors } = useForm({
        status: kyc?.status ?? 'pending',
        identity_type: kyc?.identity_type ?? '',
        identity_number: kyc?.identity_number ?? '',
        nin: kyc?.nin ?? '',
        bvn: kyc?.bvn ?? '',
        notes: kyc?.notes ?? '',
        identity_document: null as File | null,
        address_document: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('customers.kyc.update', customer.id), {
            forceFormData: true,
            onSuccess: () => toast.success('KYC updated successfully'),
            onError: () => toast.error('Failed to update KYC'),
        });
    };

    return (
        <AppLayout>
            <Head title={`KYC – ${getCustomerName()}`} />
            <div className="flex-1 space-y-6 pt-4">
                {/* Page header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Customer KYC Management</h2>
                            <p className="text-sm font-medium text-amber-600">Underwriter Assistance Mode</p>
                        </div>
                    </div>
                    <Badge className={`flex items-center gap-1.5 border px-3 py-1.5 ${statusCfg.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                    </Badge>
                </div>{' '}
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-5">
                        {/* ── LEFT: Customer Profile Info ── */}
                        <div className="space-y-4 lg:col-span-2">
                            {/* Identity */}
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        {customer.type === 'corporate' ? (
                                            <Building2 className="h-4 w-4 text-primary" />
                                        ) : (
                                            <User className="h-4 w-4 text-primary" />
                                        )}
                                        Customer Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 pt-5 text-sm">
                                    <div className="flex flex-col items-center gap-4 pb-4">
                                        <Avatar className="h-24 w-24 border-2 border-muted-foreground/25">
                                            <AvatarImage
                                                src={
                                                    customer.type === 'corporate'
                                                        ? customer.logo
                                                            ? `/storage/${customer.logo}`
                                                            : ''
                                                        : customer.user?.avatar_url
                                                }
                                                alt={customer.company_name || customer.first_name}
                                            />
                                            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                                                {(customer.company_name || customer.first_name || 'C').substring(0, 1).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <Separator className="mb-2" />
                                    {customer.type === 'individual' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoRow label="First Name" value={customer.first_name} />
                                                <InfoRow label="Last Name" value={customer.last_name} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoRow label="Gender" value={customer.gender} />
                                                <InfoRow
                                                    label="Date of Birth"
                                                    value={customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : undefined}
                                                />
                                            </div>
                                            <InfoRow label="Occupation" value={customer.occupation} />
                                            <InfoRow
                                                label="Annual Income"
                                                value={customer.annual_income ? `₦${parseInt(customer.annual_income).toLocaleString()}` : undefined}
                                            />
                                        </>
                                    ) : (
                                        <InfoRow label="Company Name" value={customer.company_name} />
                                    )}
                                    <Separator />
                                    <InfoRow label="Email" value={customer.email} />
                                    <InfoRow label="Phone" value={customer.phone} />
                                </CardContent>
                            </Card>

                            {/* Address */}
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 pt-5">
                                    <InfoRow label="Street Address" value={customer.address} />
                                    <div className="grid grid-cols-3 gap-4">
                                        <InfoRow label="City" value={customer.city} />
                                        <InfoRow label="State" value={customer.state} />
                                        <InfoRow label="Country" value={customer.country} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Uploaded Docs (Customer View) */}
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileCheck2 className="h-4 w-4 text-primary" />
                                        Uploaded Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-5 text-sm">
                                    {[
                                        { label: 'Identity Document', path: kyc?.identity_document_path },
                                        { label: 'Address Proof', path: kyc?.address_document_path },
                                    ].map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{doc.label}</span>
                                            </div>
                                            {doc.path ? (
                                                <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer">
                                                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
                                                        <Download className="h-3.5 w-3.5" /> View
                                                    </Button>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                                            )}
                                        </div>
                                    ))}

                                    {kyc?.verified_at && (
                                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Verified on {new Date(kyc.verified_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── RIGHT: Management Form ── */}
                        <div className="space-y-4 lg:col-span-3">
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5 text-primary" />
                                        KYC Verification Details
                                    </CardTitle>
                                    <CardDescription>Update identity verification details and manage document uploads.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    {/* Identity Info */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="identity_type" className="text-sm font-semibold">
                                                Identity Type
                                            </Label>
                                            <Select value={data.identity_type} onValueChange={(v) => setData('identity_type', v)}>
                                                <SelectTrigger id="identity_type" className="bg-muted/20">
                                                    <SelectValue placeholder="Select type…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="national_id">National ID</SelectItem>
                                                    <SelectItem value="international_passport">International Passport</SelectItem>
                                                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                                                    <SelectItem value="voters_card">Voter's Card</SelectItem>
                                                    <SelectItem value="bvn">BVN</SelectItem>
                                                    <SelectItem value="nin">NIN</SelectItem>
                                                    <SelectItem value="cac_certificate">CAC Certificate (Corporate)</SelectItem>
                                                    <SelectItem value="tin">TIN</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="identity_number" className="text-sm font-semibold">
                                                Identity Number
                                            </Label>
                                            <Input
                                                id="identity_number"
                                                value={data.identity_number}
                                                onChange={(e) => setData('identity_number', e.target.value)}
                                                placeholder="Enter ID number"
                                                className="bg-muted/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="nin" className="text-sm font-semibold">
                                                NIN (National Identification Number)
                                            </Label>
                                            <Input
                                                id="nin"
                                                value={data.nin}
                                                onChange={(e) => setData('nin', e.target.value)}
                                                placeholder="Enter 11-digit NIN"
                                                maxLength={11}
                                                className="bg-muted/20"
                                            />
                                            {errors.nin && <p className="text-xs text-destructive">{errors.nin}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bvn" className="text-sm font-semibold">
                                                BVN (Bank Verification Number)
                                            </Label>
                                            <Input
                                                id="bvn"
                                                value={data.bvn}
                                                onChange={(e) => setData('bvn', e.target.value)}
                                                placeholder="Enter 11-digit BVN"
                                                maxLength={11}
                                                className="bg-muted/20"
                                            />
                                            {errors.bvn && <p className="text-xs text-destructive">{errors.bvn}</p>}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Document Uploads */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            {
                                                label: 'Identity Document',
                                                key: 'identity_document',
                                                path: kyc?.identity_document_path,
                                                ref: idDocRef,
                                                icon: CreditCard,
                                            },
                                            {
                                                label: 'Address Proof',
                                                key: 'address_document',
                                                path: kyc?.address_document_path,
                                                ref: addrDocRef,
                                                icon: MapPin,
                                            },
                                        ].map((doc) => (
                                            <div key={doc.key} className="space-y-2">
                                                <Label className="flex items-center gap-1 text-sm font-semibold">
                                                    <doc.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {doc.label}
                                                </Label>
                                                <div
                                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 py-8 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                                                    onClick={() => (doc.ref.current as any)?.click()}
                                                >
                                                    <Upload className="h-6 w-6 opacity-50" />
                                                    {data[doc.key as keyof typeof data] ? (
                                                        <span className="w-full truncate px-2 text-center font-medium text-primary">
                                                            {(data[doc.key as keyof typeof data] as unknown as File).name}
                                                        </span>
                                                    ) : (
                                                        <span className="flex flex-col gap-0.5 px-4 text-center">
                                                            <span>{doc.path ? 'Drop new file to update' : 'Click to upload'}</span>
                                                            <span className="text-[10px] opacity-70">(PDF, JPG, PNG ≤ 5MB)</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    ref={doc.ref as any}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="hidden"
                                                    onChange={(e) => (setData as any)(doc.key, e.target.files?.[0] ?? null)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ShieldAlert className="h-4 w-4 text-primary" />
                                        Final Verification & Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-sm font-semibold">
                                                Verification Status <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                                <SelectTrigger id="status" className="h-10 bg-muted/20">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">⏳ Pending Review</SelectItem>
                                                    <SelectItem value="verified">✅ Verified</SelectItem>
                                                    <SelectItem value="rejected">❌ Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm font-semibold">
                                            Internal Review Notes
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Provide reasons for approval or rejection..."
                                            rows={4}
                                            className="resize-none bg-muted/20"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t pt-4">
                                        <Button variant="outline" asChild className="h-10 px-6">
                                            <Link href={route('customers.show', customer.id)}>Cancel</Link>
                                        </Button>
                                        <Button type="submit" disabled={processing} className="h-10 px-8">
                                            {processing ? 'Saving Changes...' : 'Update Review & Status'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
