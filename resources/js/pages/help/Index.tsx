import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, HelpCircle, MessageSquare, Search, Ticket } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    excerpt: string;
    view_count: number;
    category: {
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
    description: string;
    articles_count: number;
    icon?: string;
}

interface Props {
    popularArticles: Article[];
    categories: Category[];
    recentArticles: Article[];
}

export default function HelpIndex({ popularArticles, categories, recentArticles }: Props) {
    return (
        <AppLayout>
            <Head title="Help & Support" />

            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">How can we help you?</h1>
                    <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
                        Find answers, get support, and learn how to use our platform effectively.
                    </p>

                    {/* Search Bar */}
                    <div className="mx-auto max-w-2xl">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                            <Input placeholder="Search for help articles, guides, and FAQs..." className="py-3 pr-4 pl-10 text-lg" />
                            <Button className="absolute top-1/2 right-2 -translate-y-1/2 transform">Search</Button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-12 grid gap-6 md:grid-cols-3">
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Ticket className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>Submit a Ticket</CardTitle>
                                    <CardDescription>Get personalized help from our support team</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('support-tickets.create')}>
                                <Button className="w-full">
                                    Create Support Ticket
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <MessageSquare className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle>Live Chat</CardTitle>
                                    <CardDescription>Chat with our support team in real-time</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">
                                Start Live Chat
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-purple-100 p-2">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle>Browse Articles</CardTitle>
                                    <CardDescription>Explore our knowledge base</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href={route('kb.index')}>
                                <Button className="w-full" variant="outline">
                                    View All Articles
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Popular Articles */}
                {popularArticles.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Popular Articles</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {popularArticles.map((article) => (
                                <Card key={article.id} className="transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{article.title}</CardTitle>
                                                <CardDescription className="mt-2">{article.excerpt}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{article.view_count} views</span>
                                            <Link href={route('kb.show', article.id)}>
                                                <Button variant="outline" size="sm">
                                                    Read More
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                                <Card key={category.id} className="transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <div className="rounded-lg bg-gray-100 p-2">
                                                <HelpCircle className="h-6 w-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <CardTitle>{category.name}</CardTitle>
                                                <CardDescription>{category.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{category.articles_count} articles</span>
                                            <Link href={route('kb.index', { category: category.id })}>
                                                <Button variant="outline" size="sm">
                                                    Browse
                                                    <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Articles */}
                {recentArticles.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Recent Articles</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {recentArticles.map((article) => (
                                <Card key={article.id} className="transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-base">{article.title}</CardTitle>
                                        <CardDescription className="text-sm">{article.excerpt}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href={route('kb.show', article.id)}>
                                            <Button variant="outline" size="sm" className="w-full">
                                                Read Article
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                <div className="rounded-lg bg-gray-50 p-8 dark:bg-gray-800">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">How do I create a new policy?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Navigate to the Policy Management section and click "Issue New Policy" to start the process.
                            </p>
                        </div>
                        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">How can I track my claims?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Go to the Claims section to view all your submitted claims and their current status.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">How do I contact support?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                You can submit a support ticket, start a live chat, or browse our knowledge base for answers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
