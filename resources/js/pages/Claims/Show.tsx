import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { ClaimActivityLog } from '@/components/claims/ClaimActivityLog';
import { ClaimCommentThread } from '@/components/claims/ClaimCommentThread';
import { ClaimDocumentUploader } from '@/components/claims/ClaimDocumentUploader';
import { ClaimStatusBadge } from '@/components/claims/ClaimStatusBadge';
import { ClaimTimeline } from '@/components/claims/ClaimTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageProps } from '@/types';
import { Claim, ClaimComment } from '@/types/claim';
import { ArrowLeft, CheckCircle, Edit, PlayCircle, Send, XCircle } from 'lucide-react';

interface Props extends PageProps {
    claim: Claim;
    comments: ClaimComment[];
    canEdit: boolean;
    canSubmit: boolean;
    canReview: boolean;
    canApprove: boolean;
    canReject: boolean;
    canSettle: boolean;
    canClose: boolean;
    canAddDocuments: boolean;
    canAddComments: boolean;
}

export default function Show({ claim, comments, ...permissions }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const { props } = usePage<Props & { flash?: { success?: string; error?: string } }>();

    useEffect(() => {
        if (props.flash?.success) {
            toast({
                title: 'Success',
                description: props.flash.success,
                variant: 'default',
            });
        }
        if (props.flash?.error) {
            toast({
                title: 'Error',
                description: props.flash.error,
                variant: 'destructive',
            });
        }
    }, [props.flash]);

    const handleAction = (action: string, data?: any) => {
        setIsProcessing(true);
        router.post(route(`claims.${action}`, claim.id), data || {}, {
            onFinish: () => setIsProcessing(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Claim ${claim.claim_reference}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.visit(route('claims.index'))}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">{claim.claim_reference}</h1>
                            <p className="text-muted-foreground">Claim Details</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {permissions.canEdit && (
                            <Button variant="outline" onClick={() => router.visit(route('claims.edit', claim.id))}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        )}
                        {permissions.canSubmit && (
                            <Button onClick={() => handleAction('submit')} disabled={isProcessing}>
                                <Send className="mr-2 h-4 w-4" />
                                Submit for Review
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Overview */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Claim Overview</CardTitle>
                                    <ClaimStatusBadge status={claim.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Customer</p>
                                        <p className="font-medium">{claim.customer?.display_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Policy Number</p>
                                        <p className="font-medium">{claim.policy?.policy_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Claim Type</p>
                                        <p className="font-medium capitalize">{claim.claim_type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Incident Date</p>
                                        <p className="font-medium">{formatDate(claim.incident_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Claim Amount</p>
                                        <p className="font-medium">{formatCurrency(claim.claim_amount)}</p>
                                    </div>
                                    {claim.approved_amount && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Approved Amount</p>
                                            <p className="font-medium text-green-600">{formatCurrency(claim.approved_amount)}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Incident Description</p>
                                    <p className="mt-1">{claim.incident_description}</p>
                                </div>
                                {claim.decision_notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Decision Notes</p>
                                        <p className="mt-1">{claim.decision_notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="documents">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="comments">Comments</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                            </TabsList>
                            <TabsContent value="documents">
                                <ClaimDocumentUploader
                                    claimId={claim.id}
                                    documents={claim.documents || []}
                                    canUpload={permissions.canAddDocuments}
                                    documentTypes={[]} // Pass from backend
                                />
                            </TabsContent>
                            <TabsContent value="comments">
                                <ClaimCommentThread claimId={claim.id} comments={comments} canComment={permissions.canAddComments} />
                            </TabsContent>
                            <TabsContent value="activity">
                                <ClaimActivityLog activities={claim.activities || []} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <ClaimTimeline claim={claim} />

                        {/* Actions */}
                        {(permissions.canReview || permissions.canApprove || permissions.canReject || permissions.canSettle) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {permissions.canReview && claim.status === 'submitted' && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                            onClick={() => handleAction('start-review')}
                                        >
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            Start Review
                                        </Button>
                                    )}
                                    {permissions.canApprove && (
                                        <Button className="w-full" onClick={() => handleAction('approve', { approved_amount: claim.claim_amount })}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Claim
                                        </Button>
                                    )}
                                    {permissions.canReject && (
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => handleAction('reject', { decision_notes: 'Rejected' })}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject Claim
                                        </Button>
                                    )}
                                    {permissions.canSettle && (
                                        <Button variant="outline" className="w-full" onClick={() => handleAction('settle')}>
                                            Settle Claim
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
