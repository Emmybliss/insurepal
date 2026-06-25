import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { CheckCircle, Shield, XCircle } from 'lucide-react';
import React from 'react';

interface DocumentData {
    type: string;
    number: string;
    status: string;
    amount: string;
    total_amount: string;
    currency: string;
    issue_date: string;
    customer_name: string;
    policy_number?: string;
    company_name?: string;
}

interface Props {
    found: boolean;
    document: DocumentData | null;
    integrityValid: boolean | null;
    verifiedAt: string;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    void: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function DocumentVerify({ found, document: doc, integrityValid, verifiedAt }: Props) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Head title={found ? `Verify: ${doc?.number ?? ''}` : 'Document Not Found'} />

            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex items-center justify-center gap-3">
                    <span className="text-2xl font-bold tracking-tight">InsurePal</span>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Document Verification</h1>
                    <p className="mt-1 text-muted-foreground">
                        {found ? `${doc?.type ?? 'Document'} Authenticity Check` : 'Document Lookup'}
                    </p>
                </div>

                {found && doc && (
                    <>
                        <div className="mb-8 flex justify-center">
                            {integrityValid === true && (
                                <div className="inline-flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-6 py-3 dark:border-green-800 dark:bg-green-900/20">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-green-800 dark:text-green-300">Valid Document</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            Digital signature verified — content has not been altered
                                        </p>
                                    </div>
                                </div>
                            )}
                            {integrityValid === false && (
                                <div className="inline-flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-6 py-3 dark:border-red-800 dark:bg-red-900/20">
                                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-red-800 dark:text-red-300">Invalid Document</p>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Checksum mismatch — content may have been tampered with
                                        </p>
                                    </div>
                                </div>
                            )}
                            {integrityValid === null && (
                                <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                                    <Shield className="h-8 w-8 text-gray-400" />
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                                            Verification Not Available
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            No digital snapshot exists for this document version
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    {doc.type} Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{doc.type} Number</p>
                                        <p className="font-medium">{doc.number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge
                                            className={
                                                statusStyles[doc.status] ||
                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }
                                        >
                                            {doc.status.replace(/_/g, ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    {doc.issue_date && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Issue Date</p>
                                            <p className="font-medium">{formatDate(doc.issue_date)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Customer</p>
                                        <p className="font-medium">{doc.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amount ({doc.currency})</p>
                                        <p className="font-medium">{doc.currency} {doc.amount}</p>
                                    </div>
                                    {doc.total_amount !== doc.amount && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Amount ({doc.currency})</p>
                                            <p className="font-medium">{doc.currency} {doc.total_amount}</p>
                                        </div>
                                    )}
                                    {doc.policy_number && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Policy Number</p>
                                            <p className="font-medium">{doc.policy_number}</p>
                                        </div>
                                    )}
                                    {doc.company_name && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Issued By</p>
                                            <p className="font-medium">{doc.company_name}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {!found && (
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <XCircle className="h-6 w-6 text-red-500" />
                                <div>
                                    <h3 className="font-medium text-red-900 dark:text-red-300">Document Not Found</h3>
                                    <p className="mt-1 text-red-700 dark:text-red-400">
                                        No document matches the provided verification token. The document may have been removed or the
                                        link may be invalid.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-12 border-t pt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        This is a digitally verified document issued by InsurePal
                    </p>
                    {found && doc && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {doc.type} #{doc.number} · Verified {formatDate(verifiedAt)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
