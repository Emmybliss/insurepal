import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Filter, Search, SortAsc, SortDesc, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SearchResult {
    id: number;
    title: string;
    excerpt: string;
    category: {
        name: string;
        slug: string;
    };
    type: 'article' | 'category';
    relevance_score?: number;
}

interface SearchBarProps {
    onSearch: (query: string, filters?: SearchFilters) => void;
    onClear: () => void;
    results?: SearchResult[];
    loading?: boolean;
    placeholder?: string;
    showFilters?: boolean;
    showSuggestions?: boolean;
    className?: string;
}

interface SearchFilters {
    category?: string;
    sortBy?: 'relevance' | 'date' | 'views' | 'helpfulness';
    sortOrder?: 'asc' | 'desc';
    dateRange?: 'all' | 'week' | 'month' | 'year';
}

export default function SearchBar({
    onSearch,
    onClear,
    results = [],
    loading = false,
    placeholder = 'Search articles...',
    showFilters = true,
    showSuggestions = true,
    className = '',
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        sortBy: 'relevance',
        sortOrder: 'desc',
        dateRange: 'all',
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim()) {
                onSearch(query.trim(), filters);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, filters, onSearch]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (resultsRef.current && !resultsRef.current.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(value.length > 0);
    };

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        onClear();
        inputRef.current?.focus();
    };

    const handleResultClick = (result: SearchResult) => {
        // Navigate to result
        console.log('Navigate to:', result);
        setIsOpen(false);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const getSortIcon = () => {
        return filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
    };

    const formatRelevanceScore = (score?: number) => {
        if (!score) return '';
        return `${Math.round(score * 100)}% match`;
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="pr-20 pl-10"
                    onFocus={() => setIsOpen(query.length > 0)}
                />
                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 transform items-center space-x-1">
                    {query && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClear}>
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                    {showFilters && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowFilterPanel(!showFilterPanel)}>
                            <Filter className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
                <Card className="absolute top-full right-0 left-0 z-50 mt-1">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Sort by</label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="w-full rounded-md border p-2 text-sm"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="date">Date</option>
                                    <option value="views">Views</option>
                                    <option value="helpfulness">Helpfulness</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Order</label>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFilterChange('sortOrder', 'asc')}
                                        className={filters.sortOrder === 'asc' ? 'bg-primary text-primary-foreground' : ''}
                                    >
                                        <SortAsc className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFilterChange('sortOrder', 'desc')}
                                        className={filters.sortOrder === 'desc' ? 'bg-primary text-primary-foreground' : ''}
                                    >
                                        <SortDesc className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Date range</label>
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    className="w-full rounded-md border p-2 text-sm"
                                >
                                    <option value="all">All time</option>
                                    <option value="week">Past week</option>
                                    <option value="month">Past month</option>
                                    <option value="year">Past year</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Results */}
            {isOpen && (
                <Card ref={resultsRef} className="absolute top-full right-0 left-0 z-40 mt-1 max-h-96 overflow-y-auto">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-4 text-center">
                                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                                <p className="text-sm text-gray-500">Searching...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y">
                                {results.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className="cursor-pointer p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {result.type === 'article' ? (
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">{result.title}</h4>
                                                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{result.excerpt}</p>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.category.name}
                                                    </Badge>
                                                    {result.relevance_score && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatRelevanceScore(result.relevance_score)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : query.length > 0 ? (
                            <div className="p-4 text-center">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Search className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500">No results found for "{query}"</p>
                                <p className="mt-1 text-xs text-gray-400">Try different keywords or check your spelling</p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
