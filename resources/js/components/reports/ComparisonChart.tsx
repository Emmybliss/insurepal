import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface ComparisonChartProps {
    title: string;
    description?: string;
    data: Array<{
        name: string;
        [key: string]: any;
    }>;
    dataKeys: Array<{
        key: string;
        label: string;
        color?: string;
    }>;
    height?: number;
    className?: string;
}

const chartConfig = {
    value: {
        label: 'Value',
    },
};

export function ComparisonChart({ title, description, data, dataKeys, height = 300, className }: ComparisonChartProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => value.toLocaleString()} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {dataKeys.map((dataKey, index) => (
                            <Bar
                                key={dataKey.key}
                                dataKey={dataKey.key}
                                fill={dataKey.color || `hsl(var(--chart-${(index % 5) + 1}))`}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
