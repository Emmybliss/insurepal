import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';

interface SendMessageButtonProps {
    recipientId?: number;
    relatedType?: string;
    relatedId?: number;
    relatedSubject?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    onSuccess?: () => void;
}

export function SendMessageButton({
    recipientId,
    relatedType,
    relatedId,
    relatedSubject,
    variant = 'default',
    size = 'default',
    onSuccess,
}: SendMessageButtonProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        subject: relatedSubject || '',
        body: '',
        recipients: recipientId ? [recipientId] : [] as number[],
        priority: 'normal',
    });

    const handleSubmit = (send: boolean = true) => {
        router.post(
            route('inbox.store'),
            {
                ...formData,
                related_type: relatedType,
                related_id: relatedId,
                action: send ? 'send' : 'draft',
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({
                        subject: '',
                        body: '',
                        recipients: recipientId ? [recipientId] : [],
                        priority: 'normal',
                    });
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} size={size}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                            }
                            placeholder="Enter subject..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="body">Message *</Label>
                        <Textarea
                            id="body"
                            value={formData.body}
                            onChange={(e) =>
                                setFormData({ ...formData, body: e.target.value })
                            }
                            placeholder="Type your message..."
                            rows={5}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => handleSubmit(false)}>
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSubmit(true)}
                        disabled={!formData.subject.trim() || !formData.body.trim()}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}