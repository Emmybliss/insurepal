import { InputError } from '@/components/InputError';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Customer, Policy } from '@/types';
import { Invoice, InvoiceItem } from '@/types/invoices';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
export interface InvoiceFormProps {
    invoice?: Invoice;
    customers: Customer[];
    policies: Policy[];
    mode?: 'create' | 'edit';
    lastInvoiceNumber?: string;
    queryParams?: { customer_id?: string };
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, customers, policies, mode = 'create', lastInvoiceNumber, queryParams }) => {
    const [issueDateOpen, setIssueDateOpen] = useState(false);
    const [issueDateObj, setIssueDateObj] = useState<Date | undefined>(undefined);
    const [dueDateOpen, setDueDateOpen] = useState(false);
    const [dueDateObj, setDueDateObj] = useState<Date | undefined>(undefined);

    const { data, setData, post, put, processing, errors } = useForm({
        invoice_number: invoice?.invoice_number || lastInvoiceNumber || '',
        customer_id: invoice?.customer_id ? String(invoice.customer_id) : queryParams?.customer_id || '',
        policy_id: invoice?.policy_id ? String(invoice.policy_id) : '',
        created_at: invoice?.created_at || dayjs().format('YYYY-MM-DD'),
        due_date: invoice?.due_date || '',
        currency: invoice?.currency || 'NGN',
        notes: invoice?.notes || '',
        billing_address: invoice?.billing_address || {
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
        },
        shipping_address: invoice?.shipping_address || {
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
        },
        items: invoice?.items || [
            {
                description: '',
                quantity: 1,
                unit_price: 0,
                total: 0,
                tax_rate: 0,
                tax_amount: 0,
                discount_rate: 0,
                discount_amount: 0,
            },
        ],
    });
    useEffect(() => {
        if (data.created_at) {
            const parsed = dayjs(data.created_at);
            if (parsed.isValid()) {
                setIssueDateObj(parsed.toDate());
            }
        }
    }, [data.created_at]);

    useEffect(() => {
        if (data.due_date) {
            const parsed = dayjs(data.due_date);
            if (parsed.isValid()) {
                setDueDateObj(parsed.toDate());
            }
        }
    }, [data.due_date]);

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                description: '',
                quantity: 1,
                unit_price: 0,
                total: 0,
                tax_rate: 0,
                tax_amount: 0,
                discount_rate: 0,
                discount_amount: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItem = (index: number, field: keyof Omit<InvoiceItem, 'id' | 'invoice_id'>, value: string | number) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate totals
        const item = newItems[index];
        const subtotal = item.quantity * item.unit_price;
        item.tax_amount = subtotal * (item.tax_rate / 100);
        item.discount_amount = subtotal * (item.discount_rate / 100);
        item.total = subtotal + item.tax_amount - item.discount_amount;

        setData('items', newItems);
    };

    const calculateTotal = (): number => {
        return data.items.reduce((sum, item) => sum + item.total, 0);
    };

    const handlePolicyChange = (policyId: string) => {
        const policy = policies.find((p) => p.id.toString() === policyId);
        setData('policy_id', policyId);
        // if (policy) {
        //     setData('amount', policy.premium_amount.toString());
        //     setData(
        //         'description',
        //         `Being Premium Due on the Policy ${policy.policy_product.name}(${policy.policy_number}) Scheme for ${policy.effective_date ? dayjs(policy.effective_date).format('DD-MM-YYYY') : 'N/A'
        //         } to ${policy.expiry_date ? dayjs(policy.expiry_date).format('DD-MM-YYYY') : 'N/A'}. `,
        //     );
        // } else {
        //     setData('amount', '');
        //     setData('description', '');
        // }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'edit' && invoice) {
            put(route('invoices.update', invoice.id));
        } else {
            post(route('invoices.store'), {
                onSuccess: () => {
                    toast.success('Invoice created successfully');
                },
                onError: (errors) => {
                    console.log('Failed to create invoice', errors);
                    toast.error('Failed to create invoice');
                },
            });
        }
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    console.log('Policies data:', policies);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="invoice_number">Invoice Number</Label>
                            <Input id="invoice_number" name="invoice_number" value={data.invoice_number} readOnly />
                            <InputError message={errors.invoice_number} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer(Insured)</Label>
                            <Select
                                name="customer_id"
                                value={data.customer_id}
                                onValueChange={(value) => {
                                    router.get(route('invoices.create'), { customer_id: value }, { preserveScroll: true });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {getCustomerName(customer)}
                                            {customer.email ? ` - ${customer.email}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.customer_id} />
                        </div>
                        {/* Policy (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="policy_id">Policy (Optional)</Label>
                            <Select name="policy_id" value={data.policy_id} onValueChange={handlePolicyChange} disabled={!data.customer_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {policies.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No policies available
                                        </SelectItem>
                                    ) : (
                                        policies.map((policy) => (
                                            <SelectItem key={policy.id} value={policy.id.toString()}>
                                                {policy.policy_number}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.policy_id} />
                        </div>
                        {/* Issue Date */}
                        <div>
                            <Label htmlFor="created_at">Issue Date</Label>
                            <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn('w-full justify-start text-left font-normal', !data.created_at && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {data.created_at ? dayjs(data.created_at).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={issueDateObj}
                                        onSelect={(date) => {
                                            if (date) {
                                                setIssueDateObj(date);
                                                setData('created_at', dayjs(date).format('YYYY-MM-DD'));
                                            }
                                            setIssueDateOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.created_at && <p className="mt-2 text-sm text-red-600">{errors.created_at}</p>}
                        </div>
                        {/*  */}
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn('w-full justify-start text-left font-normal', !data.due_date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {data.due_date ? dayjs(data.due_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dueDateObj}
                                        onSelect={(date) => {
                                            if (date) {
                                                setDueDateObj(date);
                                                setData('due_date', dayjs(date).format('YYYY-MM-DD'));
                                            }
                                            setDueDateOpen(false);
                                        }}
                                        disabled={(date) => (data.created_at ? date < dayjs(data.created_at).toDate() : false)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.due_date && <p className="mt-2 text-sm text-red-600">{errors.due_date}</p>}
                        </div>
                        {/* Notes */}
                        <div className="md:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.items?.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 rounded-lg border p-4">
                                <div className="col-span-12 md:col-span-3">
                                    <Label>Description</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        placeholder="Item description"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Label>Unit Price</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Label>Tax Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={item.tax_rate}
                                        onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Label>Total</Label>
                                    <p className="mt-2 font-semibold">{item.total.toFixed(2)}</p>
                                </div>
                                <div className="col-span-12 flex items-end justify-end">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button type="button" onClick={addItem} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>{data.items.reduce((sum, item) => sum + item.tax_amount, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Discount</span>
                            <span>{data.items.reduce((sum, item) => sum + item.discount_amount, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{calculateTotal().toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {mode === 'edit' ? 'Update Invoice' : 'Create Invoice'}
                </Button>
            </div>
        </form>
    );
};
