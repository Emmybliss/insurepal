import { AIWorkspace } from '@/components/ai/ai-workspace';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface AIAssistantProps {
    conversations?: [];
    messages?: [];
    approvals?: [];
    suggestions?: [];
}

export default function AIAssistant({ conversations = [], messages = [], approvals = [], suggestions = [] }: AIAssistantProps) {
    return (
        <AppLayout>
            <Head title="AI Assistant" />
            <AIWorkspace conversations={conversations} messages={messages} approvals={approvals} suggestions={suggestions} />
        </AppLayout>
    );
}
