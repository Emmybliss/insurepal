import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { router } from '@inertiajs/react';
import { AlertCircle, PanelLeft, PanelLeftClose, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApprovalCard } from './approval-card';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { SuggestedActions } from './suggested-actions';

interface Conversation {
    id: number;
    title: string;
    created_at: string;
}

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'error';
    content: string;
    created_at: string;
}

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
}

export function AIWorkspace({
    conversations: initialConversations = [],
    messages: initialMessages = [],
    approvals: initialApprovals = [],
    suggestions: initialSuggestions = [],
    conversationsLoading = false,
}: AIWorkspaceProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
    const [suggestions] = useState(initialSuggestions);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [processingApprovals, setProcessingApprovals] = useState<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (message: string) => {
        setIsLoading(true);
        setError(null);
        const tempId = Date.now();
        setMessages((prev) => [...prev, { id: tempId, role: 'user', content: message, created_at: new Date().toISOString() }]);

        try {
            const response = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ message, conversation_id: activeConversationId }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to send message');

            if (data.success) {
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, role: 'assistant', content: data.data.message, created_at: new Date().toISOString() },
                ]);
                if (data.data.conversation_id && !activeConversationId) {
                    setActiveConversationId(data.data.conversation_id);
                }
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
            setMessages((prev) => prev.filter((m) => m.role !== 'error'));
            handleSend(lastUserMessage.content);
        }
    };

    const handleApproval = async (id: number, action: 'approve' | 'reject') => {
        setProcessingApprovals((prev) => new Set(prev).add(id));
        try {
            const response = await fetch(`/api/v1/ai/approvals/${id}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                setApprovals((prev) => prev.filter((a) => a.id !== id));
                toast.success(action === 'approve' ? 'Action approved' : 'Action rejected');
            } else {
                toast.error(data.message || `Failed to ${action}`);
            }
        } catch {
            toast.error(`Failed to ${action}. Please try again.`);
        } finally {
            setProcessingApprovals((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        setError(null);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {sidebarOpen && (
                <div className="flex w-64 flex-col border-r bg-muted/30">
                    <div className="border-b p-3">
                        <Button onClick={handleNewChat} className="w-full" variant="outline" size="sm">
                            + New Chat
                        </Button>
                    </div>
                    <div className="flex-1 space-y-1 overflow-auto p-2">
                        {conversationsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
                        ) : conversations.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet</p>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => router.visit(`/ai-assistant?conversation=${conv.id}`)}
                                    className="w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                                >
                                    {conv.title}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                    </Button>
                    <h2 className="text-sm font-medium">AI Assistant</h2>
                    <Button variant="ghost" size="icon" onClick={handleNewChat}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 space-y-4 overflow-auto p-4">
                    {messages.length === 0 && !isLoading && !error && (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                <div className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">How can I help you today?</h3>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Ask me anything about policies, claims, customers, or financial documents.
                            </p>
                            <SuggestedActions actions={suggestions} onSelect={handleSend} />
                        </div>
                    )}

                    <ChatMessages messages={messages} isLoading={isLoading} />

                    {error && (
                        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-destructive">{error}</p>
                            <Button variant="outline" size="sm" onClick={handleRetry}>
                                <RefreshCw className="mr-2 h-3 w-3" /> Retry
                            </Button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />

                    {approvals.length > 0 && (
                        <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Pending Approvals</h4>
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
                </div>

                <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
        </div>
    );
}
