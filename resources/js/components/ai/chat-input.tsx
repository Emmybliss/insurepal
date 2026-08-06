import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface ChatInputProps {
    onSend: (message: string, file?: File) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if ((!input.trim() && !attachedFile) || disabled) return;
        onSend(input.trim(), attachedFile || undefined);
        setInput('');
        setAttachedFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const toggleSpeech = () => {
        const windowSpeech = (window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any });
        const SpeechRecognition = windowSpeech.SpeechRecognition || windowSpeech.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
            };

            recognition.onerror = () => {
                setIsListening(false);
                toast.error('Voice input error. Please try again.');
            };

            recognition.start();
        } catch {
            setIsListening(false);
            toast.error('Could not start microphone input.');
        }
    };

    return (
        <div className="border-t bg-background p-4">
            {attachedFile && (
                <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-1 text-xs">
                    <span className="truncate font-medium text-foreground">📎 {attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="ml-2 text-muted-foreground hover:text-destructive">
                        ✕
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    title="Attach document or image"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={toggleSpeech}
                    disabled={disabled}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder ?? 'Ask InsurePal AI anything or state an action...'}
                    className="max-h-[120px] min-h-[44px] resize-none"
                    rows={1}
                    disabled={disabled}
                />
                <Button onClick={handleSubmit} disabled={(!input.trim() && !attachedFile) || disabled} size="icon" className="shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Press Enter to send, Shift+Enter for newline, or use Voice/Upload buttons.</p>
        </div>
    );
}
