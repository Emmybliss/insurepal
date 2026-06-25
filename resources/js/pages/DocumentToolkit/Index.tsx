import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlan } from '@/hooks/use-plan';
import { useLang } from '@/hooks/useLang';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link } from '@inertiajs/react';
import { FileStack, FileUp, ImageOff, Lock, PenTool } from 'lucide-react';

export default function Index() {
    const { t } = useLang();
    const { hasPlan } = usePlan();

    const breadcrumbs = [
        {
            title: t('Document Toolkit'),
            href: route('document-toolkit.index'),
        },
    ];

    // Helper to check plan restrictions based on SaaS strategy
    const hasProfessional = hasPlan('professional') || hasPlan('enterprise');
    const hasEnterprise = hasPlan('enterprise');

    const tools = [
        {
            id: 'branding',
            title: t('Document Branding'),
            description: t('Upload PDFs and visually apply signatures, stamps, watermarks, and headers/footers.'),
            icon: PenTool,
            href: route('document-toolkit.branding.index'),
            requiresPlan: 'starter',
            locked: false,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            id: 'converter',
            title: t('Document Converter'),
            description: t('Convert documents (DOCX/XLSX) to PDF or batch images to PDF.'),
            icon: FileUp,
            href: route('document-toolkit.converter'),
            requiresPlan: 'starter',
            locked: false,
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            id: 'merger',
            title: t('Document Merger'),
            description: t('Merge multiple PDFs into a single document. Drag to reorder.'),
            icon: FileStack,
            href: route('document-toolkit.merger'),
            requiresPlan: 'professional',
            locked: !hasProfessional,
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            id: 'compressor',
            title: t('Document Compressor'),
            description: t('Compress PDFs or optimize images. Uses Ghostscript.'),
            icon: ImageOff,
            href: route('document-toolkit.compressor'),
            requiresPlan: 'professional',
            locked: !hasProfessional,
            color: 'text-orange-500',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Document Toolkit')} />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col space-y-6 p-4 md:p-6 lg:p-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('Document Toolkit')}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        {t('Powerful built-in tools to manage your insurance documents and evidence.')}
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {tools.map((tool) => (
                        <Card
                            key={tool.id}
                            className={`group relative overflow-hidden border-border/50 transition-all hover:shadow-md ${tool.locked ? 'opacity-80' : 'hover:border-primary/50'}`}
                        >
                            {tool.locked && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 p-6 text-center backdrop-blur-[1px]">
                                    <div className="mb-3 rounded-full bg-background p-3 shadow-lg">
                                        <Lock className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{t('Upgrade required')}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('This tool is available on the')}{' '}
                                        <span className="font-medium text-foreground capitalize">{tool.requiresPlan}</span> {t('plan.')}
                                    </p>
                                    <Link href={route('subscription.plans')} className="mt-4 text-sm font-medium text-primary hover:underline">
                                        {t('View Plans')}
                                    </Link>
                                </div>
                            )}

                            <Link href={tool.locked ? '#' : tool.href} className={tool.locked ? 'pointer-events-none' : ''}>
                                <CardHeader className="pb-4">
                                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tool.bgColor}`}>
                                        <tool.icon className={`h-6 w-6 ${tool.color}`} />
                                    </div>
                                    <CardTitle className="text-xl transition-colors group-hover:text-primary">{tool.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">{tool.description}</CardDescription>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>

                {/* Enterprise Feature Teaser */}
                {!hasEnterprise && (
                    <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-xl border border-primary/20 bg-primary/5 p-6 md:flex-row md:p-8">
                        <div>
                            <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold tracking-wider text-primary-foreground uppercase">
                                    Enterprise
                                </span>
                                Smart Claim Document Packager
                            </h3>
                            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
                                Need to automatically package police reports, vehicle photos, and forms into standardized claim documents? Enterprise
                                plans include Smart Claim Formatting and auto-saving to your Document Vault.
                            </p>
                        </div>
                        <div className="shrink-0">
                            <Link
                                href={route('subscription.plans')}
                                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                {t('Upgrade to Enterprise')}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppSidebarLayout>
    );
}
