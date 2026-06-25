import { Customer } from './customer';
import { User } from './index';
import { Policy } from './policy';

export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'info_requested' | 'approved' | 'rejected' | 'settled' | 'closed';

export type ClaimType = 'accident' | 'theft' | 'damage' | 'fire' | 'flood' | 'medical' | 'death' | 'disability' | 'liability' | 'other';

export type DocumentType =
    | 'incident_photo'
    | 'police_report'
    | 'medical_report'
    | 'repair_estimate'
    | 'invoice'
    | 'receipt'
    | 'witness_statement'
    | 'correspondence'
    | 'other';

export interface Claim {
    id: number;
    tenant_id: number;
    policy_id: number;
    customer_id: number;
    claim_reference: string;
    claim_type: ClaimType;
    incident_date: string;
    incident_description: string;
    incident_location: string | null;
    claim_amount: number;
    approved_amount: number | null;
    status: ClaimStatus;
    decision_notes: string | null;
    internal_notes: string | null;
    submitted_by: number | null;
    reviewer_id: number | null;
    metadata: Record<string, any> | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    settled_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relationships
    customer?: Customer;
    policy?: Policy;
    submitted_by_user?: User;
    reviewer?: User;
    documents?: ClaimDocument[];
    comments?: ClaimComment[];
    activities?: ClaimActivity[];

    // Computed attributes
    status_label?: string;
    status_color?: string;
    days_open?: number;
}

export interface ClaimDocument {
    id: number;
    claim_id: number;
    uploaded_by: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    document_type: DocumentType;
    description: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    uploaded_by_user?: User;
    claim?: Claim;
}

export interface ClaimComment {
    id: number;
    claim_id: number;
    author_id: number;
    body: string;
    attachments: string[] | null;
    is_internal: boolean;
    parent_id: number | null;
    created_at: string;
    updated_at: string;

    // Relationships
    author?: User;
    claim?: Claim;
    parent?: ClaimComment;
    replies?: ClaimComment[];
}

export interface ClaimActivity {
    id: number;
    claim_id: number;
    user_id: number | null;
    action: string;
    description: string;
    properties: {
        old?: Record<string, any>;
        new?: Record<string, any>;
    } | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    user?: User;
    claim?: Claim;
}

export interface ClaimFilters {
    status?: ClaimStatus;
    claim_type?: ClaimType;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
}

export interface ClaimStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    settled: number;
}

export interface ClaimFormData {
    policy_id: number;
    customer_id: number;
    claim_type: ClaimType;
    incident_date: string;
    incident_description: string;
    incident_location?: string;
    claim_amount: number;
    documents?: File[];
    document_types?: DocumentType[];
    descriptions?: string[];
}

export interface ClaimWorkflowAction {
    approved_amount?: number;
    decision_notes?: string;
    message?: string;
    notes?: string;
}
