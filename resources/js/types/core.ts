import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { InvoiceStatus } from './invoices';

declare global {
    interface Window {
        Echo: any; // Or specific type if available
    }
}

export interface Auth {
    user: User;
    tenant_plan?: {
        slug: string;
        name: string;
        sort_order: number;
        features: string[];
    } | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    tenant_id?: number | null;
    phone?: string | null;
    roles: Role[];
    permissions: string[];
    primary_role: string;
    is_active?: boolean;
    is_online?: boolean;
    role?: string | null;
    last_login_at?: string | null;
    last_active_at?: string | null;
    settings?: Record<string, any>;
    tenant?: Tenant;
    can: UserPermissions;
    [key: string]: unknown;
}

export interface Tenant {
    id: number;
    parent_tenant_id: number | null;
    name: string;
    slug: string;
    type: 'underwriter' | 'broker';
    email: string;
    phone?: string | null;
    address?: string | null;
    default_locale: string;
    default_timezone: string;
    logo?: string | null;
    subscription_plan_id?: number | null;
    subscription_started_at?: string | null;
    subscription_expires_at?: string | null;
    settings?: Record<string, any> | null;
    status: 'active' | 'inactive' | 'suspended';
    trial_ends_at?: string | null;
    created_at: string;
    updated_at: string;
    users?: User[];
    customers?: Customer[];
    subscriptions?: Subscription[];
}

export interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string;
    logo?: string | null;
    display_name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    type: 'individual' | 'corporate';
    tenant_id: number;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    is_active: boolean;
    users_count?: number;
}

export interface UserPermissions {
    view_customers: boolean;
    create_customers: boolean;
    edit_customers: boolean;
    delete_customers: boolean;
    view_quotes: boolean;
    create_quotes: boolean;
    edit_quotes: boolean;
    delete_quotes: boolean;
    view_policies: boolean;
    create_policies: boolean;
    edit_policies: boolean;
    delete_policies: boolean;
    view_reports: boolean;
    generate_reports: boolean;
    view_users: boolean;
    create_users: boolean;
    edit_users: boolean;
    delete_users: boolean;
    manage_roles: boolean;
    view_settings: boolean;
    edit_settings: boolean;
    manage_tenants: boolean;
    view_platform_analytics: boolean;
    manage_system_settings: boolean;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    currency: string;
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
    trial_days: number;
    features?: string[] | null;
    max_users?: number | null;
    max_policies?: number | null;
    max_storage_gb?: number | null;
    is_active: boolean;
    is_popular: boolean;
    setup_fee?: number | null;
    paystack_plan_code?: string | null;
    sort_order: number;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
}

export interface Subscription {
    id: number;
    tenant_id: number;
    subscription_plan_id: number;
    status: 'active' | 'inactive' | 'canceled' | 'past_due';
    current_period_start: string;
    current_period_end: string;
    created_at: string;
    updated_at: string;
    plan?: SubscriptionPlan;
}

export interface SuperAdminStats {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    total_customers: number;
    underwriters: number;
    brokers: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface PolicyType {
    id: number;
    name: string;
}

export interface PolicyCategory {
    id: number;
    name: string;
    policy_type_id: number;
}

export interface PolicyClass {
    id: number;
    name: string;
    policy_type_id: number;
}

export interface PolicyProduct {
    id: number;
    tenant_id: number;
    policy_class_id: number;
    policy_type_id: number;
    code: string;
    name: string;
    description?: string | null;
    base_premium: string;
    commission_rate: string;
    currency: string;
    default_coverage_period: number;
    min_sum_assured: string;
    max_sum_assured: string | null;
    requires_medical_exam: boolean;
    requires_underwriting: boolean;
    is_active: boolean;
    sort_order: number;
    coverage_details: any[];
    default_values: any[];
    exclusions: any[];
    form_fields: any[];
    premium_factors: any[];
    required_documents: any[];
    terms_conditions: any[];
    created_at: string;
    updated_at: string;
}

export type PolicyStatus = 'draft' | 'active' | 'expired' | 'cancelled' | 'expiring_soon';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'referred';
export type PaymentFrequency = 'annually' | 'monthly' | 'quarterly' | 'bi-annually';

export interface Policy {
    id: number;
    customer_id: number;
    policy_product: PolicyProduct;
    policy_number: string;
    customer: Customer;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    base_premium: number;
    commission_rate: number;
    requires_underwriting: boolean;
    requires_medical_exam: boolean;
    currency: string;
    tenant_id: number;
    status: PolicyStatus;
    approval_status: ApprovalStatus;
    effective_date: string;
    expiry_date: string;
    coverage_details: Record<string, any>;
    premium_amount: number;
    commission_amount: number;
    total_amount: number;
    payment_frequency: PaymentFrequency;
    form_data?: Record<string, any> | null;
    terms_conditions?: string | null;
    notes?: string | null;
    internal_notes?: string | null;
    created_by: number;
    approved_by?: number | null;
    approved_at?: string | null;
    issued_at?: string | null;
    renewed_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    policy_type: PolicyType;
    policy_class: PolicyClass;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cheque';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_rate: number;
    tax_amount: number;
    discount_rate: number;
    discount_amount: number;
}

export interface Invoice {
    id: number;
    tenant_id: number;
    customer_id: number;
    policy_id: number;
    invoice_number: string;
    type: 'policy' | 'service' | 'other';
    status: InvoiceStatus;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    due_date: string;
    notes?: string;
    currency: string;
    user?: User;
    created_at: string;
    updated_at: string;
    billing_address?: {
        street?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
    };
    customer?: Customer;
    tenant?: Tenant;
    policy?: Policy;
    items?: InvoiceItem[];
    receipts?: Receipt[];
}

export interface Receipt {
    id: number;
    receipt_number: string;
    invoice_id: number;
    invoice: Invoice;
    tenant_id: number;
    user_id: number;
    customer_id: number;
    policy_id: number;
    user?: User;
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
    customer?: Customer;
    tenant?: Tenant;
}

export interface Template {
    id: number;
    tenant_id: number;
    name: string;
    type: string;
    description?: string;
    page_size: string;
    orientation: string;
    design_json: any;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface SiteSettingsProps {
    [key: string]: any;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: Auth;
    settings: SiteSettingsProps;
};
