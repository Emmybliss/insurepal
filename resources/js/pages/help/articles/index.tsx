import ArticleCard from '@/components/kb/ArticleCard';
import CategoryGrid from '@/components/kb/CategoryGrid';
import SearchBar from '@/components/kb/SearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, User } from 'lucide-react';
import { useState, useCallback } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon?: string;
    articles_count: number;
    is_active: boolean;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: Category;
    author: User;
    status: 'draft' | 'published' | 'archived';
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    is_public: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

interface KnowledgeBaseIndexProps {
    articles: Article[];
    categories: Category[];
    popularArticles: Article[];
    recentArticles: Article[];
    featuredArticles: Article[];
    searchQuery?: string;
    categoryFilter?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    canManageArticles: boolean;
}

export default function KnowledgeBaseIndex({
    articles,
    categories,
    popularArticles,
    recentArticles,
    featuredArticles,
    searchQuery = '',
    categoryFilter = '',
    sortBy = 'published_at',
    sortOrder = 'desc',
    canManageArticles,
}: KnowledgeBaseIndexProps) {
    const [searchTerm, setSearchTerm] = useState(searchQuery);
    const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
    const [sortByValue, setSortByValue] = useState(sortBy);
    const [sortOrderValue, setSortOrderValue] = useState(sortOrder);
    const [viewMode, setViewMode] = useState<'default' | 'compact'>('default');
    const [searchResults, setSearchResults] = useState<Array<{
        id: number;
        title: string;
        excerpt: string;
        category: { name: string; slug: string };
        type: 'article' | 'category';
    }>>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback((query: string, filters?: { category?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const results = articles
            .filter((article) => {
                const matchesSearch =
                    article.title.toLowerCase().includes(query.toLowerCase()) ||
                    article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
                    article.content.toLowerCase().includes(query.toLowerCase());
                const matchesCategory = !filters?.category || article.category.slug === filters.category;
                return matchesSearch && matchesCategory;
            })
            .map((article) => ({
                id: article.id,
                title: article.title,
                excerpt: article.excerpt,
                category: { name: article.category.name, slug: article.category.slug },
                type: 'article' as const,
            }));
        setSearchResults(results);
        setIsSearching(false);
    }, [articles]);

    const handleClear = useCallback(() => {
        setSearchTerm('');
        setSelectedCategory('');
        setSortByValue(sortBy);
        setSortOrderValue(sortOrder);
        setSearchResults([]);
    }, [sortBy, sortOrder]);

    const filteredArticles = articles.filter((article) => {
        const matchesSearch =
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || article.category.slug === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const sortedArticles = [...filteredArticles].sort((a, b) => {
        let aValue, bValue;

        switch (sortByValue) {
            case 'title':
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
                break;
            case 'view_count':
                aValue = a.view_count;
                bValue = b.view_count;
                break;
            case 'helpful_count':
                aValue = a.helpful_count;
                bValue = b.helpful_count;
                break;
            case 'published_at':
            default:
                aValue = new Date(a.published_at || a.created_at).getTime();
                bValue = new Date(b.published_at || b.created_at).getTime();
                break;
        }

        if (sortOrderValue === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <AppLayout>
            <Head title="Knowledge Base" />

            <div className="min-h-screen">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold">Knowledge Base</h1>
                                <p className="mt-2">Find answers to common questions and learn how to use our platform</p>
                            </div>

                            {canManageArticles && (
                                <Link href={route('admin.kb.articles.create')}>
                                    <Button>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Create Article
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-8">
                        <SearchBar
                            onSearch={handleSearch}
                            onClear={handleClear}
                            results={searchResults}
                            loading={isSearching}
                            showFilters={true}
                            showSuggestions={true}
                        />
                    </div>

                    {/* Featured Articles */}
                    {featuredArticles.length > 0 && !searchTerm && !selectedCategory && (
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold ">Featured Articles</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {featuredArticles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        variant="featured"
                                        showAuthor={false}
                                        showCategory={true}
                                        showStats={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    {!searchTerm && !selectedCategory && (
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">Browse by Category</h2>
                            <CategoryGrid categories={categories} variant="grid" showArticleCount={true} onCategoryClick={(cat) => setSelectedCategory(cat.slug)} />
                        </div>
                    )}

                    {/* Popular Articles */}
                    {popularArticles.length > 0 && !searchTerm && !selectedCategory && (
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">Popular Articles</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {popularArticles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        variant="compact"
                                        showAuthor={false}
                                        showCategory={true}
                                        showStats={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Articles */}
                    {recentArticles.length > 0 && !searchTerm && !selectedCategory && (
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Articles</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {recentArticles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        variant="compact"
                                        showAuthor={true}
                                        showCategory={true}
                                        showStats={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {(searchTerm || selectedCategory) && (
                        <div className="mb-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {searchTerm ? `Search Results for "${searchTerm}"` : 'Category Articles'}
                                </h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">{sortedArticles.length} articles found</span>
                                </div>
                            </div>

                            {sortedArticles.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">No articles found</h3>
                                        <p className="mb-4 text-gray-500">
                                            {searchTerm
                                                ? 'Try adjusting your search terms or browse by category.'
                                                : 'No articles in this category yet.'}
                                        </p>
                                        {searchTerm && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSelectedCategory('');
                                                }}
                                            >
                                                Clear Search
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {sortedArticles.map((article) => (
                                        <ArticleCard
                                            key={article.id}
                                            article={article}
                                            variant={viewMode}
                                            showAuthor={true}
                                            showCategory={true}
                                            showStats={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Articles (when no search/category) */}
                    {!searchTerm && !selectedCategory && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">All Articles</h2>
                                <div className="flex items-center space-x-2">
                                    <Button variant={viewMode === 'default' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('default')}>
                                        Grid
                                    </Button>
                                    <Button variant={viewMode === 'compact' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('compact')}>
                                        List
                                    </Button>
                                </div>
                            </div>

                            <div className={cn('grid gap-6', viewMode === 'default' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                                {articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        variant={viewMode}
                                        showAuthor={true}
                                        showCategory={true}
                                        showStats={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
