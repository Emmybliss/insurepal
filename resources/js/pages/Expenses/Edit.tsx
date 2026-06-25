import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';

interface Expense {
    id: number;
    category: string;
    amount: number;
    currency: string;
    description: string;
    expense_date: string;
    receipt_path: string;
    status: string;
}

interface Props {
    expense: Expense;
    categories: string[];
}

export default function EditExpense({ expense, categories }: Props) {
    const initialDate = expense.expense_date ? dayjs(expense.expense_date.split('T')[0]).toDate() : undefined;
    const [expenseDateObj, setExpenseDateObj] = useState<Date | undefined>(initialDate);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        category: expense.category,
        amount: expense.amount.toString(),
        currency: expense.currency,
        description: expense.description || '',
        expense_date: expense.expense_date.split('T')[0],
        receipt: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use post with _method PUT for multipart/form-data with file uploads
        post(route('expenses.update', expense.id));
    };

    return (
        <AppLayout>
            <Head title="Edit Expense" />

            <div className="mx-auto max-w-2xl flex-1 space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                    <Link href={route('expenses.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Expense</h2>
                        <p className="text-muted-foreground">Modify expense details</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Expense Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={data.category} onValueChange={(val) => setData('category', val)}>
                                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                                </div>

                                <DatePickerSimple
                                    id="expense_date"
                                    label="Date"
                                    date={expenseDateObj}
                                    onSelect={(date) => {
                                        setExpenseDateObj(date);
                                        setData('expense_date', date ? dayjs(date).format('YYYY-MM-DD') : '');
                                    }}
                                />
                                {errors.expense_date && <p className="text-sm text-red-500">{errors.expense_date}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className={errors.amount ? 'border-red-500' : ''}
                                    />
                                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={data.currency} onValueChange={(val) => setData('currency', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What was this expense for?"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="receipt">Receipt (Upload to replace existing, max 2MB)</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('receipt', e.target.files ? e.target.files[0] : null)}
                                    className={errors.receipt ? 'border-red-500' : ''}
                                />
                                {errors.receipt && <p className="text-sm text-red-500">{errors.receipt}</p>}
                                {expense.receipt_path && !data.receipt && (
                                    <p className="text-sm text-muted-foreground">
                                        Current receipt:{' '}
                                        <a href={`/storage/${expense.receipt_path}`} target="_blank" className="text-blue-600 hover:underline">
                                            View
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={processing} className="w-full md:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
