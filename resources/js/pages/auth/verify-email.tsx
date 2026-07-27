import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, HelpCircle, LifeBuoy, LoaderCircle, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { AnimatedPage } from '@/components/animated-page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});
    const [showContactModal, setShowContactModal] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthSplitLayout
            title="Verification Pending"
            description="Your account is awaiting email verification or administrator approval before full access can be granted."
        >
            <AnimatedPage>
                <Head title="Email Verification - InsurePal" />

                <div className="space-y-6">
                    {/* Status Alerts */}
                    {status === 'verification-link-sent' ? (
                        <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <AlertTitle className="font-semibold">Verification Email Sent!</AlertTitle>
                            <AlertDescription className="text-sm">
                                A fresh verification link has been dispatched to your registered email address. Please check your inbox and spam folder.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <AlertTitle className="font-semibold">Account Access Restricted</AlertTitle>
                            <AlertDescription className="text-sm">
                                Your account is awaiting email verification or administrator approval. Protected workspace resources will become available immediately upon verification.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Resend Action Form */}
                    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
                        <CardHeader className="pb-3 text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Mail className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-lg">Check Your Email Inbox</CardTitle>
                            <CardDescription>
                                Click on the verification link inside the email we sent you during registration to activate your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <form onSubmit={submit} className="flex flex-col items-center gap-3">
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Email...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Resend Verification Email
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Helpful Troubleshooting Instructions */}
                    <Card className="border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <HelpCircle className="mr-2 h-4 w-4 text-primary" />
                                Having trouble receiving the email?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Check your junk, spam, or promotions folders in your email provider.</li>
                                <li>Verify that your registered email address was entered correctly.</li>
                                <li>Verification links are valid for 60 minutes for security reasons.</li>
                                <li>If you cannot receive emails, contact your Super Admin for manual account approval.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Footer Links & Contact Admin Option */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
                        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400">
                                    <LifeBuoy className="mr-1.5 h-4 w-4" />
                                    Contact Administrator
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <LifeBuoy className="h-5 w-5 text-primary" />
                                        Need Help with Verification?
                                    </DialogTitle>
                                    <DialogDescription className="pt-2 text-sm leading-relaxed">
                                        If your email provider blocks automated messages or you cannot access your inbox, a Super Admin can manually approve your account in the admin dashboard.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
                                    <div className="font-medium text-foreground">Support Contact:</div>
                                    <p className="text-muted-foreground">Please send your full name and account email to your Super Administrator or system manager for quick approval.</p>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowContactModal(false)}>
                                        Close
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-4 dark:text-slate-400"
                        >
                            Log out of session
                        </Link>
                    </div>
                </div>
            </AnimatedPage>
        </AuthSplitLayout>
    );
}
