import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface CommissionChartItem {
    label: string;
    value: number;
    premium?: number;
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

const COLORS = ['#8884d8', '#82ca9d', '#eab308', '#3b82f6', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

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

const groupByLabels: Record<string, string> = {
    date: 'By Date',
    policy_class: 'By Policy Class',
    policy_product: 'By Policy Product',
};

export function CommissionChart({ data, groupBy, from, to }: Props) {
    const sanitizedData = useMemo(() => {
        const raw = data?.data ?? [];
        const cleaned = raw.map((item) => ({
            ...item,
            label: String(item.label ?? ''),
            value: isNaN(Number(item.value)) ? 0 : Number(item.value),
            premium: isNaN(Number(item.premium)) ? 0 : Number(item.premium),
        }));

        if (groupBy === 'date') {
            return [...cleaned].sort((a, b) => a.label.localeCompare(b.label));
        }

        return cleaned;
    }, [data, groupBy]);

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
        groupBy === 'date' ? 'Monthly commission & premium trends' : `Commission & premium by ${groupBy === 'policy_class' ? 'policy class' : 'policy product'}`;

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Commission & Premium Chart</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {sanitizedData.map((item, index) => (
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
                {sanitizedData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={sanitizedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" className="opacity-40" />
                            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} width={70} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    padding: '8px 12px',
                                }}
                                itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                                labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                                formatter={(val: any, name: any) => [formatCurrency(val), name]}
                                labelFormatter={(label: string) => label}
                            />
                            <Legend />
                            <Area
                                type="natural"
                                dataKey="premium"
                                name="Premium"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPremium)"
                                connectNulls
                                isAnimationActive={true}
                                animationBegin={200}
                                animationDuration={1200}
                                animationEasing="ease-out"
                                dot={false}
                                activeDot={{ r: 5 }}
                            />
                            <Area
                                type="natural"
                                dataKey="value"
                                name="Commission"
                                stroke="#8884d8"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCommission)"
                                connectNulls
                                isAnimationActive={true}
                                animationBegin={200}
                                animationDuration={1200}
                                animationEasing="ease-out"
                                dot={false}
                                activeDot={{ r: 5 }}
                            />
                        </AreaChart>
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
