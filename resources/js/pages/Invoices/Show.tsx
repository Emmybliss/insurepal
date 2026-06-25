import { InvoiceDetails } from '@/components/Invoice/InvoiceDetails';
import { Invoice } from '@/types/invoices';

interface ShowInvoiceProps {
    invoice: Invoice;
    templates: any[];
}

export default function ShowInvoice({ invoice, templates }: ShowInvoiceProps) {
    return <InvoiceDetails invoice={invoice} templates={templates} />;
}
