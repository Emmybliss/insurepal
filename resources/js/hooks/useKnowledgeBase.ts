import { useCallback, useEffect, useState } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    articles_count: number;
    icon?: string;
    color?: string;
    is_active: boolean;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: Category;
    author: {
        id: number;
        name: string;
        avatar?: string;
    };
    status: 'draft' | 'published' | 'archived';
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    is_public: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

interface SearchFilters {
    category?: string;
    sortBy?: 'relevance' | 'date' | 'views' | 'helpfulness';
    sortOrder?: 'asc' | 'desc';
    dateRange?: 'all' | 'week' | 'month' | 'year';
    status?: 'published' | 'draft' | 'archived';
    is_public?: boolean;
}

interface UseKnowledgeBaseOptions {
    initialCategory?: string;
    initialFilters?: SearchFilters;
    autoLoad?: boolean;
}

interface UseKnowledgeBaseReturn {
    articles: Article[];
    categories: Category[];
    popularArticles: Article[];
    recentArticles: Article[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    searchArticles: (query: string, filters?: SearchFilters) => Promise<Article[]>;
    getArticles: (filters?: SearchFilters) => Promise<void>;
    getCategories: () => Promise<void>;
    getPopularArticles: () => Promise<void>;
    getRecentArticles: () => Promise<void>;
    recordFeedback: (articleId: number, helpful: boolean) => Promise<void>;
    incrementViews: (articleId: number) => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

export default function useKnowledgeBase(options: UseKnowledgeBaseOptions = {}): UseKnowledgeBaseReturn {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularArticles, setPopularArticles] = useState<Article[]>([]);
    const [recentArticles, setRecentArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentFilters, setCurrentFilters] = useState<SearchFilters>(options.initialFilters || {});

    const searchArticles = useCallback(async (query: string, filters: SearchFilters = {}): Promise<Article[]> => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                q: query,
                ...filters,
            });

            const response = await fetch(`/help/articles/search?${params}`);
            const data = await response.json();

            if (response.ok) {
                return data.data;
            } else {
                setError(data.message || 'Search failed');
                return [];
            }
        } catch (err) {
            setError('Network error occurred');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getArticles = useCallback(
        async (filters: SearchFilters = {}) => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    per_page: '20',
                    ...filters,
                });

                const response = await fetch(`/help/articles?${params}`);
                const data = await response.json();

                if (response.ok) {
                    setArticles((prev) => (currentPage === 1 ? data.data : [...prev, ...data.data]));
                    setHasMore(data.current_page < data.last_page);
                    setTotalPages(data.last_page);
                    setCurrentFilters(filters);
                } else {
                    setError(data.message || 'Failed to load articles');
                }
            } catch (err) {
                setError('Network error occurred');
            } finally {
                setLoading(false);
            }
        },
        [currentPage],
    );

    const getCategories = useCallback(async () => {
        try {
            const response = await fetch('/help/categories');
            const data = await response.json();

            if (response.ok) {
                setCategories(data.data);
            } else {
                setError(data.message || 'Failed to load categories');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    }, []);

    const getPopularArticles = useCallback(async () => {
        try {
            const response = await fetch('/help/articles/popular');
            const data = await response.json();

            if (response.ok) {
                setPopularArticles(data.data);
            } else {
                setError(data.message || 'Failed to load popular articles');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    }, []);

    const getRecentArticles = useCallback(async () => {
        try {
            const response = await fetch('/help/articles/recent');
            const data = await response.json();

            if (response.ok) {
                setRecentArticles(data.data);
            } else {
                setError(data.message || 'Failed to load recent articles');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    }, []);

    const recordFeedback = useCallback(async (articleId: number, helpful: boolean) => {
        try {
            const response = await fetch(`/help/articles/${articleId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    helpful,
                }),
            });

            if (response.ok) {
                // Update local state
                setArticles((prev) =>
                    prev.map((article) =>
                        article.id === articleId
                            ? {
                                  ...article,
                                  helpful_count: helpful ? article.helpful_count + 1 : article.helpful_count,
                                  not_helpful_count: helpful ? article.not_helpful_count : article.not_helpful_count + 1,
                              }
                            : article,
                    ),
                );
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to record feedback');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    }, []);

    const incrementViews = useCallback(async (articleId: number) => {
        try {
            await fetch(`/help/articles/${articleId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Update local state
            setArticles((prev) => prev.map((article) => (article.id === articleId ? { ...article, view_count: article.view_count + 1 } : article)));
        } catch (err) {
            console.error('Failed to increment views:', err);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [loading, hasMore]);

    const refresh = useCallback(async () => {
        setCurrentPage(1);
        setArticles([]);
        await getArticles(currentFilters);
    }, [getArticles, currentFilters]);

    // Load initial data
    useEffect(() => {
        if (options.autoLoad !== false) {
            getArticles();
            getCategories();
            getPopularArticles();
            getRecentArticles();
        }
    }, [getArticles, getCategories, getPopularArticles, getRecentArticles, options.autoLoad]);

    // Load more articles when page changes
    useEffect(() => {
        if (currentPage > 1) {
            getArticles(currentFilters);
        }
    }, [currentPage, getArticles, currentFilters]);

    return {
        articles,
        categories,
        popularArticles,
        recentArticles,
        loading,
        error,
        hasMore,
        currentPage,
        totalPages,
        searchArticles,
        getArticles,
        getCategories,
        getPopularArticles,
        getRecentArticles,
        recordFeedback,
        incrementViews,
        loadMore,
        refresh,
    };
}
