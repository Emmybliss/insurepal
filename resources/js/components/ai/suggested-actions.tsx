import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface SuggestedAction {
    label: string;
    description: string;
    prompt: string;
}

interface SuggestedActionsProps {
    actions: SuggestedAction[];
    onSelect: (prompt: string) => void;
}

export function SuggestedActions({ actions, onSelect }: SuggestedActionsProps) {
    if (actions.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                <span>Suggested actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                    <Button key={action.label} variant="outline" size="sm" onClick={() => onSelect(action.prompt)} className="text-xs">
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
