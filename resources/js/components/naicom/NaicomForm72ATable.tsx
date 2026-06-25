import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Form72ARow {
    month: number;
    month_name: string;
    cash_in_hand: number;
    cheques_in_hand: number;
    bank_balance: number;
    total_assets: number;
    premium_awaiting_remittance: number;
    commission_co_broker_awaiting: number;
    commission_reporting_broker_awaiting: number;
    vat_awaiting_remittance: number;
    others: number;
    total_liabilities: number;
}

interface MonthlySummary {
    month: number;
    month_name: string;
    total_assets: number;
    total_liabilities: number;
    cash_in_hand: number;
    cheques_in_hand: number;
    bank_balance: number;
    premium_awaiting_remittance: number;
    vat_awaiting_remittance: number;
}

interface Props {
    lines: Form72ARow[];
    monthlySummaries: MonthlySummary[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function NaicomForm72ATable({ lines, monthlySummaries }: Props) {
    if (lines.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <p>No data available for this period.</p>
                </CardContent>
            </Card>
        );
    }

    const months = lines.sort((a, b) => a.month - b.month);

    const isBalanced = (row: Form72ARow) => Math.abs(row.total_assets - row.total_liabilities) < 0.01;

    const columns = [
        { key: 'cash_in_hand' as const, label: 'CASH IN HAND' },
        { key: 'cheques_in_hand' as const, label: 'CHEQUE IN HAND' },
        { key: 'bank_balance' as const, label: 'BANK BALANCE' },
    ];

    const liabilityRows = [
        { key: 'premium_awaiting_remittance' as const, label: 'PREMIUM AWAITING REMITTANCE' },
        { key: 'commission_co_broker_awaiting' as const, label: 'COMMISSION AWAITING REMITTANCE (CO-BROKERS)' },
        { key: 'commission_reporting_broker_awaiting' as const, label: 'COMMISSION AWAITING REMITTANCE (REPORTING BROKER)' },
        { key: 'vat_awaiting_remittance' as const, label: 'VAT DEDUCTED AWAITING REMITTANCE' },
        { key: 'others' as const, label: 'OTHERS (CLAIMS / RETURN PREMIUM / DEPOSITS)' },
    ];

    return (
        <div className="space-y-6">
            {monthlySummaries.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {months.map((m) => {
                        const balanced = isBalanced(m);
                        return (
                            <div key={m.month} className={`rounded-lg border p-3 ${balanced ? 'bg-card' : 'bg-amber-50 border-amber-200'}`}>
                                <p className="text-sm font-medium text-muted-foreground">{m.month_name}</p>
                                <p className="text-2xl font-bold">{formatCurrency(m.total_assets)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {balanced ? 'Balanced' : 'Imbalanced'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-64">Item</TableHead>
                                {months.map((m) => (
                                    <TableHead key={m.month} className="text-right min-w-[140px]">
                                        {m.month_name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={months.length + 1} className="py-2 font-bold text-sm">
                                    ASSETS
                                </TableCell>
                            </TableRow>
                            {columns.map((col) => (
                                <TableRow key={col.key}>
                                    <TableCell className="font-medium">{col.label}</TableCell>
                                    {months.map((m) => (
                                        <TableCell key={m.month} className="text-right font-mono text-sm">
                                            {formatCurrency(m[col.key])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted font-semibold">
                                <TableCell>TOTAL ASSETS</TableCell>
                                {months.map((m) => (
                                    <TableCell key={m.month} className="text-right font-mono">
                                        {formatCurrency(m.total_assets)}
                                    </TableCell>
                                ))}
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={months.length + 1} className="py-1" />
                            </TableRow>

                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={months.length + 1} className="py-2 font-bold text-sm">
                                    LIABILITIES
                                </TableCell>
                            </TableRow>
                            {liabilityRows.map((col) => (
                                <TableRow key={col.key}>
                                    <TableCell className="font-medium">{col.label}</TableCell>
                                    {months.map((m) => (
                                        <TableCell key={m.month} className="text-right font-mono text-sm">
                                            {formatCurrency(m[col.key])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            <TableRow className="bg-muted font-semibold">
                                <TableCell>TOTAL LIABILITIES</TableCell>
                                {months.map((m) => (
                                    <TableCell key={m.month} className="text-right font-mono">
                                        {formatCurrency(m.total_liabilities)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {months.some((m) => !isBalanced(m)) && (
                    <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Some months are imbalanced (assets ≠ liabilities)
                    </Badge>
                )}
                {months.every((m) => isBalanced(m)) && (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                        <CheckCircle className="h-3 w-3" />
                        All months balanced (assets = liabilities)
                    </Badge>
                )}
            </div>
        </div>
    );
}
