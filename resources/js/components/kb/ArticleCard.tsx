import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, BookOpen, Eye, FileText, ThumbsDown, ThumbsUp } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
    color?: string;
}

interface Author {
    id: number;
    name: string;
    avatar?: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: Category;
    author: Author;
    status: 'draft' | 'published' | 'archived';
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    is_public: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

interface ArticleCardProps {
    article: Article;
    onView?: (article: Article) => void;
    onFeedback?: (articleId: number, helpful: boolean) => void;
    showAuthor?: boolean;
    showStats?: boolean;
    showCategory?: boolean;
    variant?: 'default' | 'compact' | 'featured';
    className?: string;
}

const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
};

const categoryColors = {
    'getting-started': 'bg-blue-100 text-blue-800',
    billing: 'bg-green-100 text-green-800',
    technical: 'bg-purple-100 text-purple-800',
    policies: 'bg-orange-100 text-orange-800',
    general: 'bg-gray-100 text-gray-800',
};

export default function ArticleCard({
    article,
    onView,
    onFeedback,
    showAuthor = true,
    showStats = true,
    showCategory = true,
    variant = 'default',
    className = '',
}: ArticleCardProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getCategoryColor = (categorySlug: string) => {
        return categoryColors[categorySlug as keyof typeof categoryColors] || categoryColors.general;
    };

    const formatExcerpt = (excerpt: string, maxLength: number = 120) => {
        return excerpt.length > maxLength ? `${excerpt.substring(0, maxLength)}...` : excerpt;
    };

    const handleFeedback = (helpful: boolean) => {
        if (onFeedback) {
            onFeedback(article.id, helpful);
        }
    };

    const getHelpfulnessPercentage = () => {
        const total = article.helpful_count + article.not_helpful_count;
        if (total === 0) return 0;
        return Math.round((article.helpful_count / total) * 100);
    };

    if (variant === 'compact') {
        return (
<Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${className}`} onClick={() => onView?.(article)}>
                <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">{article.title}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{formatExcerpt(article.excerpt, 80)}</p>
                            {showStats && (
                                <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Eye className="h-3 w-3" />
                                        <span>{article.view_count}</span>
                                    </div>
                                    {article.helpful_count + article.not_helpful_count > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <ThumbsUp className="h-3 w-3" />
                                            <span>{getHelpfulnessPercentage()}% helpful</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (variant === 'featured') {
        return (
            <Card
                className={`cursor-pointer border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-200 hover:shadow-lg ${className}`}
                onClick={() => onView?.(article)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                                <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <Badge className="border-primary/30 bg-primary/20 text-primary">Featured</Badge>
                            </div>
                        </div>
                        {showCategory && (
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(article.category.slug)}`}>
                                {article.category.name}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{formatExcerpt(article.excerpt, 150)}</p>

                    {showStats && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{article.view_count} views</span>
                                </div>
                                {article.helpful_count + article.not_helpful_count > 0 && (
                                    <div className="flex items-center space-x-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span>{getHelpfulnessPercentage()}% helpful</span>
                                    </div>
                                )}
                            </div>
                            <Button size="sm" variant="outline">
                                Read More
                                <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Default variant
    return (
        <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${className}`} onClick={() => onView?.(article)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                        <div className="flex items-center space-x-2">
                            {showCategory && (
                                <Badge variant="outline" className={`text-xs ${getCategoryColor(article.category.slug)}`}>
                                    {article.category.name}
                                </Badge>
                            )}
                            <Badge variant="outline" className={`text-xs ${statusColors[article.status]}`}>
                                {article.status}
                            </Badge>
                            {!article.is_public && (
                                <Badge variant="outline" className="text-xs">
                                    Internal
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{formatExcerpt(article.excerpt)}</p>

                {showAuthor && (
                    <div className="mb-4 flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={article.author.avatar} />
                            <AvatarFallback className="text-xs">{getInitials(article.author.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-gray-900 dark:text-white">{article.author.name}</div>
                            <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(article.updated_at), {
                                    addSuffix: true,
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {showStats && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{article.view_count}</span>
                            </div>
                            {article.helpful_count + article.not_helpful_count > 0 && (
                                <div className="flex items-center space-x-1">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{getHelpfulnessPercentage()}% helpful</span>
                                </div>
                            )}
                        </div>

                        {onFeedback && article.status === 'published' && (
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFeedback(true);
                                    }}
                                >
                                    <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFeedback(false);
                                    }}
                                >
                                    <ThumbsDown className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
