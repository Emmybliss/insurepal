import { ReceiptForm } from '@/components/Receipts/ReceiptForm';
import AppLayout from '@/layouts/app-layout';
import { Customer, Invoice, Policy } from '@/types';
import { Head } from '@inertiajs/react';

interface CreateProps {
    customers: Customer[];
    policies: Policy[];
    nextReceiptNumber: string;
    invoice?: Invoice | null; // optional — passed when navigating from invoice detail
}

export default function CreateReceipt({ customers, policies, nextReceiptNumber, invoice }: CreateProps) {
    return (
        <AppLayout>
            <Head title="Record Payment" />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Record Payment</h2>
                    <p className="text-muted-foreground">Issue a new payment receipt against a policy</p>
                </div>

                <ReceiptForm customers={customers} policies={policies} nextReceiptNumber={nextReceiptNumber} invoice={invoice} />
            </div>
        </AppLayout>
    );
}
