import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Paperclip, Send } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    type?: string;
}

interface Props {
    recipients: User[];
    customers: User[];
}

export default function InboxCreate({ recipients, customers }: Props) {
    const [formData, setFormData] = useState({
        subject: '',
        body: '',
        recipients: [] as number[],
        cc: [] as number[],
        priority: 'normal',
    });

    const allRecipients = [...recipients, ...customers];

    const handleSubmit = (send: boolean = false) => {
        router.post(
            route('inbox.store'),
            {
                ...formData,
                send,
            },
            {
                onSuccess: () => {
                    router.visit(route('inbox.index'));
                },
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Compose Message" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Compose Message</h1>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Enter subject..."
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="to">To *</Label>
                        <Select
                            onValueChange={(value) => {
                                const id = parseInt(value);
                                if (!formData.recipients.includes(id)) {
                                    setFormData({ ...formData, recipients: [...formData.recipients, id] });
                                }
                            }}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select recipients..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allRecipients.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {formData.recipients.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.recipients.map((id) => {
                                    const user = allRecipients.find((u) => u.id === id);
                                    return user ? (
                                        <span
                                            key={id}
                                            className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                                        >
                                            {user.name}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        recipients: formData.recipients.filter((r) => r !== id),
                                                    })
                                                }
                                                className="ml-2 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="cc">CC</Label>
                        <Select
                            onValueChange={(value) => {
                                const id = parseInt(value);
                                if (!formData.cc.includes(id)) {
                                    setFormData({ ...formData, cc: [...formData.cc, id] });
                                }
                            }}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select CC recipients..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allRecipients
                                    .filter((u) => !formData.recipients.includes(u.id))
                                    .map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                            <SelectTrigger className="mt-1 w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="body">Message *</Label>
                        <Textarea
                            id="body"
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            placeholder="Type your message..."
                            rows={10}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="button" onClick={() => handleSubmit(true)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                        >
                            Save Draft
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}