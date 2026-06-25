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
import { useState } from 'react';

interface Form72CRow {
    month: number;
    serial_number: number;
    customer_name: string;
    policy_number: string | null;
    insurer_name: string;
    cover_start: string | null;
    cover_end: string | null;
    total_received: number;
    premium_due_to_insurers: number;
    deposit_made: number;
    returned_premium_due: number;
    claims_due_to_insured: number;
    vat_due: number;
    commission_due_co_broker: number;
    commission_due_reporting_broker: number;
    remittance_date: string | null;
    bank_name: string | null;
    premium_remitted: number;
    claim_return_deposit_remitted: number;
    vat_remitted: number;
    commission_remitted: number;
    outstanding_premium: number;
    outstanding_claim_return_deposit: number;
    outstanding_vat: number;
    outstanding_commission: number;
    over_remitted_premium: number;
    over_remitted_commission: number;
    policy_id: number;
}

interface MonthlySummary {
    month: number;
    month_name: string;
    count: number;
    total_received: number;
    premium_due: number;
    premium_remitted: number;
    total_outstanding_premium: number;
    total_outstanding_commission: number;
}

interface Props {
    lines: Form72CRow[];
    monthlySummaries: MonthlySummary[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function NaicomForm72CTable({ lines, monthlySummaries }: Props) {
    const [selectedRow, setSelectedRow] = useState<Form72CRow | null>(null);

    const totals = {
        total_received: lines.reduce((s, r) => s + r.total_received, 0),
        premium_due: lines.reduce((s, r) => s + r.premium_due_to_insurers, 0),
        deposit_made: lines.reduce((s, r) => s + r.deposit_made, 0),
        returned_premium: lines.reduce((s, r) => s + r.returned_premium_due, 0),
        claims_due: lines.reduce((s, r) => s + r.claims_due_to_insured, 0),
        vat_due: lines.reduce((s, r) => s + r.vat_due, 0),
        commission_due: lines.reduce((s, r) => s + r.commission_due_co_broker + r.commission_due_reporting_broker, 0),
        premium_remitted: lines.reduce((s, r) => s + r.premium_remitted, 0),
        claim_return_remitted: lines.reduce((s, r) => s + r.claim_return_deposit_remitted, 0),
        vat_remitted: lines.reduce((s, r) => s + r.vat_remitted, 0),
        commission_remitted: lines.reduce((s, r) => s + r.commission_remitted, 0),
        outstanding_premium: lines.reduce((s, r) => s + r.outstanding_premium, 0),
        outstanding_claim: lines.reduce((s, r) => s + r.outstanding_claim_return_deposit, 0),
        outstanding_vat: lines.reduce((s, r) => s + r.outstanding_vat, 0),
        outstanding_commission: lines.reduce((s, r) => s + r.outstanding_commission, 0),
    };

    const groupByMonth = (rows: Form72CRow[]): Record<number, Form72CRow[]> => {
        const groups: Record<number, Form72CRow[]> = {};
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
                            <TableRow className="bg-muted/30">
                                <TableHead colSpan={6} className="text-xs font-semibold text-muted-foreground">
                                    POLICY INFORMATION
                                </TableHead>
                                <TableHead colSpan={8} className="text-xs font-semibold text-muted-foreground border-l">
                                    PREMIUM RECEIVED AND AMOUNTS DUE TO STAKEHOLDERS
                                </TableHead>
                                <TableHead colSpan={4} className="text-xs font-semibold text-muted-foreground border-l">
                                    REMITTANCE TO STAKEHOLDERS
                                </TableHead>
                                <TableHead colSpan={4} className="text-xs font-semibold text-muted-foreground border-l">
                                    OUTSTANDING PAYMENT
                                </TableHead>
                            </TableRow>
                            <TableRow>
                                <TableHead className="w-12">S/N</TableHead>
                                <TableHead className="min-w-[160px]">Insured / Policy No</TableHead>
                                <TableHead className="min-w-[130px]">Insurer</TableHead>
                                <TableHead>Cover Start</TableHead>
                                <TableHead>Cover End</TableHead>
                                <TableHead className="text-right">Total Received</TableHead>
                                <TableHead className="text-right border-l">Premium Due</TableHead>
                                <TableHead className="text-right">Deposit Made</TableHead>
                                <TableHead className="text-right">Return Premium</TableHead>
                                <TableHead className="text-right">Claims Due</TableHead>
                                <TableHead className="text-right">VAT Due</TableHead>
                                <TableHead className="text-right">Comm. Co-Bkr</TableHead>
                                <TableHead className="text-right">Comm. Rep. Bkr</TableHead>
                                <TableHead className="border-l">Remit Date</TableHead>
                                <TableHead>Bank</TableHead>
                                <TableHead className="text-right border-l">Prem. Remitted</TableHead>
                                <TableHead className="text-right">Claim/Dep. Rem.</TableHead>
                                <TableHead className="text-right">VAT Remitted</TableHead>
                                <TableHead className="text-right">Comm. Remitted</TableHead>
                                <TableHead className="text-right border-l">Out. Premium</TableHead>
                                <TableHead className="text-right">Out. Claim/Dep.</TableHead>
                                <TableHead className="text-right">Out. VAT</TableHead>
                                <TableHead className="text-right">Out. Comm.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={23} className="py-8 text-center text-muted-foreground">
                                        No data available for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupByMonth(lines)).map(([month, monthRows]) => (
                                    <TableRow key={`group-${month}`} className="bg-muted/50">
                                        <TableCell colSpan={23} className="py-2 font-semibold">
                                            {monthlySummaries.find((m) => m.month === Number(month))?.month_name ?? `Month ${month}`}
                                        </TableCell>
                                    </TableRow>,
                                    monthRows.map((row) => (
                                        <TableRow
                                            key={row.serial_number}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setSelectedRow(row)}
                                        >
                                            <TableCell className="text-muted-foreground">{row.serial_number}</TableCell>
                                            <TableCell className="font-medium">
                                                <div>{row.customer_name}</div>
                                                {row.policy_number && (
                                                    <div className="text-xs text-muted-foreground">{row.policy_number}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>{row.insurer_name}</TableCell>
                                            <TableCell className="text-sm">{row.cover_start ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{row.cover_end ?? '—'}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.total_received)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm border-l">{formatCurrency(row.premium_due_to_insurers)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.deposit_made)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.returned_premium_due)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.claims_due_to_insured)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.vat_due)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.commission_due_co_broker)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.commission_due_reporting_broker)}</TableCell>
                                            <TableCell className="text-sm whitespace-nowrap border-l">{row.remittance_date ?? '—'}</TableCell>
                                            <TableCell className="text-sm max-w-[100px] truncate">{row.bank_name ?? '—'}</TableCell>
                                            <TableCell className="text-right font-mono text-sm border-l">{formatCurrency(row.premium_remitted)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.claim_return_deposit_remitted)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.vat_remitted)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.commission_remitted)}</TableCell>
                                            <TableCell className={`text-right font-mono text-sm border-l ${row.outstanding_premium > 0 ? 'text-amber-600 font-semibold' : ''}`}>{formatCurrency(row.outstanding_premium)}</TableCell>
                                            <TableCell className={`text-right font-mono text-sm ${row.outstanding_claim_return_deposit > 0 ? 'text-amber-600 font-semibold' : ''}`}>{formatCurrency(row.outstanding_claim_return_deposit)}</TableCell>
                                            <TableCell className={`text-right font-mono text-sm ${row.outstanding_vat > 0 ? 'text-amber-600 font-semibold' : ''}`}>{formatCurrency(row.outstanding_vat)}</TableCell>
                                            <TableCell className={`text-right font-mono text-sm ${row.outstanding_commission > 0 ? 'text-amber-600 font-semibold' : ''}`}>{formatCurrency(row.outstanding_commission)}</TableCell>
                                        </TableRow>
                                    ))
                                )
                            )
                            )}
                            {lines.length > 0 && (
                                <TableRow className="bg-muted font-semibold">
                                    <TableCell colSpan={5} className="text-right">Totals</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.total_received)}</TableCell>
                                    <TableCell className="text-right font-mono border-l">{formatCurrency(totals.premium_due)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.deposit_made)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.returned_premium)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.claims_due)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.vat_due)}</TableCell>
                                    <TableCell className="text-right font-mono" colSpan={2}></TableCell>
                                    <TableCell className="border-l text-center text-xs" colSpan={2}></TableCell>
                                    <TableCell className="text-right font-mono border-l">{formatCurrency(totals.premium_remitted)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.claim_return_remitted)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.vat_remitted)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.commission_remitted)}</TableCell>
                                    <TableCell className="text-right font-mono border-l">{formatCurrency(totals.outstanding_premium)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.outstanding_claim)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.outstanding_vat)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(totals.outstanding_commission)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!selectedRow} onOpenChange={(o) => { if (!o) setSelectedRow(null); }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedRow?.customer_name}</DialogTitle>
                        <DialogDescription>
                            Policy: {selectedRow?.policy_number ?? `#${selectedRow?.policy_id}`} · {selectedRow?.insurer_name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRow && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="col-span-3 border-b pb-2">
                                <p className="font-semibold text-muted-foreground">Cover Period</p>
                                <p>{selectedRow.cover_start ?? '—'} → {selectedRow.cover_end ?? '—'}</p>
                            </div>

                            <div className="col-span-3 border-b pb-2">
                                <p className="font-semibold text-muted-foreground mb-1">Premium Received & Amounts Due</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Received</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.total_received)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Premium Due to Insurers</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.premium_due_to_insurers)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Deposit Made</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.deposit_made)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Returned Premium Due</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.returned_premium_due)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Claims Due to Insured</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.claims_due_to_insured)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">VAT Due</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.vat_due)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Commission Due (Co-Bkr)</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.commission_due_co_broker)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Commission Due (Rep. Bkr)</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.commission_due_reporting_broker)}</p>
                            </div>

                            <div className="col-span-3 border-b pb-2">
                                <p className="font-semibold text-muted-foreground mb-1">Remittance to Stakeholders</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Remittance Date</p>
                                <p className="font-medium">{selectedRow.remittance_date ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Bank</p>
                                <p className="font-medium">{selectedRow.bank_name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Premium Remitted</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.premium_remitted)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Claim/Deposit Remitted</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.claim_return_deposit_remitted)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">VAT Remitted</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.vat_remitted)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Commission Remitted</p>
                                <p className="font-medium font-mono">{formatCurrency(selectedRow.commission_remitted)}</p>
                            </div>

                            <div className="col-span-3 border-b pb-2">
                                <p className="font-semibold text-muted-foreground mb-1">Outstanding Payments</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Outstanding Premium</p>
                                <p className={`font-medium font-mono ${selectedRow.outstanding_premium > 0 ? 'text-amber-600' : ''}`}>{formatCurrency(selectedRow.outstanding_premium)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Outstanding Claim/Dep.</p>
                                <p className={`font-medium font-mono ${selectedRow.outstanding_claim_return_deposit > 0 ? 'text-amber-600' : ''}`}>{formatCurrency(selectedRow.outstanding_claim_return_deposit)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Outstanding VAT</p>
                                <p className={`font-medium font-mono ${selectedRow.outstanding_vat > 0 ? 'text-amber-600' : ''}`}>{formatCurrency(selectedRow.outstanding_vat)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Outstanding Commission</p>
                                <p className={`font-medium font-mono ${selectedRow.outstanding_commission > 0 ? 'text-amber-600' : ''}`}>{formatCurrency(selectedRow.outstanding_commission)}</p>
                            </div>

                            {(selectedRow.over_remitted_premium > 0 || selectedRow.over_remitted_commission > 0) && (
                                <div className="col-span-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                    <p className="font-semibold">Over-Remittance Detected</p>
                                    {selectedRow.over_remitted_premium > 0 && (
                                        <p>Premium over-remitted: {formatCurrency(selectedRow.over_remitted_premium)}</p>
                                    )}
                                    {selectedRow.over_remitted_commission > 0 && (
                                        <p>Commission over-remitted: {formatCurrency(selectedRow.over_remitted_commission)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
