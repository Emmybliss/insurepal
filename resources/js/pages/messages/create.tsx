import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Paperclip, Save, Send, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    users: User[];
}

export default function CreateMessage({ users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        recipients: [] as number[],
        subject: '',
        body: '',
        priority: 'low' as 'low' | 'medium' | 'high',
        attachments: [] as File[],
        action: 'send' as 'send' | 'draft',
    });

    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const handleSubmit = (e: React.FormEvent, action: 'send' | 'draft') => {
        e.preventDefault();

        setData('action', action);
        // console.log(data);
        post(route('messages.store'), {
            forceFormData: true,
            onFinish: () => setData('action', action),
            onSuccess: () => {
                toast.success('Successfu;l');
            },
            onError: (errors) => {
                console.log(errors);
                toast.error('Failed to send message');
            },
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

    const removeAttachment = (index: number) => {
        setData(
            'attachments',
            data.attachments.filter((_, i) => i !== index),
        );
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
            <Head title="Compose Message" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('messages.index')} className="flex items-center text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Compose Message</h1>
                            <p className="text-gray-600">Create a new message to send to your colleagues</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
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
                                <Select value={data.priority} onValueChange={(value) => setData('priority', value as 'low' | 'medium' | 'high')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
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

                            {/* Attachments */}
                            <div className="space-y-2">
                                <Label>Attachments</Label>
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
                                        <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                                        {data.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                                <div className="flex items-center space-x-3">
                                                    <Paperclip className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
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
                                <Link href={route('messages.index')}>
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
