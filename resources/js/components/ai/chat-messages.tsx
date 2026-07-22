import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface ChatMessagesProps {
    messages: Message[];
    isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    return (
        <div className="space-y-4">
            {messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3 rounded-lg p-4', message.role === 'assistant' ? 'bg-muted/50' : 'bg-primary/5')}>
                    <div
                        className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            message.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        )}
                    >
                        {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium">{message.role === 'assistant' ? 'InsurePal AI' : 'You'}</p>
                        <div className="prose prose-sm dark:prose-invert max-w-none">{message.content}</div>
                        <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString()}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                    </div>
                    <span className="text-sm">AI is thinking...</span>
                </div>
            )}
        </div>
    );
}
