import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface PremiumTrendData {
    month: string;
    [key: string]: string | number;
}

export interface PremiumChartProps {
    data: {
        data: PremiumTrendData[];
        categories: {
            name: string;
            key: string;
        }[];
    };
}

const COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#eab308', // Yellow
    '#3b82f6', // Blue
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
];

const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'number' ? value : Number(value ?? 0);
    if (isNaN(num)) return '₦0';
    if (num >= 1000000) {
        return `₦${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `₦${(num / 1000).toFixed(1)}k`;
    }
    return `₦${num.toFixed(0)}`;
};

export function PremiumChart({ data }: PremiumChartProps) {
    const premiumData = data?.data ?? [];
    const categories = data?.categories ?? [];

    if (premiumData.length === 0 || categories.length === 0) {
        return (
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Premium Trends</CardTitle>
                    <CardDescription>Monthly premium collection by policy type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">No trend data available</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Premium Trends</CardTitle>
                        <CardDescription>Monthly premium collection by policy type</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category, index) => (
                            <Badge
                                key={category.key}
                                variant="outline"
                                style={{
                                    borderColor: COLORS[index % COLORS.length],
                                    color: COLORS[index % COLORS.length],
                                }}
                            >
                                {category.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={premiumData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {categories.map((category, index) => {
                                const color = COLORS[index % COLORS.length];
                                return (
                                    <linearGradient key={`premiumGrad-${category.key}`} id={`premiumGrad-${category.key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.7} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} width={70} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                            formatter={(value: any) => [formatCurrency(value), '']}
                        />
                        <Legend />
                        {categories.map((category, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (
                                <Area
                                    key={category.key}
                                    type="monotone"
                                    dataKey={category.key}
                                    stroke={color}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill={`url(#premiumGrad-${category.key})`}
                                    name={category.name}
                                    isAnimationActive={true}
                                    animationBegin={200 + index * 150}
                                    animationDuration={1300}
                                    dot={{ r: 4, stroke: color, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                                    activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
