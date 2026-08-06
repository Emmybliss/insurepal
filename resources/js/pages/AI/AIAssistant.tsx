import { AIWorkspace } from '@/components/ai/ai-workspace';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

interface AIAssistantProps {
    conversations?: [];
    messages?: [];
    approvals?: [];
    suggestions?: [];
}

export default function AIAssistant({
    conversations = [],
    messages = [],
    approvals = [],
    suggestions = [],
}: AIAssistantProps) {
    const { auth } = usePage<any>().props;

    const tenantName = auth?.user?.tenant?.name || 'InsurePal Enterprise';
    const userName = auth?.user?.name || 'You';
    const userAvatar = auth?.user?.avatar || auth?.user?.profile_photo_url;

    return (
        <AppLayout>
            <Head title="AI Copilot - InsurePal" />
            <AIWorkspace
                conversations={conversations}
                messages={messages}
                approvals={approvals}
                suggestions={suggestions}
                tenantName={tenantName}
                userName={userName}
                userAvatar={userAvatar}
            />
        </AppLayout>
    );
}
