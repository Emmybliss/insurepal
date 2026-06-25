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
    ShieldAlert,
    ShieldCheck,
    Upload,
    XCircle,
} from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface Broker {
    id: number;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    logo?: string;
}

interface KycRecord {
    id?: number;
    status: string;
    rc_number?: string;
    naicom_reg_number?: string;
    tin?: string;
    incorporation_cert_path?: string;
    naicom_license_path?: string;
    prof_indemnity_path?: string;
    identity_document_path?: string;
    address_document_path?: string; // Add to avoid lint errors if copied from customer
    verified_at?: string;
    notes?: string;
}

interface Props {
    broker: Broker;
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

export default function BrokerKyc({ broker, kyc }: Props) {
    const certRef = useRef<HTMLInputElement>(null);
    const licenseRef = useRef<HTMLInputElement>(null);
    const indemnityRef = useRef<HTMLInputElement>(null);

    const statusCfg = getStatusConfig(kyc?.status ?? 'pending');
    const StatusIcon = statusCfg.icon;

    const { data, setData, post, processing, errors } = useForm({
        status: kyc?.status ?? 'pending',
        notes: kyc?.notes ?? '',
        rc_number: kyc?.rc_number ?? '',
        naicom_reg_number: kyc?.naicom_reg_number ?? '',
        tin: kyc?.tin ?? '',
        incorporation_cert: null as File | null,
        naicom_license: null as File | null,
        prof_indemnity: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('brokers.kyc.update', broker.id), {
            forceFormData: true,
            onSuccess: () => toast.success('Broker KYC updated successfully'),
            onError: () => toast.error('Failed to update KYC'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: route('dashboard') },
                { title: 'Brokers', href: route('brokers.index') },
                { title: broker.company_name, href: route('brokers.show', broker.id) },
                { title: 'KYC Verification', href: '#' },
            ]}
        >
            <Head title={`KYC – ${broker.company_name}`} />
            <div className="flex-1 space-y-6 pt-4">
                {/* Page header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Broker KYC Management</h2>
                            <p className="text-sm font-medium text-amber-600">Underwriter Assistance Mode</p>
                        </div>
                    </div>
                    <Badge className={`flex items-center gap-1.5 border px-3 py-1.5 ${statusCfg.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                    </Badge>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-5">
                        {/* ── LEFT: Info & Uploaded View ── */}
                        <div className="space-y-4 lg:col-span-2">
                            {/* Profile Details */}
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building2 className="h-4 w-4 text-primary" />
                                        Broker Registration Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5">
                                    <div className="flex flex-col items-center gap-4 pb-4">
                                        <Avatar className="h-24 w-24 border-2 border-muted-foreground/25">
                                            <AvatarImage src={broker.logo ? `/storage/${broker.logo}` : ''} alt={broker.company_name} />
                                            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                                                {broker.company_name.substring(0, 1).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <Separator className="mb-2" />
                                    <div className="space-y-2">
                                        <Label htmlFor="rc_number" className="text-xs font-semibold text-muted-foreground uppercase">
                                            RC Number
                                        </Label>
                                        <Input
                                            id="rc_number"
                                            value={data.rc_number}
                                            onChange={(e) => setData('rc_number', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors.rc_number && <p className="text-[10px] text-destructive">{errors.rc_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="naicom_reg_number" className="text-xs font-semibold text-muted-foreground uppercase">
                                            NAICOM Reg Number
                                        </Label>
                                        <Input
                                            id="naicom_reg_number"
                                            value={data.naicom_reg_number}
                                            onChange={(e) => setData('naicom_reg_number', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors.naicom_reg_number && <p className="text-[10px] text-destructive">{errors.naicom_reg_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tin" className="text-xs font-semibold text-muted-foreground uppercase">
                                            TIN
                                        </Label>
                                        <Input id="tin" value={data.tin} onChange={(e) => setData('tin', e.target.value)} className="h-9" />
                                        {errors.tin && <p className="text-[10px] text-destructive">{errors.tin}</p>}
                                    </div>
                                    <Separator />
                                    <InfoRow label="Email" value={broker.contact_email} />
                                    <InfoRow label="Phone" value={broker.contact_phone} />
                                    <Separator />
                                    <InfoRow label="Address" value={`${broker.address}, ${broker.city}, ${broker.state}`} />
                                </CardContent>
                            </Card>

                            {/* Uploaded Docs (Broker Sync) */}
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileCheck2 className="h-4 w-4 text-primary" />
                                        Uploaded Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-5 text-sm">
                                    {[
                                        { label: 'Incorporation Certificate', path: kyc?.incorporation_cert_path },
                                        { label: 'NAICOM License', path: kyc?.naicom_license_path },
                                        { label: 'Professional Indemnity', path: kyc?.prof_indemnity_path },
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

                        {/* ── RIGHT: Management Grid ── */}
                        <div className="space-y-4 lg:col-span-3">
                            <Card className="border-muted/60 shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="h-5 w-5 text-primary" />
                                        Update KYC Documents
                                    </CardTitle>
                                    <CardDescription>Upload new versions of essential broker compliance documents.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {[
                                            {
                                                label: 'Incorporation Certificate',
                                                key: 'incorporation_cert',
                                                path: kyc?.incorporation_cert_path,
                                                ref: certRef,
                                                file: data.incorporation_cert,
                                                icon: FileText,
                                            },
                                            {
                                                label: 'NAICOM License',
                                                key: 'naicom_license',
                                                path: kyc?.naicom_license_path,
                                                ref: licenseRef,
                                                file: data.naicom_license,
                                                icon: CreditCard,
                                            },
                                            {
                                                label: 'Professional Indemnity',
                                                key: 'prof_indemnity',
                                                path: kyc?.prof_indemnity_path,
                                                ref: indemnityRef,
                                                file: data.prof_indemnity,
                                                icon: ShieldCheck,
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
                                                    {doc.file ? (
                                                        <span className="w-full truncate px-2 text-center font-medium text-primary">
                                                            {doc.file.name}
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
                                                {errors[doc.key as keyof typeof errors] && (
                                                    <p className="text-xs text-destructive">{errors[doc.key as keyof typeof errors]}</p>
                                                )}
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
                                            <Link href={route('brokers.show', broker.id)}>Cancel</Link>
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
