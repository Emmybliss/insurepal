import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, CreditCard, FileText, Globe, HelpCircle, Settings, Shield, Users, Zap } from 'lucide-react';

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

interface CategoryGridProps {
    categories: Category[];
    onCategoryClick: (category: Category) => void;
    showArticleCount?: boolean;
    variant?: 'grid' | 'list' | 'compact';
    className?: string;
}

const defaultIcons = {
    'getting-started': BookOpen,
    billing: CreditCard,
    technical: Settings,
    policies: Shield,
    general: HelpCircle,
    'user-management': Users,
    integrations: Zap,
    public: Globe,
};

const defaultColors = {
    'getting-started': 'bg-blue-100 text-blue-800 border-blue-200',
    billing: 'bg-green-100 text-green-800 border-green-200',
    technical: 'bg-purple-100 text-purple-800 border-purple-200',
    policies: 'bg-orange-100 text-orange-800 border-orange-200',
    general: 'bg-gray-100 text-gray-800 border-gray-200',
    'user-management': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    integrations: 'bg-pink-100 text-pink-800 border-pink-200',
    public: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

export default function CategoryGrid({ categories, onCategoryClick, showArticleCount = true, variant = 'grid', className = '' }: CategoryGridProps) {
    const getIcon = (category: Category) => {
        if (category.icon) {
            // If icon is a string, try to find it in defaultIcons
            const IconComponent = defaultIcons[category.icon as keyof typeof defaultIcons];
            if (IconComponent) {
                return <IconComponent className="h-6 w-6" />;
            }
        }

        // Fallback to default icon based on slug
        const IconComponent = defaultIcons[category.slug as keyof typeof defaultIcons] || FileText;
        return <IconComponent className="h-6 w-6" />;
    };

    const getColor = (category: Category) => {
        if (category.color) {
            return category.color;
        }
        return defaultColors[category.slug as keyof typeof defaultColors] || defaultColors.general;
    };

    if (variant === 'list') {
        return (
            <div className={`space-y-2 ${className}`}>
                {categories.map((category) => (
                    <Card
                        key={category.id}
                        className="cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => onCategoryClick(category)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`rounded-lg p-2 ${getColor(category)}`}>{getIcon(category)}</div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                                </div>
                                {showArticleCount && (
                                    <Badge variant="outline" className="text-xs">
                                        {category.articles_count} articles
                                    </Badge>
                                )}
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
                {categories.map((category) => (
                    <Card
                        key={category.id}
                        className="cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => onCategoryClick(category)}
                    >
                        <CardContent className="p-3 text-center">
                            <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${getColor(category)}`}>
                                {getIcon(category)}
                            </div>
                            <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{category.name}</h3>
                            {showArticleCount && <div className="text-xs text-gray-500">{category.articles_count} articles</div>}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Default grid variant
    return (
        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
            {categories.map((category) => (
                <Card
                    key={category.id}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => onCategoryClick(category)}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className={`rounded-lg p-3 ${getColor(category)}`}>{getIcon(category)}</div>
                            {showArticleCount && (
                                <Badge variant="outline" className="text-xs">
                                    {category.articles_count} articles
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <CardTitle className="mb-2 text-lg transition-colors group-hover:text-primary">{category.name}</CardTitle>
                        <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                className="transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                                Browse Articles
                                <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                            {!category.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
