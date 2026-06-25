import { Input, InputProps } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, KeyboardEvent, ChangeEvent } from 'react';

interface SearchInputProps extends Omit<InputProps, 'value' | 'onChange'> {
    value?: string;
    onChange: (value: string) => void;
    debounce?: number;
    containerClassName?: string;
    showClearIcon?: boolean;
}

export function SearchInput({ 
    value = '', 
    onChange, 
    debounce = 300, 
    className, 
    containerClassName,
    showClearIcon = true,
    ...props 
}: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    // Sync external prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const performSearch = useCallback(
        (val: string) => {
            onChange(val);
        },
        [onChange],
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            performSearch(val);
        }, debounce);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            performSearch(localValue);
        }
        if (props.onKeyDown) {
            props.onKeyDown(e);
        }
    };

    const handleClear = () => {
        setLocalValue('');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        performSearch('');
    };

    return (
        <div className={`relative flex w-full items-center ${containerClassName || ''}`}>
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                {...props}
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={`w-full pl-9 ${showClearIcon && localValue ? 'pr-9' : ''} ${className || ''}`}
            />
            {showClearIcon && localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-xs transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
