import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Loader2, Plus, Save, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: string;
}

interface PreferredUnderwriter {
    id: number;
    name: string;
}

interface PolicyProduct {
    id: number;
    name: string;
    code: string;
    base_premium: number;
    commission_rate: number;
    min_sum_assured: number;
    max_sum_assured: number;
    policy_type: {
        id: number;
        name: string;
    };
    policy_class: {
        id: number;
        name: string;
    };
    preferred_underwriters: PreferredUnderwriter[];
}

interface Props {
    customers: Customer[];
    policyProducts: PolicyProduct[];
}

interface FormData {
    customer_id: string;
    policy_product_id: string;
    policy_number: string;
    broker_slip_number: string;
    placement_date: string;
    insurer_id: string;
    insurer_name: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: string;
    commission_amount: string;
    coverage_details: {
        sum_assured: string;
        deductible: string;
        coverage_type: string;
    };
    payment_frequency: string;
    notes: string;
    schedule_file: File | null;
    broker_slip_file: File | null;
}

export default function RecordPlacedPolicy({ customers, policyProducts }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PolicyProduct | null>(null);
    const [effectiveOpen, setEffectiveOpen] = useState(false);
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [placementOpen, setPlacementOpen] = useState(false);
    const [scheduleFileName, setScheduleFileName] = useState('');
    const [brokerSlipFileName, setBrokerSlipFileName] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        customer_id: '',
        policy_product_id: '',
        policy_number: '',
        broker_slip_number: '',
        placement_date: '',
        insurer_id: '',
        insurer_name: '',
        effective_date: '',
        expiry_date: '',
        premium_amount: '',
        commission_amount: '',
        coverage_details: {
            sum_assured: '',
            deductible: '',
            coverage_type: '',
        },
        payment_frequency: '',
        notes: '',
        schedule_file: null,
        broker_slip_file: null,
    });

    const handleCustomerCreated = (newCustomer: import('@/types').Customer) => {
        const adapted: Customer = {
            id: newCustomer.id,
            name: newCustomer.display_name,
            email: newCustomer.email,
            phone: newCustomer.phone ?? '',
            type: newCustomer.type,
        };
        setCustomerList((prev) => [...prev, adapted]);
        setData('customer_id', adapted.id.toString());
    };

    useEffect(() => {
        if (selectedProduct) {
            setData((prev) => ({
                ...prev,
                commission_amount: (parseFloat(prev.premium_amount || '0') * (selectedProduct.commission_rate / 100)).toFixed(2),
            }));
        }
    }, [selectedProduct]);

    const handleProductChange = (productId: string) => {
        const product = policyProducts.find((p) => p.id === parseInt(productId));
        setSelectedProduct(product || null);
        setData('policy_product_id', productId);
    };

    const handleCoverageDetailChange = (field: keyof FormData['coverage_details'], value: any) => {
        setData((prev) => ({
            ...prev,
            coverage_details: {
                ...prev.coverage_details,
                [field]: value,
            },
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('policy-management.store-placed'), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Placed policy recorded successfully');
                reset();
            },
            onError: (errors) => {
                console.log('RecordPlacedPolicy errors', errors);
                toast.error('Error recording policy. Please check the form for errors.');
            },
        });
    };

    return (
        <AppSidebarLayout>
            <Head title="Record Placed Policy" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Record Placed Policy</h2>
                            <p className="text-muted-foreground">Record a policy issued by an underwriter</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Customer & Product Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer & Product</CardTitle>
                                <CardDescription>Select the insured customer and insurance product</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customerList.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {customer.name} - {customer.email}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)} className="shrink-0 self-start mt-0">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add New
                                        </Button>
                                    </div>
                                    {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id}</p>}
                                    <CustomerCreateModal
                                        open={customerModalOpen}
                                        onOpenChange={setCustomerModalOpen}
                                        onCustomerCreated={handleCustomerCreated}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="policy_product_id">Insurance Product *</Label>
                                    <Select value={data.policy_product_id} onValueChange={handleProductChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {policyProducts.map((product) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                    {product.name} ({product.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_product_id && <p className="text-sm text-red-600">{errors.policy_product_id}</p>}
                                </div>

                                {selectedProduct && (
                                    <div className="rounded-lg bg-muted p-4">
                                        <h4 className="mb-2 font-medium">Product Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Type:</strong> {selectedProduct.policy_type.name}</p>
                                            <p><strong>Class:</strong> {selectedProduct.policy_class.name}</p>
                                            <p><strong>Base Premium:</strong> {formatCurrency(selectedProduct.base_premium)}</p>
                                            <p><strong>Commission Rate:</strong> {selectedProduct.commission_rate}%</p>
                                            {selectedProduct.preferred_underwriters?.length > 0 && (
                                                <p><strong>Preferred Underwriters:</strong> {selectedProduct.preferred_underwriters.map((u) => u.name).join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Policy Details & Insurer */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Details</CardTitle>
                                <CardDescription>Enter the policy number and insurer information from the underwriter</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policy_number">Policy Number (from Underwriter) *</Label>
                                    <Input
                                        id="policy_number"
                                        value={data.policy_number}
                                        onChange={(e) => setData('policy_number', e.target.value)}
                                        placeholder="e.g. MTR-2026-00000001"
                                    />
                                    {errors.policy_number && <p className="text-sm text-red-600">{errors.policy_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="broker_slip_number">Broker Slip Number *</Label>
                                    <Input
                                        id="broker_slip_number"
                                        value={data.broker_slip_number}
                                        onChange={(e) => setData('broker_slip_number', e.target.value)}
                                        placeholder="e.g. BS/2026/000001"
                                    />
                                    {errors.broker_slip_number && <p className="text-sm text-red-600">{errors.broker_slip_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="placement_date">Placement Date *</Label>
                                    <Popover open={placementOpen} onOpenChange={setPlacementOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn('w-full justify-start text-left font-normal', !data.placement_date && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.placement_date ? dayjs(data.placement_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={data.placement_date ? dayjs(data.placement_date).toDate() : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setData('placement_date', dayjs(date).format('YYYY-MM-DD'));
                                                    }
                                                    setPlacementOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.placement_date && <p className="text-sm text-red-600">{errors.placement_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="insurer_name">Insurer (Underwriter) *</Label>
                                    <Input
                                        id="insurer_name"
                                        value={data.insurer_name}
                                        onChange={(e) => {
                                            setData('insurer_name', e.target.value);
                                            setData('insurer_id', e.target.value);
                                        }}
                                        placeholder="Enter the underwriting company name"
                                    />
                                    {errors.insurer_name && <p className="text-sm text-red-600">{errors.insurer_name}</p>}
                                    {errors.insurer_id && <p className="text-sm text-red-600">{errors.insurer_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Policy Period */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Period</CardTitle>
                                <CardDescription>Set the policy effective and expiry dates from the underwriter schedule</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="effective_date">Effective Date *</Label>
                                    <Popover open={effectiveOpen} onOpenChange={setEffectiveOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn('w-full justify-start text-left font-normal', !data.effective_date && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.effective_date ? dayjs(data.effective_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={data.effective_date ? dayjs(data.effective_date).toDate() : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setData('effective_date', dayjs(date).format('YYYY-MM-DD'));
                                                    }
                                                    setEffectiveOpen(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.effective_date && <p className="text-sm text-red-600">{errors.effective_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                                    <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn('w-full justify-start text-left font-normal', !data.expiry_date && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.expiry_date ? dayjs(data.expiry_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={data.expiry_date ? dayjs(data.expiry_date).toDate() : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setData('expiry_date', dayjs(date).format('YYYY-MM-DD'));
                                                    }
                                                    setExpiryOpen(false);
                                                }}
                                                disabled={(date) =>
                                                    data.effective_date
                                                        ? date < dayjs(data.effective_date).toDate()
                                                        : date < new Date(new Date().setDate(new Date().getDate() - 1))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {errors.expiry_date && <p className="text-sm text-red-600">{errors.expiry_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_frequency">Payment Frequency</Label>
                                    <Select value={data.payment_frequency} onValueChange={(value) => setData('payment_frequency', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Premium Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Premium Details</CardTitle>
                                <CardDescription>Enter the premium and commission amounts from the underwriter schedule</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="premium_amount">Premium Amount (₦) *</Label>
                                    <Input
                                        id="premium_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.premium_amount}
                                        onChange={(e) => {
                                            setData('premium_amount', e.target.value);
                                            if (selectedProduct) {
                                                const commission = parseFloat(e.target.value || '0') * (selectedProduct.commission_rate / 100);
                                                setData('commission_amount', commission.toFixed(2));
                                            }
                                        }}
                                        placeholder="Enter premium amount"
                                    />
                                    {errors.premium_amount && <p className="text-sm text-red-600">{errors.premium_amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="commission_amount">Commission Amount (₦)</Label>
                                    <Input
                                        id="commission_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.commission_amount}
                                        onChange={(e) => setData('commission_amount', e.target.value)}
                                        placeholder="Enter commission amount"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverage_type">Coverage Type</Label>
                                    <Select
                                        value={data.coverage_details.coverage_type}
                                        onValueChange={(value) => handleCoverageDetailChange('coverage_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select coverage type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                            <SelectItem value="third_party">Third Party</SelectItem>
                                            <SelectItem value="fire_theft">Fire & Theft</SelectItem>
                                            <SelectItem value="basic">Basic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File Uploads */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Uploads</CardTitle>
                                <CardDescription>Upload the schedule from the underwriter and the broker slip</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schedule_file">Upload Schedule (from Underwriter) *</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('schedule_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {scheduleFileName || 'Choose file...'}
                                        </Button>
                                        <input
                                            id="schedule_file_input"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData('schedule_file', file);
                                                    setScheduleFileName(file.name);
                                                }
                                            }}
                                        />
                                    </div>
                                    {errors.schedule_file && <p className="text-sm text-red-600">{errors.schedule_file}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="broker_slip_file">Upload Broker Slip (Optional)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('broker_slip_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {brokerSlipFileName || 'Choose file...'}
                                        </Button>
                                        <input
                                            id="broker_slip_file_input"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData('broker_slip_file', file);
                                                    setBrokerSlipFileName(file.name);
                                                }
                                            }}
                                        />
                                    </div>
                                    {errors.broker_slip_file && <p className="text-sm text-red-600">{errors.broker_slip_file}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Notes</CardTitle>
                            <CardDescription>Add any special notes or instructions for this recorded policy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Enter any additional notes..."
                                rows={4}
                            />
                            {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('policy-management.index')}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Recording Policy...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Record Policy
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}
