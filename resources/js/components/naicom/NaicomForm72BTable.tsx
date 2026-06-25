import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface Form72BRow {
    month: number;
    serial_number: number;
    customer_name: string;
    insurer_name: string;
    cover_start: string;
    cover_end: string;
    sum_insured: number;
    premium_direct_to_insurers: number;
    premium_to_broker_local: number;
    premium_to_broker_foreign: number;
    total_gross_premium: number;
    net_premium: number;
    payment_method: string | null;
    payment_date: string | null;
    premium_received_by_broker: number;
    total_commission: number;
    co_broker_commission: number;
    reporting_broker_commission: number;
    commission_earned: number;
    commission_deferred: number;
    policy_id: number;
    policy_number: string | null;
}

interface MonthlySummary {
    month: number;
    month_name: string;
    count: number;
    total_gross_premium: number;
    total_commission: number;
    total_earned: number;
    total_deferred: number;
}

interface Props {
    lines: Form72BRow[];
    monthlySummaries: MonthlySummary[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function NaicomForm72BTable({ lines, monthlySummaries }: Props) {
    const [selectedRow, setSelectedRow] = useState<Form72BRow | null>(null);

    const totals = {
        sum_insured: lines.reduce((s, r) => s + r.sum_insured, 0),
        gross_premium: lines.reduce((s, r) => s + r.total_gross_premium, 0),
        net_premium: lines.reduce((s, r) => s + r.net_premium, 0),
        commission: lines.reduce((s, r) => s + r.total_commission, 0),
        earned: lines.reduce((s, r) => s + r.commission_earned, 0),
        deferred: lines.reduce((s, r) => s + r.commission_deferred, 0),
        premium_received: lines.reduce((s, r) => s + r.premium_received_by_broker, 0),
    };

    const groupByMonth = (rows: Form72BRow[]): Record<number, Form72BRow[]> => {
        const groups: Record<number, Form72BRow[]> = {};
        for (const row of rows) {
            if (!groups[row.month]) groups[row.month] = [];
            groups[row.month].push(row);
        }
        return groups;
    };

    return (
        <div className="space-y-6">
            {monthlySummaries.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {monthlySummaries.map((m) => (
                        <div key={m.month} className="rounded-lg border bg-card p-3 text-card-foreground">
                            <p className="text-sm font-medium text-muted-foreground">{m.month_name}</p>
                            <p className="text-2xl font-bold">{m.count}</p>
                            <p className="text-xs text-muted-foreground">policies</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">S/N</TableHead>
                                <TableHead className="min-w-[180px]">Name of Insured</TableHead>
                                <TableHead className="min-w-[140px]">Name of Insurer</TableHead>
                                <TableHead>Cover Start</TableHead>
                                <TableHead>Cover End</TableHead>
                                <TableHead className="text-right">Sum Insured</TableHead>
                                <TableHead className="text-right">Premium Direct</TableHead>
                                <TableHead className="text-right">Premium Local</TableHead>
                                <TableHead className="text-right">Premium Foreign</TableHead>
                                <TableHead className="text-right">Gross Premium</TableHead>
                                <TableHead className="text-right">Net Premium</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Payment Date</TableHead>
                                <TableHead className="text-right">Premium Received</TableHead>
                                <TableHead className="text-right">Total Commission</TableHead>
                                <TableHead className="text-right">Co-Broker Commission</TableHead>
                                <TableHead className="text-right">Rep. Broker Commission</TableHead>
                                <TableHead className="text-right">Commission Earned</TableHead>
                                <TableHead className="text-right">Commission Deferred</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={19} className="py-8 text-center text-muted-foreground">
                                        No data available for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupByMonth(lines)).map(([month, monthRows]) => (
                                    <>
                                        <TableRow key={`header-${month}`} className="bg-muted/50">
                                            <TableCell colSpan={19} className="py-2 font-semibold">
                                                {monthlySummaries.find((m) => m.month === Number(month))?.month_name ?? `Month ${month}`}
                                            </TableCell>
                                        </TableRow>
                                        {monthRows.map((row) => (
                                            <TableRow
                                                key={row.serial_number}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => setSelectedRow(row)}
                                            >
                                                <TableCell className="text-muted-foreground">{row.serial_number}</TableCell>
                                                <TableCell className="font-medium">{row.customer_name}</TableCell>
                                                <TableCell>{row.insurer_name}</TableCell>
                                                <TableCell className="text-sm">{row.cover_start}</TableCell>
                                                <TableCell className="text-sm">{row.cover_end}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.sum_insured)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.premium_direct_to_insurers)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.premium_to_broker_local)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.premium_to_broker_foreign)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(row.total_gross_premium)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.net_premium)}</TableCell>
                                                <TableCell className="text-sm capitalize">{row.payment_method?.replace('_', ' ') ?? '—'}</TableCell>
                                                <TableCell className="text-sm">{row.payment_date ?? '—'}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.premium_received_by_broker)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.total_commission)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.co_broker_commission)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{formatCurrency(row.reporting_broker_commission)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold text-green-600">{formatCurrency(row.commission_earned)}</TableCell>
                                                <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(row.commission_deferred)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                ))
                            )}
                            {lines.length > 0 && (
                                <TableRow className="bg-muted font-semibold">
                                    <TableCell colSpan={5} className="text-right">Totals</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.sum_insured)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.gross_premium - totals.premium_received)}</TableCell>
                                    <TableCell className="text-right font-mono" colSpan={2}></TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.gross_premium)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.net_premium)}</TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.premium_received)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.commission)}</TableCell>
                                    <TableCell className="text-right font-mono"></TableCell>
                                    <TableCell className="text-right font-mono"></TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.earned)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.deferred)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!selectedRow} onOpenChange={(o) => { if (!o) setSelectedRow(null); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedRow?.customer_name}</DialogTitle>
                        <DialogDescription>
                            Policy: {selectedRow?.policy_number ?? `#${selectedRow?.policy_id}`} · {selectedRow?.insurer_name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRow && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Cover Period</p>
                                <p className="font-medium">{selectedRow.cover_start} → {selectedRow.cover_end}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Sum Insured</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.sum_insured)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Gross Premium</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.total_gross_premium)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Net Premium</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.net_premium)}</p>
                            </div>
                            <div className="col-span-2 border-t pt-2">
                                <p className="text-muted-foreground">Commission Breakdown</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Commission</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.total_commission)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Co-Broker</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.co_broker_commission)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Reporting Broker</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.reporting_broker_commission)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Earned (Straight-Line)</p>
                                <p className="font-medium font-mono text-green-600">{formatCurrency(selectedRow.commission_earned)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Deferred</p>
                                <p className="font-medium font-mono text-amber-600">{formatCurrency(selectedRow.commission_deferred)}</p>
                            </div>
                            <div className="col-span-2 border-t pt-2">
                                <p className="text-muted-foreground">Receipt Details</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Payment Method</p>
                                <p className="font-medium capitalize">{selectedRow.payment_method?.replace('_', ' ') ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Payment Date</p>
                                <p className="font-medium">{selectedRow.payment_date ?? '—'}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
