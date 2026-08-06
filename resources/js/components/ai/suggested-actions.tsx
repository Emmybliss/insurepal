import { motion } from 'framer-motion';
import {
    ArrowRight,
    Download,
    FileCheck,
    FileText,
    HelpCircle,
    Mail,
    Plus,
    Sparkles,
} from 'lucide-react';

export interface ActionItem {
    label: string;
    description?: string;
    prompt: string;
    icon?: string;
}

interface SuggestedActionsProps {
    actions?: ActionItem[];
    onSelect: (promptText: string) => void;
}

export function SuggestedActions({ actions = [], onSelect }: SuggestedActionsProps) {
    if (!actions || actions.length === 0) return null;

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'mail':
                return <Mail className="h-3 w-3 text-sky-500" />;
            case 'download':
                return <Download className="h-3 w-3 text-emerald-500" />;
            case 'plus':
                return <Plus className="h-3 w-3 text-indigo-500" />;
            case 'explain':
                return <HelpCircle className="h-3 w-3 text-amber-500" />;
            case 'report':
                return <FileText className="h-3 w-3 text-blue-500" />;
            case 'policy':
                return <FileCheck className="h-3 w-3 text-purple-500" />;
            default:
                return <Sparkles className="h-3 w-3 text-primary" />;
        }
    };

    return (
        <div className="flex flex-col space-y-2 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Suggested Follow-ups</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {actions.map((action, idx) => (
                    <motion.button
                        key={action.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: idx * 0.04 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(action.prompt)}
                        className="group flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer shadow-2xs"
                    >
                        {getIcon(action.icon)}
                        <span>{action.label}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
