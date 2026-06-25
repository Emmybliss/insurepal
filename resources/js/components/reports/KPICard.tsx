import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
    status?: 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, status, className }: KPICardProps) {
    const statusColors = {
        success: 'text-green-600 bg-green-50 border-green-200',
        warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        error: 'text-red-600 bg-red-50 border-red-200',
        info: 'text-blue-600 bg-blue-50 border-blue-200',
    };

    const trendColors = {
        positive: 'text-green-600',
        negative: 'text-red-600',
    };

    return (
        <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    {trend && (
                        <div className="flex items-center space-x-1">
                            <Badge variant="outline" className={cn('text-xs', trend.isPositive ? trendColors.positive : trendColors.negative)}>
                                {trend.isPositive ? '+' : ''}
                                {trend.value}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">{trend.label}</span>
                        </div>
                    )}
                    {status && (
                        <Badge variant="outline" className={cn('text-xs', statusColors[status])}>
                            {status}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
