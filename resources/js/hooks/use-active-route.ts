import { type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Hook to check if a navigation item is active
 */
export function useActiveRoute() {
    const page = usePage();

    /**
     * Check if a route is currently active
     */
    const isRouteActive = (href: string | { url: string } | undefined): boolean => {
        if (!href) return false;

        const targetUrl = typeof href === 'string' ? href : href.url;
        const currentUrl = page.url;

        // Extract pathname from full URLs
        const getPathname = (url: string) => {
            try {
                // If it's a full URL, extract the pathname
                if (url.startsWith('http')) {
                    return new URL(url).pathname;
                }
                // If it's already a relative path, return as is
                return url;
            } catch {
                // If URL parsing fails, return the original string
                return url;
            }
        };

        const targetPath = getPathname(targetUrl);
        const currentPath = getPathname(currentUrl);

        // Handle exact matches for root routes
        if (targetPath === '/' && currentPath === '/') return true;
        if (targetPath === '/dashboard' && currentPath === '/dashboard') return true;

        // Handle startsWith for nested routes, but avoid false positives
        if (targetPath === '/') return false; // Don't match everything for root
        if (targetPath === '/dashboard' && currentPath.startsWith('/dashboard')) return true;

        // For other routes, use startsWith but ensure it's not a partial match
        return currentPath.startsWith(targetPath) && (currentPath === targetPath || currentPath.charAt(targetPath.length) === '/');
    };

    /**
     * Check if any subitem in a navigation item is active
     */
    const hasActiveSubItem = (items: NavItem[]): boolean => {
        return items.some((subItem) => {
            if (subItem.items && subItem.items.length > 0) {
                return hasActiveSubItem(subItem.items);
            }
            return isRouteActive(subItem.href);
        });
    };

    /**
     * Get the active state for a navigation item
     */
    const getActiveState = (item: NavItem) => {
        const isActive = isRouteActive(item.href);
        const hasActiveChild = item.items && item.items.length > 0 ? hasActiveSubItem(item.items) : false;

        return {
            isActive,
            hasActiveChild,
            isActiveOrHasActiveChild: isActive || hasActiveChild,
        };
    };

    return {
        isRouteActive,
        hasActiveSubItem,
        getActiveState,
        currentUrl: page.url,
    };
}
