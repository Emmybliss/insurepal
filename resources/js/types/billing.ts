export interface Customer {
    id: number;
    tenant_id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    phone?: string;
    status: string;
}

export interface Policy {
    id: number;
    tenant_id: number;
    customer_id: number;
    policy_number: string;
    status: string;
    type: string;
    premium_amount: number;
    total_amount: number;
}

export interface Invoice {
    id: number;
    tenant_id: number;
    customer_id: number;
    policy_id?: number;
    invoice_number: string;
    type: 'policy' | 'service' | 'other';
    status: string;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    due_date: string;
    notes?: string;
    currency: string;
    billing_address?: {
        street?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
    };
    customer?: Customer;
    policy?: Policy;
    items: InvoiceItem[];
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
}

export interface Receipt {
    id: number;
    tenant_id: number;
    customer_id: number;
    policy_id?: number;
    invoice_id: number;
    receipt_number: string;
    payment_date: string;
    payment_method: string;
    payment_reference?: string;
    amount_paid: number;
    transaction_id?: string;
    status: string;
    notes?: string;
    currency: string;
    customer?: Customer;
    policy?: Policy;
    invoice?: Invoice;
}
