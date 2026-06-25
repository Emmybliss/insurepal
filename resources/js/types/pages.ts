import { Invoice, PaginatedData, Receipt } from '@/types/invoices';
import { User } from '.';

export interface AuthPageProps {
    auth: {
        user: User;
    };
}

export interface InvoicesIndexPageProps extends AuthPageProps {
    invoices: PaginatedData<Invoice>;
}

export interface InvoiceShowPageProps extends AuthPageProps {
    invoice: Invoice;
}

export interface ReceiptsIndexPageProps extends AuthPageProps {
    receipts: PaginatedData<Receipt>;
}

export interface ReceiptCreatePageProps extends AuthPageProps {
    invoice?: Invoice;
}

export interface ReceiptShowPageProps extends AuthPageProps {
    receipt: Receipt;
}
