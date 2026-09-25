import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText, ShieldAlert, ShieldCheck, User as UserIcon } from 'lucide-react';

interface EntityDrawerProps {
    customer?: { id: number; first_name: string; last_name: string; email: string; phone?: string } | null;
    policy?: { id: number; policy_number: string; status: string } | null;
    claim?: { id: number; claim_number: string; status: string } | null;
    quote?: { id: number; quote_number: string; status: string } | null;
    invoice?: { id: number; invoice_number: string; status: string } | null;
}

export function EntityDrawer({ customer, policy, claim, quote, invoice }: EntityDrawerProps) {
    const hasAnyEntity = customer || policy || claim || quote || invoice;

    if (!hasAnyEntity) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <FileText className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-xs font-medium">Unlinked Email</p>
                <p className="mt-1 text-[11px]">No matching InsurePal customer, policy, or claim found for this conversation.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked InsurePal Records</h3>

            {/* Customer Details */}
            {customer && (
                <Card className="shadow-none border-blue-200/60 bg-blue-50/20 dark:bg-blue-950/10">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                                <UserIcon className="h-3.5 w-3.5" /> Customer Profile
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <a href={`/customers/${customer.id}`} target="_blank" rel="noreferrer" title="View Customer">
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-xs space-y-1">
                        <p className="font-semibold text-foreground">{customer.first_name} {customer.last_name}</p>
                        <p className="text-muted-foreground">{customer.email}</p>
                        {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                    </CardContent>
                </Card>
            )}

            {/* Policy Details */}
            {policy && (
                <Card className="shadow-none border-emerald-200/60 bg-emerald-50/20 dark:bg-emerald-950/10">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" /> Policy Record
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <a href={`/policies/issued`} target="_blank" rel="noreferrer" title="View Policy">
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-medium">{policy.policy_number}</span>
                            <Badge variant="outline" className="text-[10px] capitalize border-emerald-300 bg-emerald-50 text-emerald-700">{policy.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Claim Details */}
            {claim && (
                <Card className="shadow-none border-amber-200/60 bg-amber-50/20 dark:bg-amber-950/10">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                <ShieldAlert className="h-3.5 w-3.5" /> Claim File
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <a href={`/claims`} target="_blank" rel="noreferrer" title="View Claim">
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-medium">{claim.claim_number}</span>
                            <Badge variant="outline" className="text-[10px] capitalize border-amber-300 bg-amber-50 text-amber-700">{claim.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
