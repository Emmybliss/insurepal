import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useActiveRoute } from '@/hooks/use-active-route';
import { useLang } from '@/hooks/useLang';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

export function NavMain({ items = [], title }: { items: NavItem[]; title?: string }) {
    const { t } = useLang();
    const defaultTitle = title || t('Platform');
    const { getActiveState } = useActiveRoute();
    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

    const handleOpenChange = (itemTitle: string, isOpen: boolean) => {
        setOpenGroups((prev) => ({ ...prev, [itemTitle]: isOpen }));
    };

    const renderNavItem = (item: NavItem) => {
        const { isActive, hasActiveChild, isActiveOrHasActiveChild } = getActiveState(item);

        // If item has subitems, render as collapsible
        if (item.items && item.items.length > 0) {
            const isOpen = openGroups[item.title] ?? hasActiveChild;
            return (
                <Collapsible
                    key={item.title}
                    asChild
                    open={isOpen}
                    onOpenChange={(open) => handleOpenChange(item.title, open)}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={{ children: item.title }} isActive={isActiveOrHasActiveChild}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.items.map((subItem) => {
                                    const { isActive: isSubItemActive } = getActiveState(subItem);
                                    return (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                                <Link href={subItem.href || '#'} prefetch>
                                                    {subItem.icon && <subItem.icon />}
                                                    <span>{subItem.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    );
                                })}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            );
        }

        // Regular navigation item with href
        return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={{ children: item.title }}>
                    <Link href={item.href || '#'} prefetch>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{defaultTitle}</SidebarGroupLabel>
            <SidebarMenu>{items.map(renderNavItem)}</SidebarMenu>
        </SidebarGroup>
    );
}
