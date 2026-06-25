import { Badge } from '@/components/ui/badge';
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
import { CalendarIcon, Loader2, Plus, Save, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: string;
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
}

interface Props {
    customers: Customer[];
    policyProducts: PolicyProduct[];
}

interface FormData {
    customer_id: string;
    policy_product_id: string;
    policy_class_id: string;
    policy_type_id: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: string;
    commission_amount: string;
    coverage_details: {
        sum_assured: string;
        deductible: string;
        coverage_type: string;
        additional_benefits: string[];
    };
    payment_frequency: string;
    form_data: Record<string, any>;
    notes: string;
    insurer_id: string;
    insurer_name: string;
    insurer_address: string;
    insurer_email: string;
    insurer_phone: string;
}

export default function IssuePolicy({ customers, policyProducts }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PolicyProduct | null>(null);
    const [calculatedPremium, setCalculatedPremium] = useState<number>(0);
    const [effectiveOpen, setEffectiveOpen] = useState(false);
    const [effectiveDateObj, setEffectiveDateObj] = useState<Date | undefined>(undefined);
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [expiryDateObj, setExpiryDateObj] = useState<Date | undefined>(undefined);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        customer_id: '',
        policy_product_id: '',
        policy_class_id: '',
        policy_type_id: '',
        effective_date: '',
        expiry_date: '',
        premium_amount: '',
        commission_amount: '',
        coverage_details: {
            sum_assured: '',
            deductible: '',
            coverage_type: '',
            additional_benefits: [],
        },
        payment_frequency: '',
        form_data: {},
        notes: '',
        insurer_id: '',
        insurer_source: '',
        insurer_name: '',
        insurer_address: '',
        insurer_email: '',
        insurer_phone: '',
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
            setData((prevData) => ({
                ...prevData,
                policy_class_id: selectedProduct.policy_class.id.toString(),
                policy_type_id: selectedProduct.policy_type.id.toString(),
                premium_amount: selectedProduct.base_premium.toString(),
                commission_amount: (selectedProduct.base_premium * (selectedProduct.commission_rate / 100)).toFixed(2),
            }));
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (data.effective_date) {
            const parsed = dayjs(data.effective_date);
            if (parsed.isValid()) {
                setEffectiveDateObj(parsed.toDate());
            }
        }
    }, [data.effective_date]);

    useEffect(() => {
        if (data.expiry_date) {
            const parsed = dayjs(data.expiry_date);
            if (parsed.isValid()) {
                setExpiryDateObj(parsed.toDate());
            }
        }
    }, [data.expiry_date]);

    useEffect(() => {
        if (selectedProduct && data.coverage_details.sum_assured) {
            const sumAssured = parseFloat(data.coverage_details.sum_assured);
            const basePremium = selectedProduct.base_premium;
            const rate = basePremium / 100000;
            const calculatedAmount = sumAssured * rate;

            setCalculatedPremium(calculatedAmount);
            setData('premium_amount', calculatedAmount.toFixed(2));

            const commission = calculatedAmount * (selectedProduct.commission_rate / 100);
            setData('commission_amount', commission.toFixed(2));
        }
    }, [data.coverage_details.sum_assured, selectedProduct]);

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

        post(route('policy-management.store-direct'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Policy issued successfully');
                reset();
            },
            onError: (errors) => {
                console.log('IssuePolicy errors', errors);
                toast.error('Error issuing policy. Please check the form for errors.');
            },
        });
    };

    return (
        <AppSidebarLayout>
            <Head title="Issue Policy" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Issue Policy</h2>
                            <p className="text-muted-foreground">Issue a new insurance policy directly to a customer</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Customer & Product Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer & Product</CardTitle>
                                <CardDescription>Select the customer and insurance product</CardDescription>
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
                                                    <Label htmlFor="insurer">Insurer (Underwriter) *</Label>
                                                    <CompanySearchCombobox
                                                        companyType="underwriter"
                                                        value={data.insurer_name}
                                                        scope="tenant"
                                                        onSelect={(company) => {
                                                            setData((prev) => ({
                                                                ...prev,
                                                                insurer_name: company.name,
                                                                insurer_address: company.address || '',
                                                                insurer_email: company.email || '',
                                                                insurer_phone: company.phone || '',
                                                                insurer_id: String(company.company_id || company.id),
                                                                insurer_source: company.source,
                                                            }));
                                                        }}
                                                        placeholder="Search for an insurance company..."
                                                    />
                                                    {errors.insurer_id && <p className="text-sm text-red-600">{errors.insurer_id}</p>}
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
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Policy Period & Number */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Policy Issue</CardTitle>
                                                <CardDescription>The policy number is auto-generated by the system</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Policy Number</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                value="Auto-generated on save"
                                                                disabled
                                                                className="pl-10 bg-muted text-muted-foreground cursor-not-allowed"
                                                            />
                                                        </div>
                                                        <Badge variant="secondary" className="shrink-0">
                                                            Auto
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Policy number is automatically generated when you save
                                                    </p>
                                                </div>

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
                                                                selected={effectiveDateObj}
                                                                onSelect={(date) => {
                                                                    if (date) {
                                                                        const today = dayjs().startOf('day');
                                                                        const picked = dayjs(date).startOf('day');
                                                                        const toUse = picked.isBefore(today) ? today : picked;
                                                                        setEffectiveDateObj(toUse.toDate());
                                                                        setData('effective_date', toUse.format('YYYY-MM-DD'));
                                                                    }
                                                                    setEffectiveOpen(false);
                                                                }}
                                                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
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
                                                                selected={expiryDateObj}
                                                                onSelect={(date) => {
                                                                    if (date) {
                                                                        setExpiryDateObj(date);
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
                                                    <Label htmlFor="payment_frequency">Payment Frequency *</Label>
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
                                                    {errors.payment_frequency && <p className="text-sm text-red-600">{errors.payment_frequency}</p>}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Coverage Details */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Coverage Details</CardTitle>
                                                <CardDescription>Specify the coverage amounts and details</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sum_assured">Sum Assured (₦) *</Label>
                                                    <Input
                                                        id="sum_assured"
                                                        type="number"
                                                        min={selectedProduct?.min_sum_assured || 0}
                                                        max={selectedProduct?.max_sum_assured}
                                                        value={data.coverage_details.sum_assured}
                                                        onChange={(e) => handleCoverageDetailChange('sum_assured', e.target.value)}
                                                        placeholder="Enter sum assured"
                                                    />
                                                    {selectedProduct && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Range: {formatCurrency(selectedProduct.min_sum_assured)} - {formatCurrency(selectedProduct.max_sum_assured)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="deductible">Deductible (₦)</Label>
                                                    <Input
                                                        id="deductible"
                                                        type="number"
                                                        min="0"
                                                        value={data.coverage_details.deductible}
                                                        onChange={(e) => handleCoverageDetailChange('deductible', e.target.value)}
                                                        placeholder="Enter deductible amount"
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

                                        {/* Premium Details */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Premium Details</CardTitle>
                                                <CardDescription>Premium calculations and commission details</CardDescription>
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
                                                        onChange={(e) => setData('premium_amount', e.target.value)}
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

                                                {calculatedPremium > 0 && (
                                                    <div className="rounded-lg bg-green-50 p-4">
                                                        <h4 className="mb-2 font-medium text-green-800">Calculated Premium</h4>
                                                        <div className="text-sm text-green-700">
                                                            <p>Premium: {formatCurrency(calculatedPremium)}</p>
                                                            <p>Commission: {formatCurrency(parseFloat(data.commission_amount) || 0)}</p>
                                                            <p><strong>Total: {formatCurrency(calculatedPremium + (parseFloat(data.commission_amount) || 0))}</strong></p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Notes */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Additional Notes</CardTitle>
                                            <CardDescription>Add any special notes or instructions for this policy</CardDescription>
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
                                                    Issuing Policy...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Issue Policy
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </AppSidebarLayout>
                    );
                }
