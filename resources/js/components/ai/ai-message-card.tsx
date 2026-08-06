import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import {
    Bot,
    Check,
    CheckCircle2,
    Copy,
    Download,
    Edit2,
    FileText,
    RefreshCw,
    Share2,
    Shield,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
    User,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export interface Message {
    id: number;
    role: 'user' | 'assistant' | 'error';
    content: string;
    created_at: string;
    metadata?: Record<string, any>;
}

interface AIMessageCardProps {
    message: Message;
    onRegenerate?: () => void;
    onEditUserMessage?: (messageId: number, oldContent: string) => void;
    onSelectFollowUp?: (promptText: string) => void;
    userAvatar?: string;
    userName?: string;
}

export function AIMessageCard({
    message,
    onRegenerate,
    onEditUserMessage,
    onSelectFollowUp,
    userAvatar,
    userName = 'You',
}: AIMessageCardProps) {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState<boolean | null>(null);

    const isAssistant = message.role === 'assistant';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast.success('Copied message to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFeedback = (isLike: boolean) => {
        if (liked === isLike) {
            setLiked(null);
        } else {
            setLiked(isLike);
            toast.success(isLike ? 'Feedback recorded: Helpful' : 'Feedback recorded: Needs improvement');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Conversation link copied to clipboard');
    };

    const handleExport = () => {
        const blob = new Blob([message.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insurepal-ai-response-${message.id}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported response as Markdown file');
    };

    // Helper to format basic markdown text into clean formatted HTML elements
    const renderFormattedContent = (content: string) => {
        // Parse code blocks ```code```
        const parts = content.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                const lines = part.slice(3, -3).trim().split('\n');
                const firstLine = lines[0] || '';
                const language = firstLine.match(/^[a-zA-Z0-9_-]+$/) ? firstLine : '';
                const codeBody = language ? lines.slice(1).join('\n') : lines.join('\n');

                return (
                    <div key={index} className="my-3 rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                {language || 'code'}
                            </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(codeBody);
                                    toast.success('Code copied');
                                }}
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                            >
                                <Copy className="h-3 w-3" /> Copy
                            </button>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{codeBody}</pre>
                    </div>
                );
            }

            // Standard paragraphs & line breaks
            const paragraphs = part.split('\n\n');
            return (
                <div key={index} className="space-y-3 leading-relaxed">
                    {paragraphs.map((p, pIdx) => {
                        if (!p.trim()) return null;

                        // Bullet list parsing
                        if (p.includes('\n* ') || p.includes('\n- ') || p.startsWith('* ') || p.startsWith('- ')) {
                            const listItems = p.split('\n').filter((l) => l.trim().startsWith('* ') || l.trim().startsWith('- '));
                            return (
                                <ul key={pIdx} className="list-disc pl-5 space-y-1 my-2">
                                    {listItems.map((li, lIdx) => (
                                        <li key={lIdx} className="text-sm">
                                            {formatInlineText(li.replace(/^[\*\-]\s+/, ''))}
                                        </li>
                                    ))}
                                </ul>
                            );
                        }

                        // Headers
                        if (p.startsWith('# ')) {
                            return <h1 key={pIdx} className="text-lg font-bold tracking-tight text-foreground">{formatInlineText(p.replace('# ', ''))}</h1>;
                        }
                        if (p.startsWith('## ')) {
                            return <h2 key={pIdx} className="text-base font-bold tracking-tight text-foreground">{formatInlineText(p.replace('## ', ''))}</h2>;
                        }
                        if (p.startsWith('### ')) {
                            return <h3 key={pIdx} className="text-sm font-bold text-foreground">{formatInlineText(p.replace('### ', ''))}</h3>;
                        }

                        return <p key={pIdx} className="text-sm text-foreground/90">{formatInlineText(p)}</p>;
                    })}
                </div>
            );
        });
    };

    // Helper for bold / italic inline formatting
    const formatInlineText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-foreground/95">{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    const formattedTime = new Date(message.created_at || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`group flex w-full gap-3 md:gap-4 py-2 ${
                isAssistant ? 'justify-start' : 'justify-end'
            }`}
        >
            {/* Assistant Avatar */}
            {isAssistant && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-md shadow-primary/20">
                    <Sparkles className="h-4.5 w-4.5" />
                </div>
            )}

            {/* Message Body Container */}
            <div className={`flex flex-col space-y-2 max-w-2xl ${isAssistant ? 'items-start' : 'items-end'}`}>
                {/* Name & Time */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <span className="font-semibold text-foreground">
                        {isAssistant ? 'InsurePal AI' : userName}
                    </span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                </div>

                {/* Message Bubble Card */}
                <div
                    className={`relative rounded-2xl p-4 shadow-xs transition-colors leading-relaxed ${
                        isAssistant
                            ? 'rounded-tl-sm border border-border/60 bg-card text-card-foreground shadow-sm'
                            : 'rounded-tr-sm bg-slate-900 text-slate-100 dark:bg-primary dark:text-primary-foreground shadow-md'
                    }`}
                >
                    {renderFormattedContent(message.content)}
                </div>

                {/* Assistant Action Bar */}
                {isAssistant && (
                    <div className="flex flex-wrap items-center gap-1 pt-1 opacity-90 group-hover:opacity-100 transition-opacity text-xs">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCopy}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Copy</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {onRegenerate && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onRegenerate}
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">Regenerate response</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleFeedback(true)}
                                        className={`h-7 w-7 ${liked === true ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Good response</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleFeedback(false)}
                                        className={`h-7 w-7 ${liked === false ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <ThumbsDown className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Poor response</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleShare}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Share conversation</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleExport}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Export Markdown</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            {/* User Avatar */}
            {!isAssistant && (
                <Avatar className="h-9 w-9 shrink-0 border border-border shadow-xs">
                    {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                        {userName ? userName.slice(0, 2).toUpperCase() : 'ME'}
                    </AvatarFallback>
                </Avatar>
            )}
        </motion.div>
    );
}
