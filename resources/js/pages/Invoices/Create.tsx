import { InvoiceForm } from '@/components/Invoice/InvoiceForm';
import AppLayout from '@/layouts/app-layout';
import { Customer, Policy } from '@/types';
import { Head } from '@inertiajs/react';

interface Props {
    customers: Customer[];
    policies: Policy[];
    lastInvoiceNumber?: string;
    queryParams?: Record<string, string>;
}

export default function CreateInvoice({ customers, policies, lastInvoiceNumber, queryParams }: Props) {
    return (
        <AppLayout>
            <Head title="Create Invoice" />
            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
                    <p className="text-muted-foreground">Create a new invoice</p>
                </div>
                <InvoiceForm
                    customers={customers}
                    policies={policies}
                    mode="create"
                    lastInvoiceNumber={lastInvoiceNumber}
                    queryParams={queryParams}
                />
            </div>
        </AppLayout>
    );
}
