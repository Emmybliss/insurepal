export interface User {
    id: number;
    name: string;
    email: string;
    tenant_id: number;
}

export interface Address {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface InvoiceItem {
    id?: number;
    invoice_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_rate: number;
    tax_amount: number;
    discount_rate: number;
    discount_amount: number;
    created_at?: string;
    updated_at?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Invoice {
    id: number;
    invoice_number: string;
    tenant_id: number;
    user_id: number;
    customer_id: number;
    policy_id: number;
    user: User;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    currency: string;
    status: InvoiceStatus;
    due_date: string;
    notes?: string;
    billing_address: Address;
    shipping_address?: Address;
    items: InvoiceItem[];
    receipts?: Receipt[];
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Receipt {
    id: number;
    receipt_number: string;
    invoice_id: number;
    invoice: Invoice;
    tenant_id: number;
    user_id: number;
    customer_id: number;
    policy_id: number;
    user: User;
    amount_paid: number;
    currency: string;
    payment_method: PaymentMethod;
    transaction_id?: string;
    payment_status: PaymentStatus;
    payment_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
