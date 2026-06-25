import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { FrontendLayout } from '@/layouts/frontend-layout/frontend-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Home, Mail, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
    status: number;
}

export default function ErrorPage({ status }: Props) {
    const handleRefresh = () => {
        window.location.reload();
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <FrontendLayout>
            <Head title="Error" />
            <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-2xl"
                >
                    <Card className="relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                        <CardHeader className="pb-6 pt-12 text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                                className="mb-8"
                            >
                                <p className="text-5xl font-extrabold tracking-tight text-foreground lg:text-6xl">
                                    {status}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                    We've hit a temporary snag.
                                </h1>
                            </motion.div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8 text-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4 text-lg leading-relaxed text-muted-foreground"
                            >
                                <p>
                                    We apologize for the inconvenience. Our team is working to restore service as quickly as possible.
                                </p>
                                <p>
                                    This disruption may affect your current workflow, but your saved records and documents remain secure.
                                </p>
                                <p>
                                    Please try again in a few moments.
                                </p>
                            </motion.div>
                        </CardContent>

                        <CardFooter className="grid grid-cols-1 gap-3 bg-muted/30 px-8 pb-10 sm:grid-cols-2 lg:gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleBack}
                                className="group bg-background/80 backdrop-blur-sm transition-all duration-300 hover:bg-background"
                            >
                                <RotateCcw className="mr-2 h-4 w-4 transition-transform group-hover:-rotate-45" />
                                Back
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="group bg-background/80 backdrop-blur-sm transition-all duration-300 hover:bg-background"
                            >
                                <a href={route('dashboard')}>
                                    <Home className="mr-2 h-4 w-4" />
                                    Return to Dashboard
                                </a>
                            </Button>

                            <Button
                                size="lg"
                                onClick={handleRefresh}
                                className="group bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]"
                            >
                                <RefreshCw className="mr-2 h-4 w-4 transition-transform duration-700 group-hover:rotate-180" />
                                Refresh Page
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="group bg-background/80 backdrop-blur-sm transition-all duration-300 hover:bg-background"
                            >
                                <a href="mailto:support@insurepal.app">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Contact Support
                                </a>
                            </Button>
                        </CardFooter>

                        <div className="absolute bottom-0 left-0 w-full bg-muted/20 px-8 pb-6 pt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                If the problem persists, contact support at{' '}
                                <a
                                    href="mailto:support@insurepal.app"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    support@insurepal.app
                                </a>
                            </p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </FrontendLayout>
    );
}
