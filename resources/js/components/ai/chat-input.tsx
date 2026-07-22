import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = () => {
        if (!input.trim() || disabled) return;
        onSend(input.trim());
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="border-t bg-background p-4">
            <div className="flex gap-2">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder ?? 'Ask InsurePal AI anything...'}
                    className="max-h-[120px] min-h-[44px] resize-none"
                    rows={1}
                    disabled={disabled}
                />
                <Button onClick={handleSubmit} disabled={!input.trim() || disabled} size="icon" className="shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Powered by GPT-4. Press Enter to send, Shift+Enter for new line.</p>
        </div>
    );
}
