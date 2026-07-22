import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface CommissionChartItem {
    label: string;
    value: number;
}

export interface CommissionChartData {
    group_by: 'date' | 'policy_class' | 'policy_product';
    data: CommissionChartItem[];
}

interface Props {
    data: CommissionChartData;
    groupBy: string;
    from: string;
    to: string;
}

const COLORS = ['#6366f1', '#10b981', '#eab308', '#3b82f6', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `₦${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `₦${(value / 1000).toFixed(1)}k`;
    }
    return `₦${value.toFixed(0)}`;
};

const groupByLabels: Record<string, string> = {
    date: 'By Date',
    policy_class: 'By Policy Class',
    policy_product: 'By Policy Product',
};

export function CommissionChart({ data, groupBy, from, to }: Props) {
    const chartData = data?.data ?? [];

    const handleGroupByChange = (newGroupBy: string) => {
        router.get(route('dashboard'), { group_by: newGroupBy, from, to }, { preserveState: true, preserveScroll: true });
    };

    const handleDatePreset = (preset: string) => {
        const now = new Date();
        let fromDate: string;
        let toDate: string;

        switch (preset) {
            case 'today':
                fromDate = now.toISOString().split('T')[0];
                toDate = fromDate;
                break;
            case 'week': {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                fromDate = weekStart.toISOString().split('T')[0];
                toDate = now.toISOString().split('T')[0];
                break;
            }
            case 'month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                toDate = now.toISOString().split('T')[0];
                break;
            case 'year':
                fromDate = `${now.getFullYear()}-01-01`;
                toDate = now.toISOString().split('T')[0];
                break;
            default:
                return;
        }

        router.get(route('dashboard'), { group_by: groupBy, from: fromDate, to: toDate }, { preserveState: true, preserveScroll: true });
    };

    const handleCustomDate = (field: 'from' | 'to', value: string) => {
        const params: Record<string, string> = { group_by: groupBy };
        if (field === 'from') {
            params.from = value;
            params.to = to;
        } else {
            params.from = from;
            params.to = value;
        }
        router.get(route('dashboard'), params, { preserveState: true, preserveScroll: true });
    };

    const description =
        groupBy === 'date' ? 'Monthly commission trends' : `Commission by ${groupBy === 'policy_class' ? 'policy class' : 'policy product'}`;

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Commission Chart</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {chartData.map((item, index) => (
                            <Badge
                                key={item.label}
                                variant="outline"
                                style={{
                                    borderColor: COLORS[index % COLORS.length],
                                    color: COLORS[index % COLORS.length],
                                }}
                            >
                                {item.label}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs">Group By</Label>
                        <div className="flex gap-1">
                            {Object.entries(groupByLabels).map(([key, label]) => (
                                <Button
                                    key={key}
                                    variant={groupBy === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleGroupByChange(key)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Date Range</Label>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleDatePreset('today')}>
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDatePreset('week')}>
                                This Week
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDatePreset('month')}>
                                This Month
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDatePreset('year')}>
                                This Year
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs">From</Label>
                            <Input type="date" value={from} onChange={(e) => handleCustomDate('from', e.target.value)} className="h-8 w-36" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">To</Label>
                            <Input type="date" value={to} onChange={(e) => handleCustomDate('to', e.target.value)} className="h-8 w-36" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Commission']}
                                labelFormatter={(label: string) => label}
                            />
                            <Legend />
                            <Bar dataKey="value" name="Commission" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        No commission data available for the selected filters
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
