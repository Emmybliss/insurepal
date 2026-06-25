import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `₦${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `₦${(value / 1000).toFixed(1)}k`;
    }
    return `₦${value.toFixed(0)}`;
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
                    <LineChart data={premiumData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                            formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Legend />
                        {categories.map((category, index) => (
                            <Line
                                key={category.key}
                                type="monotone"
                                dataKey={category.key}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={2}
                                dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                                name={category.name}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
