import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle2, CreditCard, Download, FileText, ShieldCheck, Upload, XCircle } from 'lucide-react';
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
    logo?: string;
    user?: {
        name: string;
        avatar_url?: string;
    };
}

interface KycRecord {
    id?: number;
    status: string;
    identity_type?: string;
    identity_number?: string;
    identity_document_path?: string;
    address_document_path?: string;
    nin?: string;
    bvn?: string;
    verified_at?: string;
    notes?: string;
}

interface Props {
    customer: Customer;
    kyc: KycRecord | null;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string; desc: string }> = {
    verified: {
        label: 'Verified',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        desc: 'Your identity has been verified. No further action required.',
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        className: 'border-red-200 bg-red-50 text-red-700',
        desc: 'Your KYC submission was rejected. Please re-upload your documents.',
    },
    pending: {
        label: 'Pending Review',
        icon: AlertCircle,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        desc: 'Your documents are under review. We will notify you once verified.',
    },
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

export default function CustomerPortalKyc({ customer, kyc }: Props) {
    const idDocRef = useRef<HTMLInputElement>(null);
    const addrDocRef = useRef<HTMLInputElement>(null);

    const name = customer.type === 'corporate' ? customer.company_name : `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();

    const currentStatus = kyc?.status ?? 'pending';
    const statusCfg = statusConfig[currentStatus] ?? statusConfig['pending'];
    const StatusIcon = statusCfg.icon;

    const { data, setData, post, processing, errors } = useForm({
        identity_type: kyc?.identity_type ?? '',
        identity_number: kyc?.identity_number ?? '',
        nin: kyc?.nin ?? '',
        bvn: kyc?.bvn ?? '',
        identity_document: null as File | null,
        address_document: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('customer.kyc.update'), {
            forceFormData: true,
            onSuccess: () => toast.success('Your KYC information has been submitted for review.'),
            onError: () => toast.error('Failed to submit KYC information.'),
        });
    };

    return (
        <AppLayout>
            <Head title="My KYC Verification" />
            <div className="flex-1 space-y-6 pt-4">
                {/* Page header */}
                <div className="flex flex-col gap-2">
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        My KYC Verification
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Keep your identity documents up to date to ensure seamless access to policy services.
                    </p>
                </div>

                {/* Status Banner */}
                <div className={`flex items-start gap-3 rounded-xl border p-4 ${statusCfg.className}`}>
                    <StatusIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">{statusCfg.label}</p>
                        <p className="mt-0.5 text-sm">{statusCfg.desc}</p>
                        {kyc?.verified_at && (
                            <p className="mt-1 flex items-center gap-1 text-xs">
                                <Calendar className="h-3 w-3" />
                                Verified on {new Date(kyc.verified_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* ── LEFT: Profile snapshot ── */}
                    <div className="space-y-4 lg:col-span-2">
                        <Card className="border-muted/60 shadow-sm">
                            <CardHeader className="border-b bg-muted/10 pb-4">
                                <CardTitle className="flex items-center justify-between text-base">Your Profile Info</CardTitle>
                                <CardDescription>This information is used for KYC verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-5">
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
                                <InfoRow label="Full Name / Company" value={name} />
                                <InfoRow label="Email" value={customer.email} />
                                <InfoRow label="Phone" value={customer.phone} />
                                {customer.type === 'individual' && (
                                    <>
                                        <InfoRow
                                            label="Date of Birth"
                                            value={customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : undefined}
                                        />
                                        <InfoRow label="Gender" value={customer.gender} />
                                        <InfoRow label="Occupation" value={customer.occupation} />
                                    </>
                                )}
                                <Separator />
                                <InfoRow label="Address" value={customer.address} />
                                <InfoRow label="City / State" value={[customer.city, customer.state].filter(Boolean).join(', ')} />
                                <InfoRow label="Country" value={customer.country} />
                            </CardContent>
                        </Card>

                        {/* Existing docs status */}
                        <Card className="border-muted/60 shadow-sm">
                            <CardHeader className="border-b bg-muted/10 pb-4">
                                <CardTitle className="text-base">Uploaded Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-5">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Identity Document</span>
                                    </div>
                                    {kyc?.identity_document_path ? (
                                        <a href={`/storage/${kyc.identity_document_path}`} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm" className="gap-1 text-primary">
                                                <Download className="h-3.5 w-3.5" /> View
                                            </Button>
                                        </a>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">
                                            Not uploaded
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Address Proof</span>
                                    </div>
                                    {kyc?.address_document_path ? (
                                        <a href={`/storage/${kyc.address_document_path}`} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm" className="gap-1 text-primary">
                                                <Download className="h-3.5 w-3.5" /> View
                                            </Button>
                                        </a>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">
                                            Not uploaded
                                        </Badge>
                                    )}
                                </div>
                                {kyc?.notes && currentStatus === 'rejected' && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                        <p className="mb-0.5 font-semibold">Review notes:</p>
                                        <p>{kyc.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── RIGHT: Submission form ── */}
                    <div className="lg:col-span-3">
                        <Card className="border-muted/60 shadow-sm">
                            <CardHeader className="border-b bg-muted/10 pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Submit / Update KYC Documents
                                </CardTitle>
                                <CardDescription>
                                    Upload a valid government-issued ID and proof of address. Uploading new documents will reset your status to{' '}
                                    <strong>Pending</strong> for review.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Identity fields */}
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
                                                placeholder="Enter your ID number"
                                                className="bg-muted/20"
                                            />
                                            {errors.identity_number && <p className="text-xs text-destructive">{errors.identity_number}</p>}
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

                                    {/* File uploads */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">
                                                Identity Document <span className="font-normal text-muted-foreground">(PDF, JPG, PNG ≤ 5MB)</span>
                                            </Label>
                                            <div
                                                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 py-7 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                                                onClick={() => idDocRef.current?.click()}
                                            >
                                                <Upload className="h-6 w-6 opacity-50" />
                                                {data.identity_document ? (
                                                    <span className="px-2 text-center font-medium text-primary">{data.identity_document.name}</span>
                                                ) : (
                                                    <span className="px-2 text-center">Click to upload ID document</span>
                                                )}
                                            </div>
                                            <input
                                                ref={idDocRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) => setData('identity_document', e.target.files?.[0] ?? null)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">
                                                Address / Proof of Residence{' '}
                                                <span className="font-normal text-muted-foreground">(PDF, JPG, PNG ≤ 5MB)</span>
                                            </Label>
                                            <div
                                                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 py-7 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                                                onClick={() => addrDocRef.current?.click()}
                                            >
                                                <Upload className="h-6 w-6 opacity-50" />
                                                {data.address_document ? (
                                                    <span className="px-2 text-center font-medium text-primary">{data.address_document.name}</span>
                                                ) : (
                                                    <span className="px-2 text-center">Click to upload address proof</span>
                                                )}
                                            </div>
                                            <input
                                                ref={addrDocRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) => setData('address_document', e.target.files?.[0] ?? null)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing} className="min-w-[180px]">
                                            {processing ? 'Submitting…' : 'Submit for Verification'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
