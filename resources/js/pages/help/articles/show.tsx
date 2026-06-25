import FeedbackButtons from '@/components/kb/FeedbackButtons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, ChevronRight, Edit, Eye, MessageSquare, Printer, Share2, Tag, ThumbsUp, User } from 'lucide-react';
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
    meta_description?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

interface RelatedArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    category: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        articles_count?: number;
        is_active?: boolean;
    };
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
}

interface ArticleShowProps {
    article: Article;
    relatedArticles: RelatedArticle[];
    canEdit: boolean;
    canManage: boolean;
}

export default function ArticleShow({ article, relatedArticles, canEdit, canManage }: ArticleShowProps) {
    const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');

    const getHelpfulnessPercentage = () => {
        const total = article.helpful_count + article.not_helpful_count;
        return total > 0 ? Math.round((article.helpful_count / total) * 100) : 0;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleFeedback = async (helpful: boolean) => {
        try {
            // TODO: Implement feedback submission
            console.log('Submitting feedback:', { helpful, comment: feedbackComment });
            setIsHelpful(helpful);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.excerpt,
                url: window.location.href,
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={article.title}>
                <meta name="description" content={article.meta_description || article.excerpt} />
                <meta property="og:title" content={article.title} />
                <meta property="og:description" content={article.excerpt} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={window.location.href} />
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>

                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="mb-2 flex items-center space-x-2">
                                    <Badge variant="outline" className="flex items-center space-x-1">
                                        <Tag className="h-3 w-3" />
                                        <span>{article.category.name}</span>
                                    </Badge>
                                    {!article.is_public && <Badge variant="secondary">Draft</Badge>}
                                </div>

                                <h1 className="mb-4 text-3xl font-bold text-gray-900">{article.title}</h1>

                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                    <div className="flex items-center space-x-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={article.author.avatar} />
                                            <AvatarFallback>{article.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>By {article.author.name}</span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {article.published_at
                                                ? `Published ${formatDate(article.published_at)}`
                                                : `Created ${formatDate(article.created_at)}`}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Eye className="h-4 w-4" />
                                        <span>{article.view_count} views</span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span>{getHelpfulnessPercentage()}% helpful</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>
                                {canEdit && (
                                    <Link href={route('admin.kb.articles.edit', article.id)}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Article Content */}
                            <Card className="mb-8">
                                <CardContent className="p-8">
                                    <div className="prose max-w-none">
                                        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Feedback Section */}
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5" />
                                        <span>Was this article helpful?</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FeedbackButtons
                                        article={article}
                                        onFeedback={handleFeedback}
                                        isHelpful={isHelpful}
                                        onCommentChange={setFeedbackComment}
                                        comment={feedbackComment}
                                    />
                                </CardContent>
                            </Card>

                            {/* Related Articles */}
                            {relatedArticles.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Related Articles</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {relatedArticles.map((relatedArticle) => (
                                                <Link
                                                    key={relatedArticle.id}
                                                    href={route('kb.show', relatedArticle.slug)}
                                                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="mb-1 font-medium text-gray-900">{relatedArticle.title}</h3>
                                                            <p className="mb-2 text-sm text-gray-600">{relatedArticle.excerpt}</p>
                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                <span className="flex items-center space-x-1">
                                                                    <Tag className="h-3 w-3" />
                                                                    <span>{relatedArticle.category.name}</span>
                                                                </span>
                                                                <span className="flex items-center space-x-1">
                                                                    <Eye className="h-3 w-3" />
                                                                    <span>{relatedArticle.view_count} views</span>
                                                                </span>
                                                                <span className="flex items-center space-x-1">
                                                                    <ThumbsUp className="h-3 w-3" />
                                                                    <span>
                                                                        {Math.round(
                                                                            (relatedArticle.helpful_count /
                                                                                (relatedArticle.helpful_count + relatedArticle.not_helpful_count)) *
                                                                                100,
                                                                        )}
                                                                        % helpful
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Article Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Article Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Category</Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <Tag className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-900">{article.category.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Author</Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={article.author.avatar} />
                                                <AvatarFallback>{article.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-gray-900">{article.author.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Published</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {article.published_at ? formatDate(article.published_at) : 'Not published'}
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(article.updated_at)}</p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Views</Label>
                                        <p className="mt-1 text-sm text-gray-900">{article.view_count.toLocaleString()}</p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Helpfulness</Label>
                                        <div className="mt-1">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-2 flex-1 rounded-full bg-gray-200">
                                                    <div
                                                        className="h-2 rounded-full bg-green-500"
                                                        style={{ width: `${getHelpfulnessPercentage()}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600">{getHelpfulnessPercentage()}%</span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {article.helpful_count} of {article.helpful_count + article.not_helpful_count} found this helpful
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleShare}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share Article
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full" onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Article
                                    </Button>
                                    {canEdit && (
                                        <Link href={route('admin.kb.articles.edit', article.id)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Article
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
