import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowDown,
    Bot,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AICommandPalette } from './ai-command-palette';
import { AIComposer } from './ai-composer';
import { AIHeader } from './ai-header';
import { AIMessageCard, Message } from './ai-message-card';
import { AISettingModal, AISettingsModal } from './ai-settings-modal';
import { AISidebar, Conversation } from './ai-sidebar';
import { ApprovalCard } from './approval-card';
import { SuggestedActions } from './suggested-actions';
import { SuggestedPrompts } from './suggested-prompts';

interface ApprovalItem {
    id: number;
    tool_name: string;
    parameters: Record<string, unknown>;
    status: string;
    created_at: string;
}

interface AIWorkspaceProps {
    conversations?: Conversation[];
    messages?: Message[];
    approvals?: ApprovalItem[];
    suggestions?: { label: string; description: string; prompt: string }[];
    conversationsLoading?: boolean;
    tenantName?: string;
    userName?: string;
    userAvatar?: string;
}

export function AIWorkspace({
    conversations: initialConversations = [],
    messages: initialMessages = [],
    approvals: initialApprovals = [],
    suggestions: initialSuggestions = [],
    conversationsLoading: initialConversationsLoading = false,
    tenantName = 'InsurePal Enterprise',
    userName = 'You',
    userAvatar,
}: AIWorkspaceProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
    const [isLoading, setIsLoading] = useState(false);
    const [isConversationsLoading, setIsConversationsLoading] = useState(initialConversationsLoading);
    const [error, setError] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [currentModel, setCurrentModel] = useState('insurepal-ultra');
    const [processingApprovals, setProcessingApprovals] = useState<Set<number>>(new Set());
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Handle Scroll detection to show "Scroll to bottom" floating button
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setShowScrollBottom(!isNearBottom);
    };

    // CSRF Safe Fetch
    const safeFetchJson = async (url: string, options: RequestInit = {}) => {
        const getCsrfToken = () => {
            if (typeof document === 'undefined') return '';
            const match = document.cookie.match(new RegExp('(?:^|; )XSRF-TOKEN=([^;]+)'));
            if (match) return decodeURIComponent(match[1]);
            const metaElement = document.querySelector('meta[name="csrf-token"]');
            return metaElement?.getAttribute('content') || '';
        };

        const csrfToken = getCsrfToken();
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken, 'X-CSRF-TOKEN': csrfToken } : {}),
            ...((options.headers as Record<string, string>) || {}),
        };

        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers,
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            return data;
        }

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
        }

        throw new Error('Received non-JSON response from server.');
    };

    const fetchConversations = async () => {
        try {
            setIsConversationsLoading(true);
            const data = await safeFetchJson('/api/v1/ai/conversations');
            if (data.success) {
                setConversations(data.data || []);
            }
        } catch {
            // Silently handle conversation listing load error
        } finally {
            setIsConversationsLoading(false);
        }
    };

    const fetchConversationMessages = async (id: number) => {
        try {
            setIsLoading(true);
            const data = await safeFetchJson(`/api/v1/ai/conversations/${id}`);
            if (data.success && data.data) {
                setActiveConversationId(id);
                setMessages(data.data.messages || []);
            }
        } catch {
            toast.error('Failed to load conversation history.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const convId = urlParams.get('conversation');
            if (convId) {
                fetchConversationMessages(Number(convId));
            }
        }
    }, []);

    const handleSend = async (messageText: string, file?: File) => {
        if (!messageText.trim() && !file) return;

        setIsLoading(true);
        setError(null);
        let finalMessage = messageText;

        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                if (activeConversationId) {
                    formData.append('conversation_id', activeConversationId.toString());
                }

                const uploadData = await safeFetchJson('/api/v1/ai/upload-document', {
                    method: 'POST',
                    body: formData,
                });
                if (uploadData.success) {
                    finalMessage = `${messageText}\n\n[Attached File: ${uploadData.data.file_name}]`;
                }
            } catch {
                toast.error('File upload failed, sending text message only.');
            }
        }

        const tempId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                role: 'user',
                content: finalMessage,
                created_at: new Date().toISOString(),
            },
        ]);

        try {
            const data = await safeFetchJson('/api/v1/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: finalMessage,
                    conversation_id: activeConversationId,
                    model: currentModel,
                }),
            });

            if (data.success) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: 'assistant',
                        content: data.data.message,
                        created_at: new Date().toISOString(),
                    },
                ]);
                if (data.data.conversation_id && !activeConversationId) {
                    setActiveConversationId(data.data.conversation_id);
                }
                fetchConversations();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
        if (lastUserMessage) {
            setError(null);
            handleSend(lastUserMessage.content);
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
    };

    const handleDeleteConversation = async (id: number) => {
        try {
            const data = await safeFetchJson(`/api/v1/ai/conversations/${id}`, {
                method: 'DELETE',
            });
            if (data.success) {
                setConversations((prev) => prev.filter((c) => c.id !== id));
                if (activeConversationId === id) {
                    handleNewChat();
                }
                toast.success('Conversation deleted');
            }
        } catch {
            toast.error('Failed to delete conversation.');
        }
    };

    const handleRenameConversation = (id: number, newTitle: string) => {
        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
        toast.success('Conversation renamed');
    };

    const handlePinConversation = (id: number, pinned: boolean) => {
        setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, is_pinned: pinned } : c))
        );
        toast.success(pinned ? 'Pinned to top' : 'Unpinned conversation');
    };

    const handleDuplicateConversation = (id: number) => {
        const target = conversations.find((c) => c.id === id);
        if (target) {
            const newConv: Conversation = {
                id: Date.now(),
                title: `${target.title} (Copy)`,
                created_at: new Date().toISOString(),
            };
            setConversations((prev) => [newConv, ...prev]);
            toast.success('Conversation duplicated');
        }
    };

    const handleApproval = async (id: number, action: 'approve' | 'reject') => {
        setProcessingApprovals((prev) => new Set(prev).add(id));
        try {
            const data = await safeFetchJson(`/api/v1/ai/approvals/${id}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (data.success) {
                setApprovals((prev) => prev.filter((a) => a.id !== id));
                toast.success(action === 'approve' ? 'Action approved' : 'Action rejected');
            } else {
                toast.error(data.message || `Failed to ${action}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : `Failed to ${action}. Please try again.`;
            toast.error(msg);
        } finally {
            setProcessingApprovals((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // Contextual Follow-ups for last message
    const contextualFollowUps = [
        { label: 'Explain Further', prompt: 'Could you explain that in more detail?', icon: 'explain' },
        { label: 'Export PDF', prompt: 'Generate an exportable summary report', icon: 'download' },
        { label: 'Draft Customer Email', prompt: 'Draft a formal customer email based on this', icon: 'mail' },
        { label: 'Show Policy Terms', prompt: 'What are the key policy terms and exclusions?', icon: 'policy' },
    ];

    const isLanding = messages.length === 0;

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20">
            {/* Sidebar Component */}
            <AISidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                conversations={conversations}
                activeId={activeConversationId}
                onSelectConversation={fetchConversationMessages}
                onNewChat={handleNewChat}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={handleRenameConversation}
                onPinConversation={handlePinConversation}
                onDuplicateConversation={handleDuplicateConversation}
                isLoading={isConversationsLoading}
            />

            {/* Main Content Viewport */}
            <div className="flex flex-1 flex-col h-full overflow-hidden relative">
                {/* Header Bar */}
                <AIHeader
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    currentModel={currentModel}
                    onSelectModel={setCurrentModel}
                    onNewChat={handleNewChat}
                    onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                    onOpenSettings={() => setSettingsOpen(true)}
                    tenantName={tenantName}
                />

                {/* Main View Area */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto relative p-4 md:p-6"
                >
                    {/* LANDING / EMPTY STATE VIEW */}
                    {isLanding ? (
                        <div className="flex min-h-full flex-col items-center justify-center py-10 px-4 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full max-w-3xl space-y-6"
                            >
                                {/* Ambient Glow Background Effect */}
                                <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary shadow-xs">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>InsurePal Enterprise AI Copilot</span>
                                    </div>
                                    <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
                                        How can I help you today?
                                    </h1>
                                    <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
                                        Ask about policies, claims, underwriting, renewals, reports, NAICOM regulations, customer profiles, or anything related to insurance.
                                    </p>
                                </div>

                                {/* Prominent Landing Composer */}
                                <AIComposer
                                    onSend={handleSend}
                                    isLoading={isLoading}
                                    isLanding={true}
                                />

                                {/* Suggested Prompts Pill Grid */}
                                <div className="pt-2">
                                    <SuggestedPrompts onSelect={handleSend} />
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        /* CONVERSATION MESSAGE STREAM VIEW */
                        <div className="max-w-3xl mx-auto space-y-6 pb-24">
                            {messages.map((message) => (
                                <AIMessageCard
                                    key={message.id}
                                    message={message}
                                    onRegenerate={message.role === 'assistant' ? handleRetry : undefined}
                                    userAvatar={userAvatar}
                                    userName={userName}
                                />
                            ))}

                            {/* Streaming / Loading Shimmer State */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-xs text-muted-foreground shadow-xs w-fit"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Bot className="h-4 w-4 animate-spin" />
                                    </div>
                                    <div className="flex items-center gap-2 font-medium">
                                        <span>InsurePal AI is reasoning...</span>
                                        <span className="flex gap-1">
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]" />
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Contextual Follow-up Chips after last assistant message */}
                            {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                                <SuggestedActions actions={contextualFollowUps} onSelect={handleSend} />
                            )}

                            {/* Error Retry Alert */}
                            {error && (
                                <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-center">
                                    <AlertCircle className="h-6 w-6 text-destructive" />
                                    <p className="text-xs text-destructive font-medium">{error}</p>
                                    <Button variant="outline" size="sm" onClick={handleRetry} className="h-8 gap-1.5 text-xs">
                                        <RefreshCw className="h-3.5 w-3.5" /> Retry Request
                                    </Button>
                                </div>
                            )}

                            {/* Pending Approvals */}
                            {approvals.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Pending Tool Approvals
                                    </h4>
                                    {approvals.map((approval) => (
                                        <ApprovalCard
                                            key={approval.id}
                                            toolName={approval.tool_name}
                                            parameters={approval.parameters}
                                            onApprove={() => handleApproval(approval.id, 'approve')}
                                            onReject={() => handleApproval(approval.id, 'reject')}
                                            isProcessing={processingApprovals.has(approval.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Floating Scroll-to-Bottom Button */}
                <AnimatePresence>
                    {showScrollBottom && !isLanding && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => scrollToBottom('smooth')}
                                className="h-8 rounded-full border-border/60 bg-background/90 shadow-md backdrop-blur-md text-xs font-semibold gap-1.5"
                            >
                                <ArrowDown className="h-3.5 w-3.5" /> Scroll to bottom
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Fixed Bottom Composer (Active Conversation State) */}
                {!isLanding && (
                    <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
                        <AIComposer
                            onSend={handleSend}
                            isLoading={isLoading}
                            onStopGeneration={() => setIsLoading(false)}
                            isLanding={false}
                        />
                    </div>
                )}
            </div>

            {/* Command Palette Modal */}
            <AICommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                onSelectPrompt={handleSend}
                onNewChat={handleNewChat}
                onSelectModel={setCurrentModel}
                conversations={conversations}
                onSelectConversation={fetchConversationMessages}
            />

            {/* Settings Modal */}
            <AISettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </div>
    );
}
