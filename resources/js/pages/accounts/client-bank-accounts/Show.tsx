import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil, Banknote } from 'lucide-react';

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    is_active: boolean;
    opening_balance: number;
    opening_balance_date: string | null;
    notes: string | null;
    reconciliations: {
        id: number;
        reconciliation_date: string;
        status: string;
        difference: number;
    }[];
}

interface Props {
    account: ClientBankAccount;
    currentBalance: number;
}

export default function Show({ account, currentBalance }: Props) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounts', href: route('client-bank-accounts.index') },
            { title: 'Bank Accounts', href: route('client-bank-accounts.index') },
            { title: account.account_name },
        ]}>
            <Head title={account.account_name} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('client-bank-accounts.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{account.bank_name}</h1>
                            <p className="text-sm text-muted-foreground">{account.account_name}</p>
                        </div>
                    </div>
                    <Link href={route('client-bank-accounts.edit', account.id)}>
                        <Button variant="outline">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <Banknote className="h-6 w-6 text-muted-foreground" />
                                {account.bank_name}
                            </div>
                            <p className="font-mono text-sm">{account.account_number}</p>
                            <p className="text-sm capitalize text-muted-foreground">{account.account_type} · {account.currency}</p>
                            <Badge variant={account.is_active ? 'default' : 'secondary'}>
                                {account.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(currentBalance)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Opening: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(account.opening_balance)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Reconciliations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{account.reconciliations.length}</p>
                            <p className="text-sm text-muted-foreground">Total reconciliations</p>
                        </CardContent>
                    </Card>
                </div>

                {account.reconciliations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reconciliation History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {account.reconciliations.map((rec) => (
                                            <tr key={rec.id} className="border-b last:border-0">
                                                <td className="px-4 py-3">{rec.reconciliation_date}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={rec.status === 'reconciled' ? 'default' : 'secondary'}>
                                                        {rec.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(rec.difference)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {account.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{account.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
