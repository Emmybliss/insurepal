import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ArrowLeft, Calculator, Car, Heart, Home, Save, Send, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
}

interface InsuranceProduct {
    id: number;
    name: string;
    type: string;
    description: string;
    base_premium: number;
    commission_rate: number;
    form_fields: any[];
}

interface Quote {
    id: number;
    quote_number: string;
    customer: Customer;
    insurance_product: InsuranceProduct;
    coverage_details: any[];
    premium_amount: string;
    commission_amount: string;
    total_amount: string;
    valid_until: string;
    form_data: Record<string, any>;
    notes?: string;
    internal_notes?: string;
    status: string;
}

interface Props {
    quote: Quote;
    customers: Customer[];
    products: InsuranceProduct[];
}

interface CoverageDetail {
    type?: string;
    amount?: string;
    description?: string;
}

interface FormData {
    customer_id: string;
    insurance_product_id: string;
    coverage_details: CoverageDetail[];
    premium_amount: string;
    commission_amount: string;
    total_amount: string;
    valid_until: string;
    form_data: Record<string, string | number | boolean>;
    notes: string;
    internal_notes: string;
    action?: string;
}

export default function QuoteEdit({ quote, customers, products }: Props) {
    const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(quote.insurance_product);
    const [calculatedPremium, setCalculatedPremium] = useState<number>(parseFloat(quote.premium_amount));
    const [calculatedCommission, setCalculatedCommission] = useState<number>(parseFloat(quote.commission_amount));

    const { data, setData, put, processing, errors } = useForm<FormData>({
        customer_id: quote.customer.id.toString(),
        insurance_product_id: quote.insurance_product.id.toString(),
        coverage_details: quote.coverage_details || [],
        premium_amount: quote.premium_amount,
        commission_amount: quote.commission_amount,
        total_amount: quote.total_amount,
        valid_until: quote.valid_until.split('T')[0], // Convert to date format
        form_data: quote.form_data || {},
        notes: quote.notes || '',
        internal_notes: quote.internal_notes || '',
    });

    const getProductIcon = (productType: string) => {
        switch (productType?.toLowerCase()) {
            case 'auto':
            case 'motor':
                return <Car className="h-5 w-5" />;
            case 'property':
            case 'home':
                return <Home className="h-5 w-5" />;
            case 'life':
                return <Heart className="h-5 w-5" />;
            default:
                return <User className="h-5 w-5" />;
        }
    };

    const calculatePremium = () => {
        if (!selectedProduct || !data.coverage_details.length) return;

        const totalCoverageAmount = data.coverage_details.reduce((sum, detail) => {
            return sum + parseFloat(detail.amount || '0');
        }, 0);

        if (totalCoverageAmount === 0) return;

        // Basic premium calculation based on product base premium and coverage amount
        const basePremium = selectedProduct.base_premium || 0;
        let premium = basePremium;

        // For percentage-based products
        if (basePremium < 1) {
            premium = totalCoverageAmount * basePremium;
        } else {
            // For fixed premium products, add coverage factor
            premium = basePremium + totalCoverageAmount * 0.001; // 0.1% of coverage amount
        }

        // Apply form data multipliers if any
        const formMultiplier = calculateFormMultiplier();
        premium *= formMultiplier;

        const commission = premium * (selectedProduct.commission_rate || 0.1);
        const total = premium + commission;

        setCalculatedPremium(Math.round(premium * 100) / 100);
        setCalculatedCommission(Math.round(commission * 100) / 100);
        setData('premium_amount', (Math.round(premium * 100) / 100).toString());
        setData('commission_amount', (Math.round(commission * 100) / 100).toString());
        setData('total_amount', (Math.round(total * 100) / 100).toString());
    };

    const calculateFormMultiplier = (): number => {
        if (!selectedProduct?.form_fields) return 1;

        let multiplier = 1;

        // Example risk multipliers based on form data
        Object.entries(data.form_data).forEach(([key, value]) => {
            const field = selectedProduct.form_fields.find((f: any) => f.key === key);
            if (field && field.risk_multiplier && value) {
                if (typeof field.risk_multiplier === 'object') {
                    multiplier *= field.risk_multiplier[String(value)] || 1;
                } else {
                    multiplier *= field.risk_multiplier;
                }
            }
        });

        return multiplier;
    };

    const handleProductChange = (productId: string) => {
        const product = products.find((p) => p.id.toString() === productId);
        setSelectedProduct(product || null);
        setData('insurance_product_id', productId);

        if (product) {
            // Reset form data for new product
            setData('form_data', {});
        }
    };

    const handleFormFieldChange = (fieldKey: string, value: any) => {
        setData('form_data', {
            ...data.form_data,
            [fieldKey]: value,
        });
    };

    const handleCoverageDetailChange = (index: number, field: string, value: any) => {
        const updatedCoverage = [...data.coverage_details];
        if (!updatedCoverage[index]) {
            updatedCoverage[index] = {};
        }
        updatedCoverage[index] = {
            ...updatedCoverage[index],
            [field]: value,
        };
        setData('coverage_details', updatedCoverage);
    };

    const addCoverageDetail = () => {
        setData('coverage_details', [...data.coverage_details, { type: '', amount: '', description: '' }]);
    };

    const removeCoverageDetail = (index: number) => {
        const updatedCoverage = data.coverage_details.filter((_, i) => i !== index);
        setData('coverage_details', updatedCoverage);
    };

    const handleSubmit = (e: React.FormEvent, action: 'update' | 'send' = 'update') => {
        e.preventDefault();

        setData('action', action);

        put(route('quotes.update', quote.id), {
            onSuccess: () => {
                toast.success(action === 'update' ? 'Quote has been updated successfully' : 'Quote has been updated and sent to customer');
                router.visit(route('quotes.show', quote.id));
            },
            onError: () => {
                toast.error('Failed to update quote. Please check the form and try again.');
            },
        });
    };

    // Auto-calculate premium when coverage details or form data changes
    useEffect(() => {
        const timer = setTimeout(() => {
            calculatePremium();
        }, 500);

        return () => clearTimeout(timer);
    }, [data.coverage_details, data.form_data, selectedProduct]);

    const renderFormFields = () => {
        if (!selectedProduct?.form_fields || !Array.isArray(selectedProduct.form_fields)) return null;

        return selectedProduct.form_fields.map((field: any, index: number) => (
            <div key={index} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'select' ? (
                    <Select value={String(data.form_data[field.key] || '')} onValueChange={(value) => handleFormFieldChange(field.key, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option: any, optIndex: number) => (
                                <SelectItem key={optIndex} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : field.type === 'textarea' ? (
                    <Textarea
                        id={field.key}
                        value={String(data.form_data[field.key] || '')}
                        onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={errors[`form_data.${field.key}`] ? 'border-red-500' : ''}
                    />
                ) : (
                    <Input
                        id={field.key}
                        type={field.type || 'text'}
                        value={String(data.form_data[field.key] || '')}
                        onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={errors[`form_data.${field.key}`] ? 'border-red-500' : ''}
                    />
                )}
                {errors[`form_data.${field.key}`] && <p className="text-sm text-red-600">{errors[`form_data.${field.key}`]}</p>}
                {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
            </div>
        ));
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'corporate' ? customer.company_name : `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    };

    return (
        <AppLayout>
            <Head title={`Edit Quote #${quote.quote_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={route('quotes.show', quote.id)}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Quote
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Edit Quote #{quote.quote_number}</h1>
                            <p className="text-muted-foreground">Update quote details and pricing</p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-4xl">
                    <form onSubmit={(e) => handleSubmit(e, 'update')} className="space-y-6">
                        {/* Customer and Product Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Customer and insurance product details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer *</Label>
                                        <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                            <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-4 w-4" />
                                                            <span>{getCustomerName(customer)}</span>
                                                            <Badge variant="outline" className="ml-2">
                                                                {customer.type}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_product_id">Insurance Product *</Label>
                                        <Select value={data.insurance_product_id} onValueChange={handleProductChange}>
                                            <SelectTrigger className={errors.insurance_product_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((product) => (
                                                    <SelectItem key={product.id} value={product.id.toString()}>
                                                        <div className="flex items-center space-x-2">
                                                            {getProductIcon(product.type)}
                                                            <span>{product.name}</span>
                                                            <Badge variant="secondary" className="ml-2">
                                                                {product.type}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.insurance_product_id && <p className="text-sm text-red-600">{errors.insurance_product_id}</p>}
                                    </div>
                                </div>

                                {selectedProduct && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start space-x-3">
                                            {getProductIcon(selectedProduct.type)}
                                            <div>
                                                <h4 className="font-medium text-blue-900">{selectedProduct.name}</h4>
                                                <p className="text-sm text-blue-700">{selectedProduct.description}</p>
                                                <div className="mt-2 flex items-center space-x-4 text-sm text-blue-600">
                                                    <span>Base Premium: ₦{selectedProduct.base_premium?.toLocaleString()}</span>
                                                    <span>Commission: {(selectedProduct.commission_rate || 0) * 100}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Coverage Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Coverage Details</CardTitle>
                                <CardDescription>Specify coverage types and amounts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    {data.coverage_details.map((detail, index) => (
                                        <div key={index} className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`coverage_type_${index}`}>Coverage Type *</Label>
                                                <Input
                                                    id={`coverage_type_${index}`}
                                                    value={detail.type || ''}
                                                    onChange={(e) => handleCoverageDetailChange(index, 'type', e.target.value)}
                                                    placeholder="e.g., Comprehensive"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`coverage_amount_${index}`}>Amount (₦) *</Label>
                                                <Input
                                                    id={`coverage_amount_${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    value={detail.amount || ''}
                                                    onChange={(e) => handleCoverageDetailChange(index, 'amount', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`coverage_description_${index}`}>Description</Label>
                                                <Input
                                                    id={`coverage_description_${index}`}
                                                    value={detail.description || ''}
                                                    onChange={(e) => handleCoverageDetailChange(index, 'description', e.target.value)}
                                                    placeholder="Optional description"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="invisible">Actions</Label>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeCoverageDetail(index)}
                                                    className="w-full"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button type="button" variant="outline" onClick={addCoverageDetail}>
                                    Add Coverage Detail
                                </Button>

                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="valid_until">Valid Until *</Label>
                                        <DatePickerSimple
                                            date={data.valid_until ? new Date(data.valid_until) : undefined}
                                            onSelect={(date) => setData('valid_until', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                            placeholder="Select validity date"
                                        />
                                        {errors.valid_until && <p className="text-sm text-red-600">{errors.valid_until}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Product-specific Form Fields */}
                        {selectedProduct && selectedProduct.form_fields && selectedProduct.form_fields.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Information</CardTitle>
                                    <CardDescription>Product-specific details for accurate pricing</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderFormFields()}</div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Premium Calculation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calculator className="h-5 w-5" />
                                    <span>Premium Calculation</span>
                                </CardTitle>
                                <CardDescription>Premium, commission, and total amounts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="premium_amount">Premium Amount (₦)</Label>
                                        <div className="relative">
                                            <Input
                                                id="premium_amount"
                                                type="number"
                                                step="0.01"
                                                value={data.premium_amount}
                                                onChange={(e) => setData('premium_amount', e.target.value)}
                                                className={errors.premium_amount ? 'border-red-500' : ''}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={calculatePremium}
                                                className="absolute top-1/2 right-2 h-6 -translate-y-1/2 px-2"
                                            >
                                                <Calculator className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {errors.premium_amount && <p className="text-sm text-red-600">{errors.premium_amount}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="commission_amount">Commission Amount (₦)</Label>
                                        <Input
                                            id="commission_amount"
                                            type="number"
                                            step="0.01"
                                            value={data.commission_amount}
                                            onChange={(e) => setData('commission_amount', e.target.value)}
                                            className={errors.commission_amount ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.commission_amount && <p className="text-sm text-red-600">{errors.commission_amount}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="total_amount">Total Amount (₦)</Label>
                                        <Input
                                            id="total_amount"
                                            type="number"
                                            step="0.01"
                                            value={data.total_amount}
                                            onChange={(e) => setData('total_amount', e.target.value)}
                                            className={errors.total_amount ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.total_amount && <p className="text-sm text-red-600">{errors.total_amount}</p>}
                                    </div>
                                </div>

                                {(calculatedPremium > 0 || calculatedCommission > 0) && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-700">Calculated Premium:</span>
                                                <span className="font-medium text-green-900">₦{calculatedPremium.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-700">Commission:</span>
                                                <span className="font-medium text-green-900">₦{calculatedCommission.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                                <CardDescription>Customer-facing and internal notes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Customer Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Notes visible to customer..."
                                        rows={3}
                                        className={errors.notes ? 'border-red-500' : ''}
                                    />
                                    {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="internal_notes">Internal Notes</Label>
                                    <Textarea
                                        id="internal_notes"
                                        value={data.internal_notes}
                                        onChange={(e) => setData('internal_notes', e.target.value)}
                                        placeholder="Internal notes (not visible to customer)..."
                                        rows={3}
                                        className={errors.internal_notes ? 'border-red-500' : ''}
                                    />
                                    {errors.internal_notes && <p className="text-sm text-red-600">{errors.internal_notes}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-end space-x-4">
                                    <Link href={route('quotes.show', quote.id)}>
                                        <Button type="button" variant="outline" disabled={processing}>
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update Quote'}
                                    </Button>
                                    {quote.status !== 'sent' && (
                                        <Button
                                            type="button"
                                            onClick={(e) => handleSubmit(e, 'send')}
                                            disabled={processing}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update & Send Quote'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
