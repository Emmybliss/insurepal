import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Calendar, CheckCircle, Clock, CreditCard, Download, XCircle } from 'lucide-react';

interface Payment {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    metadata?: any;
    gateway_response?: string;
    paid_at?: string;
    created_at: string;
    formatted_amount: string;
}

interface Props {
    payments: {
        data: Payment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function PaymentHistory({ payments }: Props) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'subscription':
                return 'bg-blue-100 text-blue-800';
            case 'renewal':
                return 'bg-purple-100 text-purple-800';
            case 'one_time':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout
        // header={
        //     <div className="flex justify-between items-center">
        //         <h2 className="font-semibold text-xl text-gray-800 leading-tight">
        //             Payment History
        //         </h2>
        //         <Button variant="outline">
        //             <Download className="h-4 w-4 mr-2" />
        //             Export
        //         </Button>
        //     </div>
        // }
        >
            <Head title="Payment History" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Summary Cards */}
                            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{payments.total}</div>
                                        <p className="text-xs text-muted-foreground">All time</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Successful</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">
                                            {payments.data.filter((p) => p.status === 'completed').length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Completed payments</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {payments.data.filter((p) => p.status === 'pending').length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Awaiting payment</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">
                                            {payments.data.filter((p) => p.status === 'failed').length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Failed payments</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Payment Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Payments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {payments.data.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="px-4 py-3 text-left">Reference</th>
                                                        <th className="px-4 py-3 text-left">Type</th>
                                                        <th className="px-4 py-3 text-left">Amount</th>
                                                        <th className="px-4 py-3 text-left">Status</th>
                                                        <th className="px-4 py-3 text-left">Date</th>
                                                        <th className="px-4 py-3 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.data.map((payment) => (
                                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <div className="font-mono text-sm">{payment.reference}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Badge variant="outline" className={getTypeColor(payment.type)}>
                                                                    {payment.type}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold">{payment.formatted_amount}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center space-x-2">
                                                                    {getStatusIcon(payment.status)}
                                                                    <Badge variant="outline" className={getStatusColor(payment.status)}>
                                                                        {payment.status}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm text-gray-600">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>{formatDate(payment.paid_at || payment.created_at)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Button variant="ghost" size="sm" disabled={payment.status !== 'completed'}>
                                                                    <Download className="mr-1 h-3 w-3" />
                                                                    Receipt
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                            <h3 className="mb-2 text-lg font-semibold text-gray-600">No payments found</h3>
                                            <p className="text-gray-500">Your payment history will appear here once you make payments.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pagination */}
                            {payments.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {(payments.current_page - 1) * payments.per_page + 1} to{' '}
                                        {Math.min(payments.current_page * payments.per_page, payments.total)} of {payments.total} results
                                    </div>
                                    <div className="flex space-x-2">
                                        {payments.current_page > 1 && (
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        )}
                                        {payments.current_page < payments.last_page && (
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
