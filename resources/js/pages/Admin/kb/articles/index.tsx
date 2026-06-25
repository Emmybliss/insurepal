import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link } from '@inertiajs/react';
import { Archive, BookOpen, Edit, Eye, Globe, Lock, MoreHorizontal, Plus, Search, Tag, ThumbsUp, Trash2, User } from 'lucide-react';
import { useState } from 'react';

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
    description?: string;
    icon?: string;
    article_count: number;
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

interface AdminArticlesIndexProps {
    articles: Article[];
    categories: Category[];
    filters: {
        status?: string;
        category?: string;
        author?: string;
        search?: string;
    };
    stats: {
        total: number;
        published: number;
        draft: number;
        archived: number;
        total_views: number;
        total_helpful: number;
    };
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
}

export default function AdminArticlesIndex({
    articles,
    categories,
    filters,
    stats,
    canCreate,
    canEdit,
}: AdminArticlesIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [authorFilter, setAuthorFilter] = useState(filters.author || '');
    const [selectedArticles, setSelectedArticles] = useState<number[]>([]);

    const filteredArticles = articles.filter((article) => {
        const matchesSearch =
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || article.status === statusFilter;
        const matchesCategory = !categoryFilter || article.category.slug === categoryFilter;
        const matchesAuthor = !authorFilter || article.author.id.toString() === authorFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesAuthor;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'published':
                return <Globe className="h-4 w-4" />;
            case 'draft':
                return <Edit className="h-4 w-4" />;
            case 'archived':
                return <Archive className="h-4 w-4" />;
            default:
                return <Edit className="h-4 w-4" />;
        }
    };

    const getHelpfulnessPercentage = (article: Article) => {
        const total = article.helpful_count + article.not_helpful_count;
        return total > 0 ? Math.round((article.helpful_count / total) * 100) : 0;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleBulkAction = (action: string) => {
        if (selectedArticles.length === 0) return;

        // TODO: Implement bulk actions
        console.log('Bulk action:', action, 'on articles:', selectedArticles);
    };

    return (
        <>
            <Head title="Manage Articles - Knowledge Base" />

            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Manage Articles</h1>
                                <p className="mt-2 text-gray-600">Create, edit, and manage knowledge base articles</p>
                            </div>

                            {canCreate && (
                                <Link href={route('admin.kb.articles.create')}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Article
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-5">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <BookOpen className="h-8 w-8 text-blue-500" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Globe className="h-8 w-8 text-green-500" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Published</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Edit className="h-8 w-8 text-yellow-500" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Drafts</p>
                                        <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Eye className="h-8 w-8 text-blue-500" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Views</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.total_views.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <ThumbsUp className="h-8 w-8 text-green-500" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Helpful Votes</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.total_helpful}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <Input
                                            placeholder="Search articles..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center space-x-4">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Status</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Categories</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.slug}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('');
                                            setCategoryFilter('');
                                            setAuthorFilter('');
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Actions */}
                    {selectedArticles.length > 0 && (
                        <Card className="mb-6">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{selectedArticles.length} article(s) selected</span>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('publish')}>
                                            <Globe className="mr-2 h-4 w-4" />
                                            Publish
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archive
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Articles Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedArticles.length === filteredArticles.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedArticles(filteredArticles.map((a) => a.id));
                                                        } else {
                                                            setSelectedArticles([]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Article
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Author</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Stats</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Updated
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredArticles.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center">
                                                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                    <h3 className="mb-2 text-lg font-medium text-gray-900">No articles found</h3>
                                                    <p className="mb-4 text-gray-500">
                                                        {searchTerm || statusFilter || categoryFilter || authorFilter
                                                            ? 'Try adjusting your filters to see more results.'
                                                            : 'Get started by creating your first article.'}
                                                    </p>
                                                    {canCreate && (
                                                        <Link href={route('admin.kb.articles.create')}>
                                                            <Button>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create Article
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredArticles.map((article) => (
                                                <tr key={article.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedArticles.includes(article.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedArticles([...selectedArticles, article.id]);
                                                                } else {
                                                                    setSelectedArticles(selectedArticles.filter((id) => id !== article.id));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start space-x-3">
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="truncate text-sm font-medium text-gray-900">{article.title}</h3>
                                                                <p className="mt-1 truncate text-sm text-gray-500">{article.excerpt}</p>
                                                                <div className="mt-1 flex items-center space-x-2">
                                                                    {article.is_public ? (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            <Globe className="mr-1 h-3 w-3" />
                                                                            Public
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            <Lock className="mr-1 h-3 w-3" />
                                                                            Private
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Tag className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-900">{article.category.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={article.author.avatar} />
                                                                <AvatarFallback>{article.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm text-gray-900">{article.author.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={getStatusColor(article.status)}>
                                                            <div className="flex items-center space-x-1">
                                                                {getStatusIcon(article.status)}
                                                                <span className="capitalize">{article.status}</span>
                                                            </div>
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            <div className="flex items-center space-x-1">
                                                                <Eye className="h-3 w-3" />
                                                                <span>{article.view_count}</span>
                                                            </div>
                                                            <div className="mt-1 flex items-center space-x-1">
                                                                <ThumbsUp className="h-3 w-3" />
                                                                <span>{getHelpfulnessPercentage(article)}%</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{formatDate(article.updated_at)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Link href={route('kb.show', article.slug)}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            {canEdit && (
                                                                <Link href={route('admin.kb.articles.edit', article.id)}>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            <Button variant="ghost" size="sm" onClick={() => setShowActions(!showActions)}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
