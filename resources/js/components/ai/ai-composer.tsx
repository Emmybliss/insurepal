import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    ArrowUp,
    FileText,
    Image as ImageIcon,
    Mic,
    MicOff,
    Paperclip,
    Square,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface AIComposerProps {
    onSend: (message: string, file?: File) => void;
    isLoading?: boolean;
    onStopGeneration?: () => void;
    placeholder?: string;
    isLanding?: boolean;
}

export function AIComposer({
    onSend,
    isLoading = false,
    onStopGeneration,
    placeholder = 'Ask InsurePal AI anything about policies, claims, quotes...',
    isLanding = false,
}: AIComposerProps) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize text area based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [input]);

    const handleSubmit = () => {
        if ((!input.trim() && !attachedFile) || isLoading) return;
        onSend(input.trim(), attachedFile || undefined);
        setInput('');
        setAttachedFile(null);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Toggle speech recognition
    const toggleSpeech = () => {
        const windowSpeech = window as unknown as {
            webkitSpeechRecognition?: any;
            SpeechRecognition?: any;
        };
        const SpeechRecognition =
            windowSpeech.SpeechRecognition || windowSpeech.webkitSpeechRecognition;

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

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAttachedFile(e.target.files?.[0] || e.dataTransfer.files[0]);
        }
    };

    const canSubmit = (input.trim().length > 0 || !!attachedFile) && !isLoading;

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full transition-all duration-300 ${
                isLanding ? 'max-w-3xl mx-auto' : 'max-w-3xl mx-auto'
            }`}
        >
            {/* Hidden File Inputs */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv,.xlsx"
            />
            <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept="image/*"
            />

            {/* Composer Main Container */}
            <div
                className={`relative flex flex-col rounded-[26px] border p-2 transition-all duration-300 ${
                    isDragging
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                        : 'border-border/60 bg-background/90 shadow-xl shadow-slate-900/5 dark:shadow-black/40 backdrop-blur-xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'
                }`}
            >
                {/* Attached File Chip Preview */}
                {attachedFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 text-xs text-foreground w-fit max-w-full">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{attachedFile.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                            ({(attachedFile.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                            onClick={() => setAttachedFile(null)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Textarea Input */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    disabled={isLoading}
                    className="w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden max-h-[200px] min-h-[44px] leading-relaxed"
                />

                {/* Controls Bar */}
                <div className="flex items-center justify-between pt-1 px-1">
                    {/* Left Controls */}
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    Attach PDF, Document or Spreadsheet
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    Upload Image
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleSpeech}
                                        disabled={isLoading}
                                        className={`h-8 w-8 rounded-full transition-colors ${
                                            isListening
                                                ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {isListening ? (
                                            <MicOff className="h-4 w-4 animate-pulse" />
                                        ) : (
                                            <Mic className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    {isListening ? 'Stop voice listening' : 'Voice input'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Right Controls: Send / Stop Generation */}
                    <div className="flex items-center gap-1.5">
                        {isLoading ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            onClick={onStopGeneration}
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 shadow-md"
                                        >
                                            <Square className="h-3.5 w-3.5 fill-current" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        Stop generating response
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                size="icon"
                                className={`h-8 w-8 rounded-full transition-all duration-200 ${
                                    canSubmit
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:scale-105 active:scale-95'
                                        : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                                }`}
                            >
                                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
                InsurePal AI may produce accurate information about policies, claims & regulations. Verify key facts.
            </p>
        </div>
    );
}
