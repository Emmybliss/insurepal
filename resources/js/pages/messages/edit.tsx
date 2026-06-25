import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Paperclip, Save, Send, X } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface MessageRecipient {
    id: number;
    recipient_id: number;
    recipient: User;
}

interface Message {
    id: number;
    subject: string;
    body: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    attachments?: Array<{
        name: string;
        path: string;
        size: number;
        type: string;
    }>;
    message_recipients: MessageRecipient[];
}

interface Props {
    message: Message;
    users: User[];
}

export default function EditMessage({ message, users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        recipients: message.message_recipients.map((mr) => mr.recipient_id),
        subject: message.subject,
        body: message.body,
        priority: message.priority,
        attachments: [] as File[],
        remove_attachments: [] as number[],
    });

    const [selectedUsers, setSelectedUsers] = useState<User[]>(message.message_recipients.map((mr) => mr.recipient));
    const [existingAttachments, setExistingAttachments] = useState(message.attachments || []);

    const handleSubmit = (e: React.FormEvent, action: 'send' | 'draft') => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('recipients', JSON.stringify(data.recipients));
        formData.append('subject', data.subject);
        formData.append('body', data.body);
        formData.append('priority', data.priority);
        formData.append('remove_attachments', JSON.stringify(data.remove_attachments));

        if (action === 'send') {
            formData.append('send', '1');
        }

        // Add new attachments
        data.attachments.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });

        put(route('messages.update', message.id), {
            data: formData,
            forceFormData: true,
        });
    };

    const addRecipient = (userId: number) => {
        const user = users.find((u) => u.id === userId);
        if (user && !data.recipients.includes(userId)) {
            setData('recipients', [...data.recipients, userId]);
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const removeRecipient = (userId: number) => {
        setData(
            'recipients',
            data.recipients.filter((id) => id !== userId),
        );
        setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setData('attachments', [...data.attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeNewAttachment = (index: number) => {
        setData(
            'attachments',
            data.attachments.filter((_, i) => i !== index),
        );
    };

    const removeExistingAttachment = (index: number) => {
        setData('remove_attachments', [...data.remove_attachments, index]);
        setExistingAttachments(existingAttachments.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <AppLayout>
            <Head title={`Edit Message: ${message.subject}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('messages.show', message.id)} className="flex items-center text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Draft Message</h1>
                            <p className="text-gray-600">Make changes to your draft message</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Edit className="h-5 w-5" />
                            <span>Message Details</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            {/* Recipients */}
                            <div className="space-y-2">
                                <Label htmlFor="recipients">Recipients *</Label>
                                <div className="space-y-2">
                                    <Select onValueChange={(value) => addRecipient(parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select recipients" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users
                                                .filter((user) => !data.recipients.includes(user.id))
                                                .map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.name} ({user.email})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center space-x-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                                                >
                                                    <span>{user.name}</span>
                                                    <button type="button" onClick={() => removeRecipient(user.id)} className="hover:text-blue-600">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.recipients && <p className="text-sm text-red-600">{errors.recipients}</p>}
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    placeholder="Enter message subject"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    className={errors.subject ? 'border-red-500' : ''}
                                />
                                {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={data.priority}
                                    onValueChange={(value) => setData('priority', value as 'low' | 'normal' | 'high' | 'urgent')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
                            </div>

                            {/* Message Body */}
                            <div className="space-y-2">
                                <Label htmlFor="body">Message *</Label>
                                <Textarea
                                    id="body"
                                    placeholder="Type your message here..."
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    className={errors.body ? 'border-red-500' : ''}
                                    rows={8}
                                />
                                {errors.body && <p className="text-sm text-red-600">{errors.body}</p>}
                            </div>

                            {/* Existing Attachments */}
                            {existingAttachments.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Current Attachments</Label>
                                    <div className="space-y-2">
                                        {existingAttachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                                <div className="flex items-center space-x-3">
                                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingAttachment(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Attachments */}
                            <div className="space-y-2">
                                <Label>Add New Attachments</Label>
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
                                    <div className="text-center">
                                        <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="mt-2">
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-500">Upload files</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    multiple
                                                    className="sr-only"
                                                    onChange={handleFileUpload}
                                                />
                                            </label>
                                            <p className="text-gray-500">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                                    </div>
                                </div>

                                {data.attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">New Files to Upload:</p>
                                        {data.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                                                <div className="flex items-center space-x-3">
                                                    <Paperclip className="h-4 w-4 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewAttachment(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <Link href={route('messages.show', message.id)}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="button" variant="outline" disabled={processing} onClick={(e) => handleSubmit(e, 'draft')}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Draft'}
                                </Button>
                                <Button type="button" disabled={processing || data.recipients.length === 0} onClick={(e) => handleSubmit(e, 'send')}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {processing ? 'Sending...' : 'Send Message'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
