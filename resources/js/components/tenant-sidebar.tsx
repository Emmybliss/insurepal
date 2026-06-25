import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    Calendar,
    ChevronDown,
    CreditCard,
    FileBarChart,
    FileText,
    HelpCircle,
    LayoutDashboard,
    MessageSquare,
    Plus,
    Receipt,
    Settings,
    Shield,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    tenant?: {
        name: string;
        type: string;
    };
}

interface NavigationItem {
    name: string;
    href?: string;
    icon: React.ElementType;
    badge?: string;
    children?: NavigationItem[];
    roles?: string[];
}

export default function TenantSidebar() {
    const { auth } = usePage().props as { auth: { user: User } };
    const [openSections, setOpenSections] = useState<string[]>(['customers', 'policies']);

    const toggleSection = (section: string) => {
        setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
    };

    const isActive = (href: string) => {
        return window.location.pathname === href || window.location.pathname.startsWith(href);
    };

    const hasRole = (roles?: string[]) => {
        if (!roles) return true;
        return roles.includes(auth.user.role) || auth.user.role === 'super_admin';
    };

    const getNavigationItems = (): NavigationItem[] => {
        const baseItems: NavigationItem[] = [
            {
                name: 'Dashboard',
                href: 'dashboard',
                icon: LayoutDashboard,
            },
        ];

        // Super Admin specific navigation
        if (auth.user.role === 'super_admin') {
            return [
                ...baseItems,
                {
                    name: 'Tenant Management',
                    icon: Building2,
                    children: [
                        { name: 'All Tenants', href: 'admin.tenants.index', icon: Building2 },
                        { name: 'Subscription Plans', href: 'admin.plans.index', icon: CreditCard },
                        { name: 'Platform Analytics', href: 'admin.analytics.index', icon: BarChart3 },
                    ],
                },
                {
                    name: 'System Settings',
                    href: 'admin.settings.index',
                    icon: Settings,
                },
            ];
        }

        // Tenant-specific navigation
        const tenantItems: NavigationItem[] = [
            ...baseItems,
            {
                name: 'Customer Management',
                icon: Users,
                children: [
                    { name: 'All Customers', href: 'customers.index', icon: Users },
                    { name: 'Add Customer', href: 'customers.create', icon: UserPlus },
                    { name: 'Individual Customers', href: 'customers.index?type=individual', icon: Users },
                    { name: 'Corporate Customers', href: 'customers.index?type=corporate', icon: Building2 },
                ],
            },
            {
                name: 'Quote Management',
                icon: FileText,
                children: [
                    { name: 'All Quotes', href: 'quotes.index', icon: FileText },
                    { name: 'Create Quote', href: 'quotes.create', icon: Plus },
                    { name: 'Draft Quotes', href: 'quotes.index?status=draft', icon: FileText },
                    { name: 'Sent Quotes', href: 'quotes.index?status=sent', icon: FileText },
                    { name: 'Accepted Quotes', href: 'quotes.index?status=accepted', icon: FileText },
                ],
            },
            {
                name: 'Policy Management',
                icon: Shield,
                children: [
                    { name: 'All Policies', href: 'policies.index', icon: Shield },
                    { name: 'Active Policies', href: 'policies.index?filter=active', icon: Shield },
                    { name: 'Expiring Soon', href: 'policies.index?filter=expiring', icon: Calendar, badge: 'urgent' },
                    { name: 'Expired Policies', href: 'policies.index?filter=expired', icon: Shield },
                ],
            },
            {
                name: 'Financial Management',
                icon: CreditCard,
                children: [
                    { name: 'Debit Notes', href: 'debit-notes.index', icon: Receipt },
                    { name: 'Credit Notes', href: 'credit-notes.index', icon: Receipt },
                    { name: 'Premium Reports', href: 'reports.premiums', icon: BarChart3 },
                    { name: 'Commission Reports', href: 'reports.commissions', icon: BarChart3, roles: ['broker'] },
                ],
            },
            {
                name: 'Reports & Analytics',
                icon: BarChart3,
                children: [
                    { name: 'Business Overview', href: 'reports.overview', icon: BarChart3 },
                    { name: 'NAICOM Reports', href: 'reports.naicom', icon: FileBarChart },
                    { name: 'Customer Analytics', href: 'reports.customers', icon: Users },
                    { name: 'Product Performance', href: 'reports.products', icon: Shield },
                ],
            },
            {
                name: 'Communication',
                icon: MessageSquare,
                children: [
                    { name: 'Inbox', href: 'messages.index', icon: MessageSquare },
                    { name: 'Send Message', href: 'messages.create', icon: Plus },
                    { name: 'Notifications', href: 'notifications.index', icon: MessageSquare },
                ],
            },
        ];

        // Add settings at the bottom
        tenantItems.push({
            name: 'Settings',
            icon: Settings,
            children: [
                { name: 'Company Profile', href: 'settings.company', icon: Building2 },
                { name: 'User Management', href: 'settings.users', icon: Users },
                { name: 'Billing & Subscription', href: 'settings.billing', icon: CreditCard },
                { name: 'Preferences', href: 'settings.preferences', icon: Settings },
            ],
        });

        return tenantItems;
    };

    const navigationItems = getNavigationItems();

    return (
        <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center border-b border-gray-200 px-4">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">Insure Pal</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
                {/* User Info */}
                <div className="mb-6 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{auth.user.name}</p>
                    <p className="text-xs text-gray-500">{auth.user.email}</p>
                    {auth.user.tenant && (
                        <div className="mt-2 flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                                {auth.user.tenant.name}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {auth.user.tenant.type}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    {navigationItems.map((item) => (
                        <div key={item.name}>
                            {item.children ? (
                                <Collapsible
                                    open={openSections.includes(item.name.toLowerCase().replace(' ', '_'))}
                                    onOpenChange={() => toggleSection(item.name.toLowerCase().replace(' ', '_'))}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between px-3 py-2 text-left">
                                            <div className="flex items-center space-x-3">
                                                <item.icon className="h-5 w-5 text-gray-500" />
                                                <span className="text-sm font-medium">{item.name}</span>
                                                {item.badge && (
                                                    <Badge variant={item.badge === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    'h-4 w-4 transition-transform',
                                                    openSections.includes(item.name.toLowerCase().replace(' ', '_')) && 'rotate-180',
                                                )}
                                            />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-1">
                                        {item.children.map(
                                            (child) =>
                                                hasRole(child.roles) && (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href || '#'}
                                                        className={cn(
                                                            'group ml-6 flex items-center space-x-3 rounded-md px-3 py-2 text-sm',
                                                            child.href && isActive(child.href)
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                        )}
                                                    >
                                                        <child.icon className="h-4 w-4" />
                                                        <span>{child.name}</span>
                                                        {child.badge && (
                                                            <Badge
                                                                variant={child.badge === 'urgent' ? 'destructive' : 'secondary'}
                                                                className="ml-auto text-xs"
                                                            >
                                                                {child.badge}
                                                            </Badge>
                                                        )}
                                                    </Link>
                                                ),
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    className={cn(
                                        'group flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium',
                                        item.href && isActive(item.href)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Help Section */}
            <div className="border-t border-gray-200 p-4">
                <Link
                    href="#"
                    className="group flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    <HelpCircle className="h-5 w-5" />
                    <span>Help & Support</span>
                </Link>
            </div>
        </div>
    );
}
