import { Separator } from '@/components/ui/separator';

interface Props {
    risks: Array<{
        coverage_amount: string | number;
        premium: string | number;
    }>;
    commissionRate?: string | number;
    fees?: string | number;
    taxRate?: string | number;
    currency?: string;
}

function formatCurrency(amount: number, currency = 'NGN'): string {
    return `${currency} ${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FinancialSummary({ risks, commissionRate = 0, fees = 0, taxRate = 0, currency = 'NGN' }: Props) {
    const parseVal = (val: string | number | undefined | null): number => {
        if (val === undefined || val === null) {
            return 0;
        }
        if (typeof val === 'number') {
            return val;
        }
        return parseFloat(val) || 0;
    };

    const totalCoverage = risks.reduce((sum, r) => sum + parseVal(r.coverage_amount), 0);
    const grossPremium = risks.reduce((sum, r) => sum + parseVal(r.premium), 0);
    const parsedCommissionRate = parseVal(commissionRate);
    const commissionAmount = (grossPremium * parsedCommissionRate) / 100;
    const parsedTaxRate = parseVal(taxRate);
    const taxAmount = (grossPremium * parsedTaxRate) / 100;
    const parsedFees = parseVal(fees);
    const netPremium = grossPremium - commissionAmount - taxAmount - parsedFees;

    if (risks.length === 0) {
        return <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">No risks added yet.</div>;
    }

    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-semibold">Financial Summary</h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        Total Sum Insured / Coverage Amount ({risks.length} risk{risks.length > 1 ? 's' : ''})
                    </span>
                    <span className="font-medium">{formatCurrency(totalCoverage, currency)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Premium</span>
                    <span className="font-medium">{formatCurrency(grossPremium, currency)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Rate({parsedCommissionRate.toFixed(2)}%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(commissionAmount, currency)}</span>
                </div>
                {/* <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Amount</span>
                    <span className="font-medium text-red-600">-{formatCurrency(commissionAmount, currency)}</span>
                </div> */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Rate({parsedTaxRate.toFixed(2)}%)</span>
                    {/* <span className="font-medium">{parsedTaxRate.toFixed(2)}%</span> */}
                    <span className="font-medium text-red-600">-{formatCurrency(taxAmount, currency)}</span>
                </div>
                {/* <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax Amount</span>
                        <span className="font-medium text-red-600">-{formatCurrency(taxAmount, currency)}</span>
                    </div> */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Fee</span>
                    <span className="font-medium text-red-600">-{formatCurrency(parsedFees, currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                    <span>Net Premium</span>
                    <span className="text-green-600">{formatCurrency(netPremium, currency)}</span>
                </div>
            </div>
        </div>
    );
}
