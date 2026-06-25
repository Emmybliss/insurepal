import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Customer, Policy } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle, Clock, Download, Edit, Eye, FileText, Plus, RotateCcw, Send, User, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface NoteDetailsProps {
    note: {
        id: number;
        type: 'debit';
        note_number: string;
        reference_number?: string;
        amount: number;
        tax_amount: number;
        total_amount: number;
        formatted_amount: string;
        formatted_tax_amount: string;
        formatted_total_amount: string;
        description: string;
        internal_notes?: string;
        status: string;
        payment_status: 'unpaid' | 'partially_paid' | 'paid';
        issue_date: string;
        due_date?: string;
        paid_at?: string;
        file_path?: string;
        document_template_id?: number;
        metadata?: {
            payment_reference?: string;
            [key: string]: unknown;
        };
        cancelled_at?: string;
        cancellation_reason?: string;
        is_overdue: boolean;
        days_overdue: number;
        amount_paid?: number;
        balance_due?: number;
        currency_code: string;
        exchange_rate: number;
        items?: Array<{
            description: string;
            amount: number;
            tax_amount?: number;
            total_amount: number;
        }>;
        customer: Customer;
        policy?: Policy;
        created_by: {
            name: string;
        };
        updated_by?: {
            name: string;
        };
        cancelled_by?: {
            name: string;
        };

        updated_at: string;
    };
    templates?: any[];
}

export default function ShowDebitNote({ note: noteFromProps, templates = [] }: NoteDetailsProps) {
    const [previewMode, setPreviewMode] = useState<'design' | 'preview'>('design');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const note = { ...noteFromProps, type: 'debit' as const };

    const getStatusIcon = () => {
        if (note.status === 'paid') {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (note.status === 'cancelled') {
            return <XCircle className="h-4 w-4 text-red-600" />;
        } else if (note.is_overdue) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        } else if (note.status === 'issued') {
            return <Clock className="h-4 w-4 text-yellow-600" />;
        } else {
            return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = () => {
        if (note.status === 'paid') {
            return 'bg-green-100 text-green-800';
        } else if (note.status === 'cancelled') {
            return 'bg-red-100 text-red-800';
        } else if (note.is_overdue) {
            return 'bg-red-100 text-red-800';
        } else if (note.status === 'issued') {
            return 'bg-yellow-100 text-yellow-800';
        } else {
            return 'bg-gray-100 text-gray-800';
        }
    };

    const {
        data: issueData,
        setData: setIssueData,
        post: postIssue,
        processing: issueProcessing,
    } = useForm({
        notes: '',
    });

    const {
        data: cancelData,
        setData: setCancelData,
        post: postCancel,
        processing: cancelProcessing,
    } = useForm({
        reason: '',
    });

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    const handleIssue = (e: React.FormEvent) => {
        e.preventDefault();
        postIssue(route('debit-notes.issue', note.id), {
            onSuccess: () => {
                setShowIssueModal(false);
                setIssueData({ notes: '' });
                toast.success('Debit note issued successfully.');
            },
            onError: () => {
                console.log('Failed to issue debit note.');
                toast.error('Failed to issue debit note.');
            },
        });
    };
    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        postCancel(route('debit-notes.cancel', note.id), {
            onSuccess: () => {
                setShowCancelModal(false);
                setCancelData({ reason: '' });
                toast.success('Debit note cancelled successfully.');
            },
            onError: () => {
                console.log('Failed to cancel debit note.');
                toast.error('Failed to cancel debit note.');
            },
        });
    };

    const handleRegenerate = () => {
        // For regeneration, we need to redirect to the generate page with the same template
        // This allows the user to modify the design and regenerate
        router.visit(route('debit-notes.template-options', note.id), {
            data: {
                template_id: note.document_template_id,
                regenerate_debit_note_id: note.id,
            },
        });
    };
    return (
        <AppLayout>
            <Head title={`Debit Note - ${note.note_number}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Debit Note Details</h2>
                        <p className="text-muted-foreground">View debit note details</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {note.status === 'draft' && (
                            <>
                                <Link href={route('debit-notes.edit', note.id)}>
                                    <Button variant="outline">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button onClick={() => router.post(route('debit-notes.issue', note.id), {})}>Issue Note</Button>
                            </>
                        )}
                        {note.status === 'issued' && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        route('debit-notes.mark-paid', note.id),
                                        {},
                                        {
                                            onSuccess: () => {
                                                toast.success('Debit note marked as paid successfully.');
                                            },
                                            onError: () => {
                                                console.log('Failed to mark debit note as paid.');
                                                toast.error('Failed to mark debit note as paid.');
                                            },
                                        },
                                    )
                                }
                            >
                                Mark as Paid
                            </Button>
                        )}
                        {note.file_path && (
                            <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>
                        )}
                        {note.file_path && (
                            <Button variant="outline" onClick={() => (window.location.href = route('debit-notes.download', note.id))}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                        {note.status === 'generated' && (
                            <Button onClick={() => setShowIssueModal(true)}>
                                <Send className="mr-2 h-4 w-4" />
                                Issue Debit Note
                            </Button>
                        )}
                        {note.status === 'generated' || note.status === 'issued' ? (
                            <Button variant="outline" onClick={handleRegenerate}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Regenerate
                            </Button>
                        ) : (
                            <Button asChild variant="outline">
                                <Link href={route('debit-notes.template-options', note.id)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Debit Note
                                </Link>
                            </Button>
                        )}
                        {(note.status === 'generated' || note.status === 'issued') && (
                            <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Debit Note Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">DebitNote Number</h4>
                                    <p className="font-mono text-lg">DN-{note.note_number}</p>
                                </div>
                                {note.reference_number && (
                                    <div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-500">Reference Number</h4>
                                        <p className="font-mono text-lg">{note.reference_number}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Base Amount</h4>
                                    <p className={`text-lg font-semibold text-red-600`}>{note.formatted_amount}</p>
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Tax Amount</h4>
                                    <p className="text-lg">{note.formatted_tax_amount}</p>
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Total Amount</h4>
                                    <p className={`text-lg font-bold text-red-600`}>{note.formatted_total_amount}</p>
                                </div>
                                {note.currency_code !== 'NGN' && (
                                    <div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-500">Exchange Rate</h4>
                                        <p className="text-lg">
                                            1 {note.currency_code} = {note.exchange_rate} NGN
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Status</h4>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon()}
                                        <Badge variant="outline" className={getStatusColor()}>
                                            {note.is_overdue ? 'Overdue' : note.status}
                                        </Badge>
                                    </div>
                                    {note.is_overdue && <p className="mt-1 text-sm text-red-600">{note.days_overdue} days overdue</p>}
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Payment Status</h4>
                                    <Badge variant={note.payment_status === 'paid' ? 'success' : 'secondary'}>{note.payment_status}</Badge>
                                    {note.amount_paid && note.balance_due && (
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-500">
                                                Paid: {note.amount_paid} / Balance: {note.balance_due}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-1 text-sm font-medium text-gray-500">Description</h4>
                                <p className="whitespace-pre-wrap">{note.description}</p>
                            </div>

                            {note.internal_notes && (
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-gray-500">Internal Notes</h4>
                                    <p className="whitespace-pre-wrap text-gray-600">{note.internal_notes}</p>
                                </div>
                            )}

                            {note.items && note.items.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-gray-500">Items</h4>
                                    <div className="space-y-2">
                                        {note.items.map((item, index) => (
                                            <div key={index} className="rounded-md border p-2">
                                                <p className="font-medium">{item.description}</p>
                                                <div className="mt-1 grid grid-cols-3 gap-2 text-sm text-gray-600">
                                                    <p>Amount: {item.amount}</p>
                                                    {item.tax_amount && <p>Tax: {item.tax_amount}</p>}
                                                    <p>Total: {item.total_amount}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Policy Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-1 text-sm font-medium text-gray-500">Customer</h4>
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-lg">{getCustomerName(note.customer)}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="mb-1 text-sm font-medium text-gray-500">Policy / Risk Reference</h4>
                                <p className="text-lg">{note.policy?.policy_number ?? 'To Be Advised'}</p>
                            </div>
                            <div>
                                <h4 className="mb-1 text-sm font-medium text-gray-500">Due Date</h4>
                                {note.due_date ? (
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-lg">{new Date(note.due_date).toLocaleDateString()}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">No due date set</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div>
                                    <h4 className="font-medium">Created</h4>
                                    <p className="text-sm text-gray-500">By {note.created_by.name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm">{new Date(note.issue_date).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {note.updated_by && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <h4 className="font-medium">Last Updated</h4>
                                        <p className="text-sm text-gray-500">By {note.updated_by.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm">{new Date(note.updated_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            {note.status !== 'draft' && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <h4 className="font-medium">Issued</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm">{new Date(note.issue_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            {note.paid_at && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <h4 className="font-medium">Paid</h4>
                                        {note.metadata?.payment_reference && (
                                            <p className="text-sm text-gray-500">Ref: {note.metadata?.payment_reference}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm">{new Date(note.paid_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            {note.cancelled_at && (
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <h4 className="font-medium">Cancelled</h4>
                                        {note.cancelled_by && <p className="text-sm text-gray-500">By {note.cancelled_by.name}</p>}
                                        {note.cancellation_reason && <p className="text-sm text-red-600">Reason: {note.cancellation_reason}</p>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm">{new Date(note.cancelled_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => router.get(route('debit-notes.index'))}>
                                Back to List
                            </Button>
                            {note.status === 'draft' && (
                                <Button variant="destructive" onClick={() => router.delete(route('debit-notes.destroy', note.id))}>
                                    Delete Note
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Issue Debit Note Modal */}
            {showIssueModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold">Issue Debit Note</h3>
                        <form onSubmit={handleIssue}>
                            <div className="mb-4">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={issueData.notes}
                                    onChange={(e) => setIssueData('notes', e.target.value)}
                                    placeholder="Add any notes about issuing this debit note..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={issueProcessing} className="flex-1">
                                    {issueProcessing ? 'Issuing...' : 'Issue Debit Note'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowIssueModal(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Show Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b px-4 py-2">
                            <h3 className="text-lg font-semibold">Debit Note Preview</h3>
                            <button onClick={() => setShowPreviewModal(false)} className="rounded-full p-2 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex h-[90vh] justify-center overflow-auto bg-gray-50 p-4 dark:bg-gray-600">
                            {note.file_path && <iframe src={route('debit-notes.preview', note.id)} className="h-full w-full rounded border" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Debit Note Modal */}
            {showCancelModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold">Cancel Debit Note</h3>
                        <form onSubmit={handleCancel}>
                            <div className="mb-4">
                                <Label htmlFor="reason">Cancellation Reason *</Label>
                                <Textarea
                                    id="reason"
                                    value={cancelData.reason}
                                    onChange={(e) => setCancelData('reason', e.target.value)}
                                    placeholder="Please provide a reason for cancelling this Debit Note..."
                                    rows={3}
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" variant="destructive" disabled={cancelProcessing} className="flex-1">
                                    {cancelProcessing ? 'Cancelling...' : 'Cancel Debit Note'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowCancelModal(false)}>
                                    Close
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
