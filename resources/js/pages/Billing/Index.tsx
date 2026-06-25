import { InvoicesTable } from '@/components/tables/InvoicesTable';
import { ReceiptsTable } from '@/components/tables/ReceiptsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Invoice, Receipt } from '@/types/billing';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

interface Props {
    invoices: Invoice[];
    receipts: Receipt[];
}

export default function BillingIndex({ invoices, receipts }: Props) {
    return (
        <div className="container mx-auto py-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Billing Management</h1>
                <div className="space-x-2">
                    <Link href={route('invoices.create')}>
                        <Button>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    </Link>
                    <Link href={route('receipts.create')}>
                        <Button variant="outline">
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Record Payment
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="invoices" className="w-full">
                <TabsList>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="receipts">Receipts</TabsTrigger>
                </TabsList>
                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InvoicesTable invoices={invoices} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="receipts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Receipts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ReceiptsTable receipts={receipts} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
