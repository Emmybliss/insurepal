import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import { Calculator, Car, Heart, Home, Plus, Save, Send, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    display_name: string;
    email: string;
    phone: string;
    address: string;
    type: 'individual' | 'corporate';
}

interface InsuranceProduct {
    id: number;
    name: string;
    type: string;
    description: string;
    base_premium: number;
    commission_rate: number;
    coverage_options: any;
    form_fields: any;
}

interface Props {
    customers: Customer[];
    products: InsuranceProduct[];
    customer?: Customer;
    product?: InsuranceProduct;
}

interface FormData {
    customer_id: string;
    insurance_product_id: string;
    coverage_amount: string;
    premium_amount: string;
    commission_amount: string;
    valid_until: string;
    notes: string;
    coverage_details: Record<string, any>;
    form_data: Record<string, any>;
}

export default function Create({ customers, products, customer, product }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(product || null);
    const [calculatedPremium, setCalculatedPremium] = useState<number>(0);
    const [calculatedCommission, setCalculatedCommission] = useState<number>(0);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        customer_id: customer?.id?.toString() || '',
        insurance_product_id: product?.id?.toString() || '',
        coverage_amount: '',
        premium_amount: '',
        commission_amount: '',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        notes: '',
        coverage_details: {},
        form_data: {},
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
        if (!selectedProduct || !data.coverage_amount) return;

        const coverageAmount = parseFloat(data.coverage_amount);
        if (isNaN(coverageAmount)) return;

        // Basic premium calculation based on product base premium and coverage amount
        const basePremium = selectedProduct.base_premium || 0;
        let premium = basePremium;

        // For percentage-based products
        if (basePremium < 1) {
            premium = coverageAmount * basePremium;
        } else {
            // For fixed premium products, add coverage factor
            premium = basePremium + coverageAmount * 0.001; // 0.1% of coverage amount
        }

        // Apply form data multipliers if any
        const formMultiplier = calculateFormMultiplier();
        premium *= formMultiplier;

        const commission = premium * (selectedProduct.commission_rate || 0.1);

        setCalculatedPremium(Math.round(premium * 100) / 100);
        setCalculatedCommission(Math.round(commission * 100) / 100);
        setData('premium_amount', (Math.round(premium * 100) / 100).toString());
        setData('commission_amount', (Math.round(commission * 100) / 100).toString());
    };

    const calculateFormMultiplier = (): number => {
        if (!selectedProduct?.form_fields) return 1;

        let multiplier = 1;

        // Example risk multipliers based on form data
        Object.entries(data.form_data).forEach(([key, value]) => {
            const field = selectedProduct.form_fields.find((f: any) => f.key === key);
            if (field && field.risk_multiplier && value) {
                if (typeof field.risk_multiplier === 'object') {
                    multiplier *= field.risk_multiplier[value] || 1;
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
            setData('coverage_details', {});
        }
    };

    const handleFormFieldChange = (fieldKey: string, value: any) => {
        setData('form_data', {
            ...data.form_data,
            [fieldKey]: value,
        });
    };

    const handleCoverageDetailChange = (key: string, value: any) => {
        setData('coverage_details', {
            ...data.coverage_details,
            [key]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent, action: 'draft' | 'send' = 'draft') => {
        e.preventDefault();

        const submitData = {
            ...data,
            action,
        };

        post(route('quotes.store'), {
            data: submitData,
            onSuccess: () => {
                toast.success(action === 'draft' ? 'Quote has been saved as draft' : 'Quote has been sent to customer');
                router.visit(route('quotes.index'));
            },
            onError: (errors) => {
                toast.error('Failed to create quote. Please check the form and try again.');
            },
        });
    };

    const handleCustomerCreated = (newCustomer: import('@/types').Customer) => {
        const adapted: Customer = {
            id: newCustomer.id,
            display_name: newCustomer.display_name,
            email: newCustomer.email,
            phone: newCustomer.phone ?? '',
            address: newCustomer.address ?? '',
            type: newCustomer.type,
        };
        setCustomerList((prev) => [...prev, adapted]);
        setData('customer_id', adapted.id.toString());
    };

    // Auto-calculate premium when coverage amount or form data changes
    useEffect(() => {
        const timer = setTimeout(() => {
            calculatePremium();
        }, 500);

        return () => clearTimeout(timer);
    }, [data.coverage_amount, data.form_data, selectedProduct]);

    const renderFormFields = () => {
        if (!selectedProduct?.form_fields) return null;

        return selectedProduct.form_fields.map((field: any, index: number) => (
            <div key={index} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'select' ? (
                    <Select value={data.form_data[field.key] || ''} onValueChange={(value) => handleFormFieldChange(field.key, value)}>
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
                        value={data.form_data[field.key] || ''}
                        onChange={(e) => handleFormFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={errors[`form_data.${field.key}`] ? 'border-red-500' : ''}
                    />
                ) : (
                    <Input
                        id={field.key}
                        type={field.type || 'text'}
                        value={data.form_data[field.key] || ''}
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

    const renderCoverageOptions = () => {
        if (!selectedProduct?.coverage_options) return null;

        return Object.entries(selectedProduct.coverage_options).map(([key, option]: [string, any]) => (
            <div key={key} className="space-y-2">
                <Label htmlFor={`coverage_${key}`}>{option.label}</Label>
                {option.type === 'boolean' ? (
                    <Select
                        value={data.coverage_details[key]?.toString() || 'false'}
                        onValueChange={(value) => handleCoverageDetailChange(key, value === 'true')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                    </Select>
                ) : option.type === 'select' ? (
                    <Select value={data.coverage_details[key] || ''} onValueChange={(value) => handleCoverageDetailChange(key, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${option.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {option.options?.map((opt: any, optIndex: number) => (
                                <SelectItem key={optIndex} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        id={`coverage_${key}`}
                        type={option.type || 'text'}
                        value={data.coverage_details[key] || ''}
                        onChange={(e) => handleCoverageDetailChange(key, e.target.value)}
                        placeholder={option.placeholder}
                    />
                )}
                {option.description && <p className="text-sm text-muted-foreground">{option.description}</p>}
            </div>
        ));
    };

    console.log(customers);
    return (
        <AppLayout>
            <Head title="Create Quote" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
                        {/* Customer and Product Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Select the customer and insurance product for this quote</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer *</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select
                                                    value={data.customer_id}
                                                    onValueChange={(value) => setData('customer_id', value)}
                                                    disabled={!!customer}
                                                >
                                                    <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Select customer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customerList.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                                <div className="flex items-center space-x-2">
                                                                    <User className="h-4 w-4" />
                                                                    <span>{customer.display_name}</span>
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {customer.type}
                                                                    </Badge>
                                                                </div>
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
                                        <Label htmlFor="insurance_product_id">Insurance Product *</Label>
                                        <Select value={data.insurance_product_id} onValueChange={handleProductChange} disabled={!!product}>
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
                        {selectedProduct && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Coverage Details</CardTitle>
                                        <CardDescription>Specify the coverage amount and options</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="coverage_amount">Coverage Amount (₦) *</Label>
                                                <Input
                                                    id="coverage_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.coverage_amount}
                                                    onChange={(e) => setData('coverage_amount', e.target.value)}
                                                    placeholder="Enter coverage amount"
                                                    className={errors.coverage_amount ? 'border-red-500' : ''}
                                                />
                                                {errors.coverage_amount && <p className="text-sm text-red-600">{errors.coverage_amount}</p>}
                                            </div>

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

                                        {selectedProduct.coverage_options && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h4 className="mb-3 font-medium">Coverage Options</h4>
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{renderCoverageOptions()}</div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Product-specific Form Fields */}
                                {selectedProduct.form_fields && selectedProduct.form_fields.length > 0 && (
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
                                        <CardDescription>Calculated premium and commission amounts</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="premium_amount">Premium Amount (₦)</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="premium_amount"
                                                        type="number"
                                                        step="0.01"
                                                        value={data.premium_amount}
                                                        onChange={(e) => setData('premium_amount', e.target.value)}
                                                        className={`bg-gray-50 ${errors.premium_amount ? 'border-red-500' : ''}`}
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
                                                    className={`bg-gray-50 ${errors.commission_amount ? 'border-red-500' : ''}`}
                                                    readOnly
                                                />
                                                {errors.commission_amount && <p className="text-sm text-red-600">{errors.commission_amount}</p>}
                                            </div>
                                        </div>

                                        {(calculatedPremium > 0 || calculatedCommission > 0) && (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-green-700">Calculated Premium:</span>
                                                    <span className="font-medium text-green-900">₦{calculatedPremium.toLocaleString()}</span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between text-sm">
                                                    <span className="text-green-700">Commission:</span>
                                                    <span className="font-medium text-green-900">₦{calculatedCommission.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Notes</CardTitle>
                                <CardDescription>Any additional information or special terms</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Enter any additional notes or special terms..."
                                        rows={4}
                                        className={errors.notes ? 'border-red-500' : ''}
                                    />
                                    {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-end space-x-4">
                                    <Button type="button" variant="outline" onClick={() => router.visit(route('quotes.index'))} disabled={processing}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="outline" disabled={processing || !selectedProduct}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Saving...' : 'Save as Draft'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={(e) => handleSubmit(e, 'send')}
                                        disabled={processing || !selectedProduct}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {processing ? 'Sending...' : 'Save & Send Quote'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
