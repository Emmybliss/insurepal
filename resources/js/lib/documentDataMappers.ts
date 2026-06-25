import { mapPolicyDataForCertificate } from './certificateUtils';

/**
 * Map invoice data to a standardized format for document generation
 */
export const mapInvoiceDataForDocument = (invoice: any) => {
    return {
        // Invoice fields
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.created_at,
        due_date: invoice.due_date,
        status: invoice.status,
        total_amount: invoice.formatted_total_amount || invoice.total_amount,
        subtotal: invoice.formatted_subtotal || invoice.subtotal,
        tax_amount: invoice.formatted_tax_amount || invoice.tax_amount,
        discount_amount: invoice.formatted_discount_amount || invoice.discount_amount,
        currency: invoice.currency,
        notes: invoice.notes,

        // Customer fields
        customer_name:
            invoice.customer?.type === 'corporate'
                ? invoice.customer?.company_name
                : `${invoice.customer?.first_name} ${invoice.customer?.last_name}`,
        customer_email: invoice.customer?.email,
        customer_phone: invoice.customer?.phone,
        customer_address: invoice.customer?.address,
        billing_address:
            typeof invoice.billing_address === 'object'
                ? Object.values(invoice.billing_address || {})
                      .filter(Boolean)
                      .join(', ')
                : invoice.billing_address,
        shipping_address:
            typeof invoice.shipping_address === 'object'
                ? Object.values(invoice.shipping_address || {})
                      .filter(Boolean)
                      .join(', ')
                : invoice.shipping_address,

        // Tenant fields
        company_name: invoice.tenant?.name,
        company_email: invoice.tenant?.email,
        company_phone: invoice.tenant?.phone,
        company_address: invoice.tenant?.address,
        tenant_logo: invoice.tenant?.logo,

        // Items for table
        items:
            invoice.items?.map((item: any) => [
                item.description,
                item.quantity?.toString() || '1',
                item.formatted_unit_price || item.unit_price,
                item.formatted_total || item.total,
            ]) || [],

        // System fields
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
    };
};

/**
 * Map receipt data to a standardized format for document generation
 */
export const mapReceiptDataForDocument = (receipt: any) => {
    return {
        // Receipt fields
        receipt_number: receipt.receipt_number,
        receipt_date: receipt.payment_date,
        amount_paid: receipt.formatted_amount_paid || receipt.amount_paid,
        payment_method: receipt.payment_method?.replace('_', ' '),
        transaction_reference: receipt.transaction_id,
        currency: receipt.currency,
        notes: receipt.notes,
        invoice_number: receipt.invoice?.invoice_number || 'N/A',

        // Customer fields
        customer_name:
            receipt.customer?.type === 'corporate'
                ? receipt.customer?.company_name
                : `${receipt.customer?.first_name} ${receipt.customer?.last_name}`,
        customer_email: receipt.customer?.email,
        customer_phone: receipt.customer?.phone,
        customer_address: receipt.customer?.address,

        // Tenant fields
        company_name: receipt.tenant?.name,
        company_email: receipt.tenant?.email,
        company_phone: receipt.tenant?.phone,
        company_address: receipt.tenant?.address,
        tenant_logo: receipt.tenant?.logo,

        // System fields
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
    };
};

/**
 * Map credit note data to a standardized format for document generation
 */
export const mapCreditNoteDataForDocument = (creditNote: any) => {
    return {
        // Credit Note fields
        note_number: creditNote.note_number,
        issue_date: creditNote.issue_date,
        amount: creditNote.formatted_amount || creditNote.amount,
        tax_amount: creditNote.formatted_tax_amount || creditNote.tax_amount,
        total_amount: creditNote.formatted_total_amount || creditNote.total_amount,
        description: creditNote.description,
        policy_number: creditNote.policy?.policy_number || 'N/A',
        currency: creditNote.currency_code,

        // Customer fields
        customer_name:
            creditNote.customer?.type === 'corporate'
                ? creditNote.customer?.company_name
                : `${creditNote.customer?.first_name} ${creditNote.customer?.last_name}`,
        customer_email: creditNote.customer?.email,
        customer_phone: creditNote.customer?.phone,
        customer_address: creditNote.customer?.address,

        // Tenant fields
        company_name: creditNote.tenant?.name,
        company_email: creditNote.tenant?.email,
        company_phone: creditNote.tenant?.phone,
        company_address: creditNote.tenant?.address,
        tenant_logo: creditNote.tenant?.logo,

        // System fields
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
    };
};

/**
 * Map debit note data to a standardized format for document generation
 */
export const mapDebitNoteDataForDocument = (debitNote: any) => {
    return {
        // Debit Note fields
        note_number: debitNote.note_number,
        issue_date: debitNote.issue_date,
        amount: debitNote.formatted_amount || debitNote.amount,
        tax_amount: debitNote.formatted_tax_amount || debitNote.tax_amount,
        total_amount: debitNote.formatted_total_amount || debitNote.total_amount,
        description: debitNote.description,
        policy_number: debitNote.policy?.policy_number || 'N/A',
        currency: debitNote.currency_code,

        // Customer fields
        customer_name:
            debitNote.customer?.type === 'corporate'
                ? debitNote.customer?.company_name
                : `${debitNote.customer?.first_name} ${debitNote.customer?.last_name}`,
        customer_email: debitNote.customer?.email,
        customer_phone: debitNote.customer?.phone,
        customer_address: debitNote.customer?.address,

        // Tenant fields
        company_name: debitNote.tenant?.name,
        company_email: debitNote.tenant?.email,
        company_phone: debitNote.tenant?.phone,
        company_address: debitNote.tenant?.address,
        tenant_logo: debitNote.tenant?.logo,

        // System fields
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
    };
};

/**
 * Get mapper function based on document type
 */
export const getDocumentMapper = (documentType: string) => {
    const mappers: Record<string, (data: any) => any> = {
        invoice: mapInvoiceDataForDocument,
        receipt: mapReceiptDataForDocument,
        credit_note: mapCreditNoteDataForDocument,
        debit_note: mapDebitNoteDataForDocument,
        certificate: (data: any) => mapPolicyDataForCertificate(data, data.customer, data.tenant),
    };

    return mappers[documentType] || ((data: any) => data);
};
