import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle2, Download, FileText, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface Tenant {
    id: number;
    company_name: string;
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
    verified_at?: string;
    notes?: string;
}

interface Props {
    tenant: Tenant;
    kyc: KycRecord | null;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string; desc: string }> = {
    verified: {
        label: 'Verified',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        desc: 'Your business KYC has been verified. You are compliant with NAICOM regulations.',
    },
    rejected: {
        label: 'Rejected',
        icon: XCircle,
        className: 'border-red-200 bg-red-50 text-red-700',
        desc: 'Your KYC submission was rejected. Please review the notes and re-upload documents.',
    },
    pending: {
        label: 'Pending Review',
        icon: AlertCircle,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        desc: 'Your business documents are under review by the underwriter.',
    },
};

export default function BrokerSettingsKyc({ kyc }: Props) {
    const certRef = useRef<HTMLInputElement>(null);
    const licenseRef = useRef<HTMLInputElement>(null);
    const indemnityRef = useRef<HTMLInputElement>(null);

    const currentStatus = kyc?.status ?? 'pending';
    const statusCfg = statusConfig[currentStatus] ?? statusConfig['pending'];
    const StatusIcon = statusCfg.icon;

    const { data, setData, post, processing, errors } = useForm({
        rc_number: kyc?.rc_number ?? '',
        naicom_reg_number: kyc?.naicom_reg_number ?? '',
        tin: kyc?.tin ?? '',
        incorporation_cert: null as File | null,
        naicom_license: null as File | null,
        prof_indemnity: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.broker-kyc.update'), {
            forceFormData: true,
            onSuccess: () => toast.success('KYC documents submitted successfully.'),
            onError: () => toast.error('Failed to submit documents.'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Settings', href: route('settings.index') },
                { title: 'KYC Verification', href: '#' },
            ]}
        >
            <Head title="Business KYC Verification" />
            <div className="flex-1 space-y-6 pt-4">
                <div className="flex flex-col gap-2">
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Business KYC Verification
                    </h2>
                    <p className="text-sm text-muted-foreground">Submit your business registration and licensing documents for NAICOM compliance.</p>
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

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/10">
                                <CardTitle className="text-base font-semibold">Verification Details</CardTitle>
                                <CardDescription>Enter your official registration numbers and upload supporting documents.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="rc_number" className="text-sm font-semibold">
                                                RC Number
                                            </Label>
                                            <Input
                                                id="rc_number"
                                                value={data.rc_number}
                                                onChange={(e) => setData('rc_number', e.target.value)}
                                                placeholder="e.g. RC123456"
                                                className="bg-muted/20"
                                            />
                                            {errors.rc_number && <p className="text-xs text-destructive">{errors.rc_number}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="naicom_reg_number" className="text-sm font-semibold">
                                                NAICOM Reg Number
                                            </Label>
                                            <Input
                                                id="naicom_reg_number"
                                                value={data.naicom_reg_number}
                                                onChange={(e) => setData('naicom_reg_number', e.target.value)}
                                                placeholder="e.g. RIC/000/2023"
                                                className="bg-muted/20"
                                            />
                                            {errors.naicom_reg_number && <p className="text-xs text-destructive">{errors.naicom_reg_number}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tin" className="text-sm font-semibold">
                                            Tax Identification Number (TIN)
                                        </Label>
                                        <Input
                                            id="tin"
                                            value={data.tin}
                                            onChange={(e) => setData('tin', e.target.value)}
                                            placeholder="Enter TIN"
                                            className="bg-muted/20"
                                        />
                                        {errors.tin && <p className="text-xs text-destructive">{errors.tin}</p>}
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        {[
                                            {
                                                label: 'Incorporation Certificate',
                                                key: 'incorporation_cert',
                                                ref: certRef,
                                                file: data.incorporation_cert,
                                            },
                                            {
                                                label: 'NAICOM Operational License',
                                                key: 'naicom_license',
                                                ref: licenseRef,
                                                file: data.naicom_license,
                                            },
                                            {
                                                label: 'Professional Indemnity Policy',
                                                key: 'prof_indemnity',
                                                ref: indemnityRef,
                                                file: data.prof_indemnity,
                                            },
                                        ].map((item) => (
                                            <div key={item.key} className="space-y-2">
                                                <Label className="text-sm font-semibold">{item.label}</Label>
                                                <div
                                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 py-5 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                                                    onClick={() => (item.ref.current as any)?.click()}
                                                >
                                                    <Upload className="h-5 w-5 opacity-50" />
                                                    {item.file ? (
                                                        <span className="font-medium text-primary">{item.file.name}</span>
                                                    ) : (
                                                        <span>Upload (PDF, JPG, PNG ≤ 10MB)</span>
                                                    )}
                                                </div>
                                                <input
                                                    ref={item.ref as any}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="hidden"
                                                    onChange={(e) => (setData as any)(item.key, e.target.files?.[0] ?? null)}
                                                />
                                                {errors[item.key as keyof typeof errors] && (
                                                    <p className="text-xs text-destructive">{errors[item.key as keyof typeof errors]}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={processing} className="min-w-[200px]">
                                            {processing ? 'Submitting...' : 'Submit Records for Review'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/10 pb-3">
                                <CardTitle className="text-sm font-semibold">Existing Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-4 text-sm">
                                {[
                                    { label: 'Incorporation Cert', path: kyc?.incorporation_cert_path },
                                    { label: 'NAICOM License', path: kyc?.naicom_license_path },
                                    { label: 'Professional Indemnity', path: kyc?.prof_indemnity_path },
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-md border bg-muted/5 p-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                            <span className="truncate-1 truncate">{doc.label}</span>
                                        </div>
                                        {doc.path ? (
                                            <a href={`/storage/${doc.path}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary">
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </a>
                                        ) : (
                                            <Badge variant="secondary" className="px-1 py-0 text-[10px] opacity-60">
                                                None
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {kyc?.notes && currentStatus === 'rejected' && (
                            <Card className="border-red-200 bg-red-50/50 shadow-none">
                                <CardContent className="pt-4">
                                    <div className="flex gap-2">
                                        <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
                                        <div className="text-sm">
                                            <p className="font-bold text-red-700">Rejection Feedback:</p>
                                            <p className="mt-1 whitespace-pre-wrap text-red-700">{kyc.notes}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
