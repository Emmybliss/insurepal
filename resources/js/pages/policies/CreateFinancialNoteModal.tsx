import { Button } from '@/components/ui/button';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Loader2 } from 'lucide-react';

interface Props {
    policy: any;
    type: 'debit' | 'credit';
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateFinancialNoteModal({ policy, type, isOpen, onClose }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        tax_amount: '',
        description: '',
        due_date: '',
        items: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = type === 'debit' ? route('policies.debit-note.store', policy.id) : route('policies.credit-note.store', policy.id);
        post(url, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create {type === 'debit' ? 'Debit' : 'Credit'} Note for {policy.policy_number}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} required />
                        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                    </div>
                    <div>
                        <Label htmlFor="tax_amount">Tax Amount</Label>
                        <Input id="tax_amount" type="number" value={data.tax_amount} onChange={(e) => setData('tax_amount', e.target.value)} />
                        {errors.tax_amount && <p className="mt-1 text-xs text-red-500">{errors.tax_amount}</p>}
                    </div>
                    {type === 'debit' && (
                        <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <DatePickerSimple
                                date={data.due_date ? new Date(data.due_date) : undefined}
                                onSelect={(date) => setData('due_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                placeholder="Select due date"
                            />
                            {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date}</p>}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>
                    <div>
                        <Label htmlFor="items">Items (JSON format)</Label>
                        <Textarea
                            id="items"
                            value={data.items}
                            onChange={(e) => setData('items', e.target.value)}
                            placeholder='e.g., [{"name": "Item 1", "quantity": 1, "price": 100}]'
                        />
                        {errors.items && <p className="mt-1 text-xs text-red-500">{errors.items}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Note
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
