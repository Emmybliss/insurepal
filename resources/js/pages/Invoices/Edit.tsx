import { InvoiceForm } from '@/components/Invoice/InvoiceForm';
import AppLayout from '@/layouts/app-layout';
import { Customer, Policy } from '@/types';
import { Invoice } from '@/types/invoices';
import { Head } from '@inertiajs/react';

interface Props {
    customers: Customer[];
    policies: Policy[];
    invoice: Invoice;
}

export default function EditInvoice({ customers, policies, invoice }: Props) {
    return (
        <AppLayout>
            <Head title={`Edit Invoice - ${invoice.id}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Invoice</h2>
                    <p className="text-muted-foreground">Edit invoice details</p>
                </div>

                <InvoiceForm customers={customers} policies={policies} mode="edit" invoice={invoice} />
            </div>
        </AppLayout>
    );
}
