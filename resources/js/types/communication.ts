export type CommunicationMode = 'email' | 'chat';

export type CommunicationStatus = 'open' | 'assigned' | 'resolved' | 'closed' | 'archived';

export type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type CommunicationType = 'internal' | 'support' | 'broker_customer' | 'policy' | 'claim' | 'customer' | 'general';

export type ParticipantRole = 'sender' | 'recipient' | 'cc' | 'bcc' | 'participant' | 'assignee';

export type CommunicationUser = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
};

export interface CommunicationThread {
    id: number;
    tenant_id: number;
    created_by: number;
    mode: CommunicationMode;
    type: CommunicationType;
    subject: string | null;
    priority: CommunicationPriority;
    status: CommunicationStatus;
    assigned_to: number | null;
    related_type: string | null;
    related_id: number | null;
    last_message_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    creator?: CommunicationUser;
    assignee?: CommunicationUser | null;
    participants?: CommunicationParticipant[];
    latestMessage?: CommunicationMessage | null;
    unread_count?: number;
}

export interface CommunicationMessage {
    id: number;
    thread_id: number;
    sender_id: number;
    body: string;
    body_type: 'plain' | 'html';
    is_draft: boolean;
    sent_at: string | null;
    edited_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    sender?: CommunicationUser;
    attachments?: CommunicationAttachment[];
    read_receipts?: CommunicationReadReceipt[];
}

export interface CommunicationParticipant {
    id: number;
    thread_id: number;
    user_id: number;
    role: ParticipantRole;
    joined_at: string | null;
    last_read_at: string | null;
    muted_at: string | null;
    archived_at: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    user?: CommunicationUser;
}

export interface CommunicationAttachment {
    id: number;
    message_id: number;
    disk: string;
    path: string;
    original_name: string;
    mime_type: string;
    size: number;
    created_at: string;
    updated_at: string;
    url?: string;
}

export interface CommunicationReadReceipt {
    id: number;
    message_id: number;
    user_id: number;
    read_at: string | null;
    delivered_at: string | null;
    created_at: string;
    updated_at: string;
    user?: CommunicationUser;
}

export interface CommunicationStats {
    total: number;
    unread: number;
    assigned_to_me: number;
    by_status: Record<CommunicationStatus, number>;
    by_mode: Record<CommunicationMode, number>;
}

export interface CommunicationFilters {
    search?: string;
    type?: CommunicationType;
    status?: CommunicationStatus;
    priority?: CommunicationPriority;
    mode?: CommunicationMode;
    per_page?: number;
}

export interface CreateInboxMessageData {
    subject: string;
    body: string;
    recipients: number[];
    cc?: number[];
    bcc?: number[];
    priority?: CommunicationPriority;
    related_type?: string;
    related_id?: number;
    send?: boolean;
    action?: 'send' | 'draft';
}

