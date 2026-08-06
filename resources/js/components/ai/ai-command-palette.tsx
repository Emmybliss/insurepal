import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import {
    Calculator,
    FileCheck,
    FileSpreadsheet,
    FileText,
    MessageSquare,
    Plus,
    RefreshCw,
    Scale,
    Sparkles,
    Trash2,
    Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import { Conversation } from './ai-sidebar';

interface AICommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectPrompt: (prompt: string) => void;
    onNewChat: () => void;
    onSelectModel: (modelId: string) => void;
    conversations: Conversation[];
    onSelectConversation: (id: number) => void;
}

export function AICommandPalette({
    open,
    onOpenChange,
    onSelectPrompt,
    onNewChat,
    onSelectModel,
    conversations,
    onSelectConversation,
}: AICommandPaletteProps) {
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    const handleRunPrompt = (prompt: string) => {
        onSelectPrompt(prompt);
        onOpenChange(false);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search conversations..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {/* Quick Actions Group */}
                <CommandGroup heading="Actions">
                    <CommandItem
                        onSelect={() => {
                            onNewChat();
                            onOpenChange(false);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 text-primary" />
                        <span>Start New Chat</span>
                        <CommandShortcut>⌘N</CommandShortcut>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {/* Insurance AI Quick Prompts */}
                <CommandGroup heading="Insurance Copilot Actions">
                    <CommandItem onSelect={() => handleRunPrompt('Generate a standard broker slip for Commercial Property Insurance')}>
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Generate Broker Slip</span>
                    </CommandItem>
                    <CommandItem onSelect={() => handleRunPrompt('Draft an insurance quote for Motor Fleet Policy')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-indigo-500" />
                        <span>Draft Insurance Quote</span>
                    </CommandItem>
                    <CommandItem onSelect={() => handleRunPrompt('Analyze policy terms and risk exclusions')}>
                        <FileCheck className="mr-2 h-4 w-4 text-emerald-500" />
                        <span>Analyze Policy Risk Exclusions</span>
                    </CommandItem>
                    <CommandItem onSelect={() => handleRunPrompt('Explain NAICOM regulation and solvency margin requirements')}>
                        <Scale className="mr-2 h-4 w-4 text-amber-500" />
                        <span>Explain NAICOM Solvency Margins</span>
                    </CommandItem>
                    <CommandItem onSelect={() => handleRunPrompt('Calculate estimated premium breakdown')}>
                        <Calculator className="mr-2 h-4 w-4 text-green-500" />
                        <span>Calculate Premium Breakdown</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {/* AI Engines Group */}
                <CommandGroup heading="Switch AI Model Engine">
                    <CommandItem
                        onSelect={() => {
                            onSelectModel('insurepal-ultra');
                            onOpenChange(false);
                        }}
                    >
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                        <span>InsurePal Ultra 3.6 (Default)</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            onSelectModel('insurepal-fast');
                            onOpenChange(false);
                        }}
                    >
                        <Zap className="mr-2 h-4 w-4 text-amber-500" />
                        <span>InsurePal Flash 3.0 (Fast)</span>
                    </CommandItem>
                </CommandGroup>

                {/* Conversations History */}
                {conversations.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Recent Conversations">
                            {conversations.slice(0, 5).map((conv) => (
                                <CommandItem
                                    key={conv.id}
                                    onSelect={() => {
                                        onSelectConversation(conv.id);
                                        onOpenChange(false);
                                    }}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
