import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

interface PlanInfo {
    slug: string;
    name: string;
    sort_order: number;
    features: string[];
}

export function useCanSms() {
    const { auth } = usePage<PageProps>().props;
    const tenantPlan = auth?.tenant_plan as PlanInfo | null;

    const canUseSms = tenantPlan?.slug === 'enterprise';

    const upgradeUrl = route('settings.billing');

    const getUpgradeMessage = () => {
        if (!tenantPlan) {
            return { title: 'Upgrade Required', message: 'Please upgrade your plan to use SMS notifications.' };
        }

        return {
            title: 'Enterprise Plan Required',
            message: `SMS notifications are available on the Enterprise plan. Your current plan is ${tenantPlan.name}.`,
        };
    };

    return {
        canUseSms,
        upgradeUrl,
        tenantPlan,
        getUpgradeMessage,
    };
}

export function useCanFeature(feature: string | string[]) {
    const { auth } = usePage<PageProps>().props;
    const tenantPlan = auth?.tenant_plan as PlanInfo | null;

    const features = tenantPlan?.features ?? [];

    const canAccess = Array.isArray(feature)
        ? feature.every((f) => features.includes(f))
        : features.includes(feature);

    return {
        canAccess,
        tenantPlan,
    };
}

export function usePlan() {
    const { auth } = usePage<PageProps>().props;
    const tenantPlan = auth?.tenant_plan as PlanInfo | null;

    const hasPlan = (planSlug: string): boolean => {
        return tenantPlan?.slug === planSlug;
    };

    const hasFeature = (feature: string): boolean => {
        return tenantPlan?.features?.includes(feature) ?? false;
    };

    const isEnterprise = (): boolean => {
        return tenantPlan?.slug === 'enterprise';
    };

    const isProfessional = (): boolean => {
        return tenantPlan?.slug === 'professional';
    };

    const isStarter = (): boolean => {
        return tenantPlan?.slug === 'starter';
    };

    return {
        tenantPlan,
        hasPlan,
        hasFeature,
        isEnterprise,
        isProfessional,
        isStarter,
    };
}