import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, Globe, Info, Lock, Paperclip, Save, Tag, User } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface ArticleFormProps {
    article?: {
        id: number;
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        category_id: number;
        status: 'draft' | 'published' | 'archived';
        is_public: boolean;
        meta_description?: string;
        published_at?: string;
    };
    categories: Category[];
    authors: User[];
    isEdit: boolean;
    canPublish: boolean;
    canManage: boolean;
}

export default function ArticleForm({ article, categories, isEdit, canPublish }: ArticleFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    const { data, setData, errors, post, put, processing } = useForm({
        title: article?.title || '',
        slug: article?.slug || '',
        excerpt: article?.excerpt || '',
        content: article?.content || '',
        category_id: article?.category_id || '',
        status: article?.status || 'draft',
        is_public: article?.is_public ?? true,
        meta_description: article?.meta_description || '',
        attachments: [] as File[],
    });

    // Auto-generate slug from title
    useEffect(() => {
        if (!isEdit && data.title) {
            const slug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setData('slug', slug);
        }
    }, [data.title, isEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submitData = {
            ...data,
            attachments: attachments,
        };

        if (isEdit && article) {
            put(route('admin.kb.articles.update', article.id), {
                data: submitData,
                onSuccess: () => {
                    // Redirect will be handled by Inertia
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } else {
            post(route('admin.kb.articles.store'), {
                data: submitData,
                onSuccess: () => {
                    // Redirect will be handled by Inertia
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
        setData('attachments', [...data.attachments, ...files]);
    };

    const removeAttachment = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index);
        setAttachments(newAttachments);
        setData('attachments', newAttachments);
    };

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

    const getCategoryIcon = (categorySlug: string) => {
        const category = categories.find((c) => c.slug === categorySlug);
        return category?.icon || '📄';
    };

    return (
        <>
            <Head title={isEdit ? `Edit Article - ${article?.title}` : 'Create Article'} />

            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center space-x-4">
                            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Article' : 'Create Article'}</h1>
                                <p className="mt-2 text-gray-600">
                                    {isEdit ? 'Update your knowledge base article' : 'Create a new knowledge base article'}
                                </p>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {showPreview ? 'Edit' : 'Preview'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                            {/* Main Form */}
                            <div className="space-y-6 lg:col-span-3">
                                {/* Basic Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Info className="h-5 w-5" />
                                            <span>Article Information</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="title">Title *</Label>
                                            <Input
                                                id="title"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                placeholder="Enter article title"
                                                className={cn(errors.title && 'border-red-500')}
                                            />
                                            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="slug">Slug *</Label>
                                            <Input
                                                id="slug"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                placeholder="article-slug"
                                                className={cn(errors.slug && 'border-red-500')}
                                            />
                                            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                                            <p className="mt-1 text-sm text-gray-500">URL: /help/articles/{data.slug}</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="excerpt">Excerpt</Label>
                                            <Textarea
                                                id="excerpt"
                                                value={data.excerpt}
                                                onChange={(e) => setData('excerpt', e.target.value)}
                                                placeholder="Brief description of the article..."
                                                rows={3}
                                                className={cn(errors.excerpt && 'border-red-500')}
                                            />
                                            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="content">Content *</Label>
                                            <Textarea
                                                id="content"
                                                value={data.content}
                                                onChange={(e) => setData('content', e.target.value)}
                                                placeholder="Write your article content here..."
                                                rows={12}
                                                className={cn(errors.content && 'border-red-500')}
                                            />
                                            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="meta_description">Meta Description</Label>
                                            <Textarea
                                                id="meta_description"
                                                value={data.meta_description}
                                                onChange={(e) => setData('meta_description', e.target.value)}
                                                placeholder="SEO meta description..."
                                                rows={2}
                                                className={cn(errors.meta_description && 'border-red-500')}
                                            />
                                            {errors.meta_description && <p className="mt-1 text-sm text-red-600">{errors.meta_description}</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Attachments */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Paperclip className="h-5 w-5" />
                                            <span>Attachments</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="attachments">Upload Files</Label>
                                                <Input id="attachments" type="file" multiple onChange={handleFileUpload} className="mt-1" />
                                                <p className="mt-1 text-sm text-gray-500">Upload images, documents, or other files</p>
                                            </div>

                                            {attachments.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Uploaded Files</Label>
                                                    {attachments.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                                            <div className="flex items-center space-x-3">
                                                                <Paperclip className="h-4 w-4 text-gray-500" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                                </div>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Publishing */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Globe className="h-5 w-5" />
                                            <span>Publishing</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                <SelectTrigger className={cn(errors.status && 'border-red-500')}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">
                                                        <div className="flex items-center space-x-2">
                                                            <Edit className="h-4 w-4" />
                                                            <span>Draft</span>
                                                        </div>
                                                    </SelectItem>
                                                    {canPublish && (
                                                        <SelectItem value="published">
                                                            <div className="flex items-center space-x-2">
                                                                <Globe className="h-4 w-4" />
                                                                <span>Published</span>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                    <SelectItem value="archived">
                                                        <div className="flex items-center space-x-2">
                                                            <Archive className="h-4 w-4" />
                                                            <span>Archived</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="is_public"
                                                checked={data.is_public}
                                                onChange={(e) => setData('is_public', e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            <Label htmlFor="is_public" className="text-sm">
                                                Make this article public
                                            </Label>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Category */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Tag className="h-5 w-5" />
                                            <span>Category</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div>
                                            <Label htmlFor="category_id">Category *</Label>
                                            <Select
                                                value={data.category_id.toString()}
                                                onValueChange={(value) => setData('category_id', parseInt(value))}
                                            >
                                                <SelectTrigger className={cn(errors.category_id && 'border-red-500')}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            <div className="flex items-center space-x-2">
                                                                <span>{getCategoryIcon(category.slug)}</span>
                                                                <span>{category.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Preview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Title</Label>
                                                <p className="text-sm text-gray-900">{data.title || 'No title'}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                                <div className="mt-1">
                                                    <Badge className={getStatusColor(data.status)}>{data.status}</Badge>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Visibility</Label>
                                                <div className="mt-1 flex items-center space-x-2">
                                                    {data.is_public ? (
                                                        <>
                                                            <Globe className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm text-green-700">Public</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="h-4 w-4 text-gray-500" />
                                                            <span className="text-sm text-gray-700">Private</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-600">Category</Label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {categories.find((c) => c.id === data.category_id)?.name || 'Not selected'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>

                            <div className="flex items-center space-x-3">
                                <Button type="submit" variant="outline" disabled={processing || isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Draft
                                </Button>

                                {canPublish && (
                                    <Button type="submit" disabled={processing || isSubmitting} className="min-w-[120px]">
                                        {processing || isSubmitting ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                {isEdit ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="mr-2 h-4 w-4" />
                                                {isEdit ? 'Update Article' : 'Publish Article'}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
