import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Customer, PageProps, Policy } from '@/types';
import { ClaimType, DocumentType } from '@/types/claim';
import { Head, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ArrowLeft, CalendarIcon, Upload, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface Props extends PageProps {
    policies: Policy[];
    customers: Customer[];
    claimTypes: Array<{ value: ClaimType; label: string }>;
    documentTypes: Array<{ value: DocumentType; label: string }>;
}

export default function Create({ policies, claimTypes, documentTypes }: Props) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileDocTypes, setFileDocTypes] = useState<DocumentType[]>([]);
    const [fileDescriptions, setFileDescriptions] = useState<string[]>([]);
    const [incidentDateOpen, setIncidentDateOpen] = useState(false);
    const [incidentDateObj, setIncidentDateObj] = useState<Date | undefined>(undefined);

    const { data, setData, post, processing, transform } = useForm({
        policy_id: '',
        customer_id: '',
        claim_type: '' as ClaimType,
        incident_date: '',
        incident_description: '',
        incident_location: '',
        claim_amount: '',
        documents: [] as File[],
        document_types: [] as DocumentType[],
        descriptions: [] as string[],
    });

    useEffect(() => {
        if (data.incident_date) {
            const parsed = dayjs(data.incident_date);
            if (parsed.isValid()) {
                setIncidentDateObj(parsed.toDate());
            }
        }
    }, [data.incident_date]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles([...selectedFiles, ...files]);
        setFileDocTypes([...fileDocTypes, ...files.map(() => 'other' as DocumentType)]);
        setFileDescriptions([...fileDescriptions, ...files.map(() => '')]);
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setFileDocTypes(fileDocTypes.filter((_, i) => i !== index));
        setFileDescriptions(fileDescriptions.filter((_, i) => i !== index));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((current) => ({
            ...current,
            documents: selectedFiles,
            document_types: fileDocTypes,
            descriptions: fileDescriptions,
        }));
        post(route('claims.store'), {
            forceFormData: true,
        });
    };

    const handlePolicyChange = (policyId: string) => {
        setData('policy_id', policyId);
        const policy = policies.find((p) => p.id === parseInt(policyId));
        if (policy) {
            setData('customer_id', policy.customer_id.toString());
        }
    };

    return (
        <AppLayout>
            <Head title="Create Claim" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit(route('claims.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Create New Claim</h1>
                        <p className="text-muted-foreground">Submit a new insurance claim</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Claim Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Claim Information</CardTitle>
                            <CardDescription>Provide details about the insurance claim</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Policy Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="policy_id">Policy *</Label>
                                <Select value={data.policy_id} onValueChange={handlePolicyChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a policy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {policies.map((policy) => (
                                            <SelectItem key={policy.id} value={policy.id.toString()}>
                                                {policy.policy_number} - {policy.customer?.display_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.policy_id && <p className="text-sm text-destructive">{errors.policy_id}</p>}
                            </div>

                            {/* Customer (Auto-filled from policy) */}
                            <div className="space-y-2">
                                <Label htmlFor="customer_id">Customer *</Label>
                                <Input value={data.customer_id} disabled />
                                {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
                            </div>

                            {/* Claim Type */}
                            <div className="space-y-2">
                                <Label htmlFor="claim_type">Claim Type *</Label>
                                <Select value={data.claim_type} onValueChange={(value) => setData('claim_type', value as ClaimType)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select claim type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {claimTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.claim_type && <p className="text-sm text-destructive">{errors.claim_type}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Incident Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="incident_date">Incident Date *</Label>
                                    <Popover open={incidentDateOpen} onOpenChange={setIncidentDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !data.incident_date && 'text-muted-foreground',
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.incident_date ? dayjs(data.incident_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={incidentDateObj}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setIncidentDateObj(date);
                                                        setData('incident_date', dayjs(date).format('YYYY-MM-DD'));
                                                    }
                                                    setIncidentDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.incident_date && <p className="text-sm text-destructive">{errors.incident_date}</p>}
                                </div>

                                {/* Claim Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="claim_amount">Claim Amount (₦) *</Label>
                                    <Input
                                        id="claim_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.claim_amount}
                                        onChange={(e) => setData('claim_amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.claim_amount && <p className="text-sm text-destructive">{errors.claim_amount}</p>}
                                </div>
                            </div>

                            {/* Incident Location */}
                            <div className="space-y-2">
                                <Label htmlFor="incident_location">Incident Location</Label>
                                <Input
                                    id="incident_location"
                                    value={data.incident_location}
                                    onChange={(e) => setData('incident_location', e.target.value)}
                                    placeholder="Where did the incident occur?"
                                />
                                {errors.incident_location && <p className="text-sm text-destructive">{errors.incident_location}</p>}
                            </div>

                            {/* Incident Description */}
                            <div className="space-y-2">
                                <Label htmlFor="incident_description">Incident Description *</Label>
                                <Textarea
                                    id="incident_description"
                                    value={data.incident_description}
                                    onChange={(e) => setData('incident_description', e.target.value)}
                                    placeholder="Describe what happened in detail..."
                                    rows={5}
                                />
                                {errors.incident_description && <p className="text-sm text-destructive">{errors.incident_description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Supporting Documents</CardTitle>
                            <CardDescription>Upload photos, reports, and other supporting documents</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="documents">Upload Files</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="documents"
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" onClick={() => document.getElementById('documents')?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose Files
                                    </Button>
                                    <p className="text-sm text-muted-foreground">Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)</p>
                                </div>
                            </div>

                            {/* Selected Files */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Selected Files ({selectedFiles.length})</Label>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 rounded border p-3">
                                            <div className="flex-1">
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <Select
                                                value={fileDocTypes[index]}
                                                onValueChange={(value) => {
                                                    const newTypes = [...fileDocTypes];
                                                    newTypes[index] = value as DocumentType;
                                                    setFileDocTypes(newTypes);
                                                }}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {documentTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleFileRemove(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('claims.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Claim'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
