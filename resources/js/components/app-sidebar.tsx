import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { getFooterNavItems, getSettingsNavItems, getSidebarConfig } from '@/config/sidebar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-permissions';
import { usePlan } from '@/hooks/use-plan';
import { useLang } from '@/hooks/useLang';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    Building,
    Building2,
    Calendar,
    ClipboardList,
    CreditCard,
    FileText,
    Key,
    LayoutGrid,
    MessageCircle,
    PlusCircle,
    Settings,
    Shield,
    ShieldCheck,
    Ticket,
    TrendingUp,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useLang();
    useSidebar();
    const auth = useAuth();
    const plan = usePlan();
    const { can, hasRole } = auth;

    const footerNavItems = getFooterNavItems(t);
    const settingsNavItems = getSettingsNavItems(auth, plan, t);

    let mainNavItems: NavItem[];

    if (hasRole('super_admin')) {
        mainNavItems = [
            {
                title: t('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
            },
            {
                title: t('Analytics'),
                href: route('admin.analytics'),
                icon: TrendingUp,
            },
            {
                title: t('Tenants'),
                href: route('admin.tenants.index'),
                icon: Building,
            },
            {
                title: t('Subscription Plans'),
                href: route('admin.plans.index'),
                icon: CreditCard,
            },
            {
                title: t('Insurance Companies'),
                href: route('admin.insurance-companies.index'),
                icon: Building2,
            },
            ...(can('manage_tenants')
                ? [
                      {
                          title: t('Users'),
                          href: route('admin.users.index'),
                          icon: Users,
                      },
                  ]
                : []),
            ...(can('manage_roles')
                ? [
                      {
                          title: t('Roles & Permissions'),
                          icon: Shield,
                          items: [
                              {
                                  title: t('Roles'),
                                  href: route('admin.roles.index'),
                                  icon: ShieldCheck,
                              },
                              {
                                  title: t('Permissions'),
                                  href: route('admin.permissions.index'),
                                  icon: Key,
                              },
                              {
                                  title: t('User Roles'),
                                  href: route('admin.user-roles.index'),
                                  icon: UserCog,
                              },
                          ],
                      },
                  ]
                : []),
            ...(can('manage_system_settings')
                ? [
                      {
                          title: t('Policy Management'),
                          icon: FileText,
                          items: [
                              {
                                  title: t('Policy Types'),
                                  href: route('admin.policy-types.index'),
                                  icon: FileText,
                              },
                              {
                                  title: t('Classes'),
                                  href: route('admin.policy-classes.index'),
                                  icon: FileText,
                              },
                              {
                                  title: t('Products'),
                                  href: route('admin.policy-products.index'),
                                  icon: Shield,
                              },
                          ],
                      },
                  ]
                : []),
            ...(can('manage_system_settings')
                ? [
                      {
                          title: t('Settings'),
                          href: route('admin.settings'),
                          icon: Settings,
                      },
                  ]
                : []),
            {
                title: t('Recycle Bin'),
                href: route('recycle-bin.index'),
                icon: Trash2,
            },
        ];
    } else if (hasRole('customer')) {
        mainNavItems = [
            {
                title: t('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
            },
            ...(can('view_policies')
                ? [
                      {
                          title: t('My Policies'),
                          href: route('policy-management.index'),
                          icon: Shield,
                      },
                  ]
                : []),
            {
                title: t('My Claims'),
                icon: ClipboardList,
                items: [
                    {
                        title: t('All Claims'),
                        href: route('claims.index'),
                        icon: ClipboardList,
                    },
                    {
                        title: t('File a Claim'),
                        href: route('claims.create'),
                        icon: PlusCircle,
                    },
                    {
                        title: t('Pending Claims'),
                        href: route('claims.index') + '?status=pending',
                        icon: AlertCircle,
                    },
                ],
            },
            ...(can('view_messages')
                ? [
                      {
                          title: t('Inbox'),
                          href: route('inbox.index'),
                          icon: MessageCircle,
                      },
                  ]
                : []),
            ...(can('view_renewals')
                ? [
                      {
                          title: t('Renewals'),
                          href: route('renewals.index'),
                          icon: Calendar,
                      },
                  ]
                : []),
            {
                title: t('Support'),
                href: route('support-tickets.index'),
                icon: Ticket,
            },
            {
                title: t('My KYC Verification'),
                href: route('customer.kyc.show'),
                icon: ShieldCheck,
            },
            {
                title: t('Notifications'),
                href: route('notifications.index'),
                icon: Bell,
            },
        ];
    } else if (auth.isUnderwriter || auth.isBroker) {
        mainNavItems = getSidebarConfig(
            auth.isUnderwriter ? 'underwriter' : 'broker',
            auth,
            plan,
            t,
        );
    } else {
        mainNavItems = [];
    }

    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-primary dark:bg-background">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {settingsNavItems.length > 0 && (
                    <NavMain items={settingsNavItems} title={t('Settings')} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
