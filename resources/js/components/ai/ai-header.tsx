import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Bot,
    ChevronDown,
    Command,
    PanelLeft,
    PanelLeftClose,
    Plus,
    Settings,
    Sparkles,
    Zap,
} from 'lucide-react';

export interface ModelOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    badge?: string;
}

export const AI_MODELS: ModelOption[] = [
    {
        id: 'insurepal-ultra',
        name: 'InsurePal Ultra 3.6',
        description: 'Most intelligent model for complex underwriting & claims',
        icon: 'sparkles',
        badge: 'Recommended',
    },
    {
        id: 'insurepal-fast',
        name: 'InsurePal Flash 3.0',
        description: 'Ultra-fast responses for quick queries & summaries',
        icon: 'zap',
        badge: 'Fast',
    },
    {
        id: 'deepseek-r1',
        name: 'DeepSeek R1 Reasoning',
        description: 'Advanced logical reasoning & regulatory compliance checks',
        icon: 'bot',
        badge: 'Reasoning',
    },
    {
        id: 'claude-3-5',
        name: 'Claude 3.5 Sonnet',
        description: 'Superior document drafting & customer email generation',
        icon: 'sparkles',
    },
];

interface AIHeaderProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    currentModel: string;
    onSelectModel: (modelId: string) => void;
    onNewChat: () => void;
    onOpenCommandPalette: () => void;
    onOpenSettings: () => void;
    tenantName?: string;
}

export function AIHeader({
    sidebarOpen,
    onToggleSidebar,
    currentModel,
    onSelectModel,
    onNewChat,
    onOpenCommandPalette,
    onOpenSettings,
    tenantName = 'InsurePal Enterprise',
}: AIHeaderProps) {
    const selectedModelObj = AI_MODELS.find((m) => m.id === currentModel) || AI_MODELS[0];

    return (
        <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/85 px-4 backdrop-blur-md transition-colors">
            {/* Left Section: Sidebar Toggle & Title & New Chat */}
            <div className="flex items-center gap-3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleSidebar}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                {sidebarOpen ? (
                                    <PanelLeftClose className="h-4.5 w-4.5" />
                                ) : (
                                    <PanelLeft className="h-4.5 w-4.5" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {sidebarOpen ? 'Close sidebar (⌘[)' : 'Open sidebar (⌘[)'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onNewChat}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
                            >
                                <Plus className="h-4.5 w-4.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            New Chat
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Model Selector Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="group h-8 gap-2 rounded-full border border-border/50 bg-muted/30 px-3 text-xs font-medium hover:bg-muted/70 focus-visible:ring-1"
                        >
                            <div className="flex items-center gap-1.5 text-primary">
                                <Sparkles className="h-3.5 w-3.5 fill-primary/20 text-primary" />
                                <span className="font-semibold text-foreground">{selectedModelObj.name}</span>
                            </div>
                            {selectedModelObj.badge && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal leading-none bg-primary/10 text-primary border-0">
                                    {selectedModelObj.badge}
                                </Badge>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-80 p-1.5 shadow-xl">
                        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Select AI Engine
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1" />
                        {AI_MODELS.map((model) => {
                            const isSelected = model.id === currentModel;
                            return (
                                <DropdownMenuItem
                                    key={model.id}
                                    onClick={() => onSelectModel(model.id)}
                                    className={`flex items-start gap-3 rounded-lg p-2.5 cursor-pointer transition-colors ${
                                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                                >
                                    <div className={`mt-0.5 rounded-md p-1.5 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {model.icon === 'zap' ? (
                                            <Zap className="h-4 w-4" />
                                        ) : model.icon === 'bot' ? (
                                            <Bot className="h-4 w-4" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-foreground">{model.name}</span>
                                            {model.badge && (
                                                <span className="text-[10px] text-primary font-medium">{model.badge}</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {model.description}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Middle Section: Branding & Tenant */}
            <div className="hidden items-center gap-2 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
                <span className="text-xs font-medium text-muted-foreground">
                    {tenantName}
                </span>
            </div>

            {/* Right Section: Command Palette & Settings */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCommandPalette}
                    className="hidden h-8 items-center gap-2 rounded-lg border-border/60 bg-muted/20 px-2.5 text-xs text-muted-foreground hover:bg-muted sm:flex"
                >
                    <Command className="h-3.5 w-3.5" />
                    <span>Search or actions</span>
                    <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-[10px]">⌘</span>K
                    </kbd>
                </Button>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onOpenSettings}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <Settings className="h-4.5 w-4.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            AI Settings & Preferences
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    );
}
