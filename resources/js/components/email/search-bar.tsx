import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchBar({ onSearch, placeholder }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder ?? 'Search emails...'} className="pr-8 pl-9" />
            {query && (
                <button type="button" onClick={handleClear} className="absolute top-1/2 right-3 -translate-y-1/2">
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
        </form>
    );
}
