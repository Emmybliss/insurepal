import { motion } from 'framer-motion';
import {
    Calculator,
    CheckSquare,
    FileCheck,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    Mail,
    RefreshCw,
    Scale,
    UserCheck,
} from 'lucide-react';

export interface PromptOption {
    label: string;
    prompt: string;
    category?: string;
    iconName: string;
}

export const DEFAULT_SUGGESTED_PROMPTS: PromptOption[] = [
    {
        label: 'Generate Broker Slip',
        prompt: 'Generate a standard broker slip for a Commercial Property Insurance policy',
        iconName: 'file-text',
    },
    {
        label: 'Draft Insurance Quote',
        prompt: 'Draft an insurance quote for a Comprehensive Motor Fleet policy with 15 vehicles',
        iconName: 'file-spreadsheet',
    },
    {
        label: 'Analyze Policy',
        prompt: 'Analyze policy terms and risk exclusions for Policy #POL-2026-8891',
        iconName: 'file-check',
    },
    {
        label: 'Explain NAICOM Regulation',
        prompt: 'Explain current NAICOM solvency margin requirements and filing deadlines',
        iconName: 'scale',
    },
    {
        label: 'Summarize Customer Profile',
        prompt: 'Summarize customer profile and claim history for Royal Exchange Nigeria Ltd',
        iconName: 'user-check',
    },
    {
        label: 'Compare Policies',
        prompt: 'Compare coverage options between Standard Fire Special Perils vs Industrial All Risks',
        iconName: 'help-circle',
    },
    {
        label: 'Renewal Reminder',
        prompt: 'Draft a renewal reminder notice for policies expiring next month',
        iconName: 'refresh-cw',
    },
    {
        label: 'Calculate Premium',
        prompt: 'Calculate estimated premium breakdown for Fire & General Accident policy',
        iconName: 'calculator',
    },
    {
        label: 'Draft Customer Email',
        prompt: 'Draft a formal email to customer informing them of policy approval & certificate issue',
        iconName: 'mail',
    },
    {
        label: 'Review Claim',
        prompt: 'Review outstanding liability claim #CLM-2026-0421 and assess claim reserve',
        iconName: 'check-square',
    },
];

interface SuggestedPromptsProps {
    prompts?: PromptOption[];
    onSelect: (promptText: string) => void;
}

export function SuggestedPrompts({
    prompts = DEFAULT_SUGGESTED_PROMPTS,
    onSelect,
}: SuggestedPromptsProps) {
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'file-text':
                return <FileText className="h-3.5 w-3.5 text-blue-500" />;
            case 'file-spreadsheet':
                return <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500" />;
            case 'file-check':
                return <FileCheck className="h-3.5 w-3.5 text-emerald-500" />;
            case 'scale':
                return <Scale className="h-3.5 w-3.5 text-amber-500" />;
            case 'user-check':
                return <UserCheck className="h-3.5 w-3.5 text-purple-500" />;
            case 'help-circle':
                return <HelpCircle className="h-3.5 w-3.5 text-cyan-500" />;
            case 'refresh-cw':
                return <RefreshCw className="h-3.5 w-3.5 text-rose-500" />;
            case 'calculator':
                return <Calculator className="h-3.5 w-3.5 text-green-500" />;
            case 'mail':
                return <Mail className="h-3.5 w-3.5 text-sky-500" />;
            case 'check-square':
                return <CheckSquare className="h-3.5 w-3.5 text-teal-500" />;
            default:
                return <FileText className="h-3.5 w-3.5 text-primary" />;
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto py-2">
            {prompts.map((item, idx) => (
                <motion.button
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(item.prompt)}
                    className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3.5 py-2 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md cursor-pointer"
                >
                    {getIcon(item.iconName)}
                    <span>{item.label}</span>
                </motion.button>
            ))}
        </div>
    );
}
