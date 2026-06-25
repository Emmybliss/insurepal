import { useAuth } from '@/hooks/use-permissions';
import { usePlan } from '@/hooks/use-plan';
import { type NavItem } from '@/types';
import { getBrokerNavItems } from './broker';
import { getUnderwriterNavItems } from './underwriter';
import {
    Award,
    Bell,
    Building,
    Building2,
    CreditCard,
    FileText,
    HelpCircle,
    ShieldCheck,
    Trash2,
} from 'lucide-react';

export type AuthHelpers = ReturnType<typeof useAuth>;
export type PlanHelpers = ReturnType<typeof usePlan>;
export type TranslateFn = (key: string) => string;

export function getSidebarConfig(
    tenantType: 'underwriter' | 'broker',
    auth: AuthHelpers,
    plan: PlanHelpers,
    t: TranslateFn,
): NavItem[] {
    if (tenantType === 'underwriter') {
        return getUnderwriterNavItems(auth, plan, t);
    }

    return getBrokerNavItems(auth, plan, t);
}

export function getSettingsNavItems(
    auth: AuthHelpers,
    plan: PlanHelpers,
    t: TranslateFn,
): NavItem[] {
    const { can, hasRole, hasAnyRole } = auth;
    const { hasPlan } = plan;

    const items: NavItem[] = [];

    if (can('view_document_templates') && hasPlan('professional')) {
        items.push({
            title: t('Templates'),
            href: route('templates.index'),
            icon: FileText,
        });
    }

    if (can('view_settings') && !hasRole('customer') && !hasRole('super_admin')) {
        if (hasAnyRole(['underwriter', 'broker']) || can('edit_settings')) {
            items.push({
                title: t('Company'),
                href: route('settings.company'),
                icon: Building,
            });
        }

        if (can('edit_settings') || hasAnyRole(['underwriter', 'broker'])) {
            items.push({
                title: t('Billing'),
                href: route('settings.billing'),
                icon: CreditCard,
            });
        }

        if (can('edit_settings')) {
            items.push({
                title: t('Notifications'),
                href: route('settings.notifications'),
                icon: Bell,
            });
        }

        if (can('manage_certificate_settings') || can('edit_settings')) {
            items.push({
                title: t('Certificates'),
                href: route('settings.certificates'),
                icon: Award,
            });
        }

        if (hasAnyRole(['underwriter', 'broker'])) {
            items.push({
                title: t('Insurance Companies'),
                href: route('settings.insurance-companies.index'),
                icon: Building2,
            });
        }

        if (hasAnyRole(['underwriter', 'broker'])) {
            items.push({
                title: t('KYC Verification'),
                href: route('settings.broker-kyc.show'),
                icon: ShieldCheck,
            });
        }

        if (can('recycle_bin_view')) {
            items.push({
                title: t('Recycle Bin'),
                href: route('recycle-bin.index'),
                icon: Trash2,
            });
        }
    }

    return items;
}

export function getFooterNavItems(t: TranslateFn): NavItem[] {
    return [
        {
            title: t('Help & Support'),
            href: route('help.index'),
            icon: HelpCircle,
        },
    ];
}
