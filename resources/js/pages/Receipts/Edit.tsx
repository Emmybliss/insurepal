import { ReceiptForm } from '@/components/Receipts/ReceiptForm';
import AppLayout from '@/layouts/app-layout';
import { Customer, Invoice, Policy, Receipt } from '@/types';
import { Head } from '@inertiajs/react';

interface EditProps {
    receipt: Receipt;
    invoice?: Invoice | null; // may be null if receipt has no linked invoice
    customers: Customer[];
    policies: Policy[];
}

export default function EditReceipt({ receipt, invoice, customers, policies }: EditProps) {
    return (
        <AppLayout>
            <Head title={`Edit Receipt — ${receipt.receipt_number}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Receipt</h2>
                    <p className="text-muted-foreground">
                        Update payment receipt <span className="font-mono font-semibold">{receipt.receipt_number}</span>
                    </p>
                </div>

                <ReceiptForm receipt={receipt} mode="edit" customers={customers} policies={policies} invoice={invoice} />
            </div>
        </AppLayout>
    );
}
