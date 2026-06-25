import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { useFullscreen } from '@/hooks/useFullscreen';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import NavigationButtons from './custom/NavigationButtons';
import NotificationIcon from './custom/NotificationIcon';
import { ProfileDropDownMenu } from './custom/ProfileDropDownMenu';
import { LanguageSwitcherWithLabel } from './LanguageSwitcher';
import { ThemeSwitcher } from './theme/theme-switcher';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <NavigationButtons fallbackUrl="/dashboard" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleReload}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reload page</TooltipContent>
                </Tooltip>
                <NotificationIcon />
                <ThemeSwitcher />
                <LanguageSwitcherWithLabel />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" onClick={toggleFullscreen}>
                            {isFullscreen ? <Minimize /> : <Maximize />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFullscreen ? 'Minimize' : 'Maximize'}</TooltipContent>
                </Tooltip>
                <ModeToggle />
                <ProfileDropDownMenu />
            </div>
        </header>
    );
}
