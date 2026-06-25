import { type NavItem } from '@/types';
import {
    Award,
    Banknote,
    BarChart3,
    Building,
    Building2,
    Calendar,
    CheckCircle,
    ClipboardList,
    FileCheck,
    FilePlus,
    FileStack,
    FileText,
    FileUp,
    ImageOff,
    Key,
    LayoutGrid,
    MessageCircle,
    NotebookText,
    Shield,
    ShieldCheck,
    Ticket,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import type { AuthHelpers, PlanHelpers, TranslateFn } from './index';

export function getUnderwriterNavItems(
    auth: AuthHelpers,
    plan: PlanHelpers,
    t: TranslateFn,
): NavItem[] {
    const { can, hasAnyRole } = auth;
    const items: NavItem[] = [];

    items.push({
        title: t('Dashboard'),
        href: route('dashboard'),
        icon: LayoutGrid,
    });

    if (can('view_customers')) {
        items.push({
            title: t('Customers'),
            href: route('customers.index'),
            icon: Users,
        });
    }

    if (can('view_policies')) {
        items.push({
            title: t('Insurance Products'),
            href: route('policies.index'),
            icon: Shield,
        });
    }

    if (can('view_brokers')) {
        items.push({
            title: t('Brokers'),
            href: route('brokers.index'),
            icon: Building,
        });
    }

    if (can('view_quotes')) {
        items.push({
            title: t('Quotations'),
            href: route('quotes.index'),
            icon: FileText,
        });
    }

    if (can('view_policies')) {
        const policySubItems: NavItem[] = [];

        policySubItems.push({
            title: t('Issued Policies'),
            href: route('policy-management.index'),
            icon: FileCheck,
        });

        if (can('create_policies')) {
            policySubItems.push({
                title: t('Issue New Policy'),
                href: route('policy-management.create-direct'),
                icon: FilePlus,
            });
        }

        policySubItems.push({
            title: t('Policy Approvals'),
            href: route('policy-approvals.index'),
            icon: CheckCircle,
        });

        policySubItems.push({
            title: t('Certificates'),
            href: route('certificates.index'),
            icon: Award,
        });

        items.push({
            title: t('Policy Management'),
            icon: Shield,
            items: policySubItems,
        });
    }

    if (can('view_financial_notes')) {
        const financialSubItems: NavItem[] = [];

        financialSubItems.push({
            title: t('Debit Notes'),
            href: route('debit-notes.index'),
            icon: Banknote,
        });
        financialSubItems.push({
            title: t('Credit Notes'),
            href: route('credit-notes.index'),
            icon: Banknote,
        });
        financialSubItems.push({
            title: t('Invoices'),
            href: route('invoices.index'),
            icon: FileText,
        });
        financialSubItems.push({
            title: t('Receipts'),
            href: route('receipts.index'),
            icon: NotebookText,
        });
        financialSubItems.push({
            title: t('Expenses'),
            href: route('expenses.index'),
            icon: FileText,
        });

        items.push({
            title: t('Financial Notes'),
            icon: Banknote,
            items: financialSubItems,
        });
    }

    if (can('view_claims')) {
        items.push({
            title: t('Claims Management'),
            href: route('claims.index'),
            icon: ClipboardList,
        });
    }

    if (can('renew_policies')) {
        items.push({
            title: t('Renewals'),
            href: route('renewals.index'),
            icon: Calendar,
        });
    }

    if (can('view_reports')) {
        items.push({
            title: t('Reports'),
            href: route('reports.index'),
            icon: BarChart3,
        });
    }

    if (can('view_messages')) {
        items.push({
            title: t('Inbox'),
            href: route('inbox.index'),
            icon: MessageCircle,
        });
    }

    if (can('view_support_tickets')) {
        items.push({
            title: t('Support Tickets'),
            href: route('support-tickets.index'),
            icon: Ticket,
        });
    }

    if (hasAnyRole(['underwriter', 'broker'])) {
        items.push({
            title: t('Connections'),
            href: route('tenant-relationships.index'),
            icon: Building2,
        });
    }

    const toolkitItems: NavItem[] = [
        {
            title: t('Toolkit Home'),
            href: route('document-toolkit.index'),
            icon: LayoutGrid,
        },
        {
            title: t('Branding'),
            href: route('document-toolkit.branding.index'),
            icon: FileText,
        },
        {
            title: t('Converter'),
            href: route('document-toolkit.converter'),
            icon: FileUp,
        },
        {
            title: t('Merger'),
            href: route('document-toolkit.merger'),
            icon: FileStack,
        },
        {
            title: t('Compressor'),
            href: route('document-toolkit.compressor'),
            icon: ImageOff,
        },
    ];

    items.push({
        title: t('Document Toolkit'),
        icon: FilePlus,
        items: toolkitItems,
    });

    if (can('view_users')) {
        items.push({
            title: t('User Management'),
            href: route('user-management.index'),
            icon: UserCog,
        });
    }

    if (can('recycle_bin_view')) {
        items.push({
            title: t('Recycle Bin'),
            href: route('recycle-bin.index'),
            icon: Trash2,
        });
    }

    if (can('manage_roles') || can('view_users')) {
        items.push({
            title: t('Roles & Permissions'),
            icon: Shield,
            items: [
                ...(can('manage_roles')
                    ? [
                          {
                              title: t('Roles'),
                              href: route('role-management.index'),
                              icon: ShieldCheck,
                          },
                      ]
                    : []),
                ...(can('view_users')
                    ? [
                          {
                              title: t('Permissions'),
                              href: route('permission-management.index'),
                              icon: Key,
                          },
                      ]
                    : []),
            ],
        });
    }

    return items;
}
