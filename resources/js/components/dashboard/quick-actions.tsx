import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { VariantProps } from 'class-variance-authority';
import { Download, FilePlus, LucideIcon, Receipt, Send, Shield } from 'lucide-react';

interface QuickAction {
    title: string;
    description: string;
    icon: LucideIcon;
    color: VariantProps<typeof buttonVariants>['variant'];
    href: string;
}

const quickActions: QuickAction[] = [

    {
        title: 'Policies',
        description: 'View All policies',
        icon: Shield,
        color: 'accent',
        href: '/policy-management',
    },
    // Document Toolkits
    {
        title: 'ToolKit',
        description: 'Document Toolkit',
        icon: FilePlus,
        color: 'premium',
        href: '/document-toolkit',
    },
    // {
    //     title: 'AI Assistant',
    //     description: 'Get AI-powered assistance',
    //     icon: Bot,
    //     color: 'premium',
    //     href: '/ai-assistant',
    // },
    {
        title: 'Debit Notes',
        description: 'Create payment request',
        icon: Receipt,
        color: 'warning',
        href: '/debit-notes',
    },
    {
        title: 'Credit Notes',
        description: 'Create Credit Note',
        icon: Receipt,
        color: 'success',
        href: '/credit-notes',
    },
    {
        title: 'Renewal Management',
        description: 'Manage policy renewals',
        icon: Send,
        color: 'secondary',
        href: '/renewals',
    },
    {
        title: 'NAICOM Reports',
        description: 'Download NAICOM reports',
        icon: Download,
        color: 'professional',
        href: '/reports/naicom',
    },

];

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used actions and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 ">
                    {quickActions.map((action, index) => (
                        <Button key={index} variant={action.color} className="h-auto flex-col items-start justify-start p-4 text-left" asChild>
                            <Link href={action.href}>
                                <div className="mb-2 flex w-full items-center gap-3">
                                    <action.icon className="h-5 w-5" />
                                    <span className="font-medium text-wrap">{action.title}</span>
                                </div>
                                <p className="text-left text-xs text-wrap opacity-80">{action.description}</p>
                            </Link>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
