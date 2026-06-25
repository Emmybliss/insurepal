import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Flag, Info, Paperclip, Send, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface SupportTicketCreateProps {
    users?: User[];
    categories?: Array<{
        value: string;
        label: string;
        description?: string;
    }>;
    priorities?: Array<{
        value: string;
        label: string;
        description?: string;
    }>;
    canAssignToOthers?: boolean;
}

export default function SupportTicketCreate({ users = [], categories = [], priorities = [], canAssignToOthers = false }: SupportTicketCreateProps) {
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, errors, post, processing } = useForm({
        subject: '',
        description: '',
        category: '',
        priority: 'normal',
        assignee_id: '',
        attachments: [] as File[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // No need to transform assignee_id here — the Select's onValueChange
        // already converts 'unassigned' → '' when the user picks it.
        post(route('support-tickets.store'), {
            onError: (errors) => {
                console.log(errors);
                setIsSubmitting(false);
                toast.error('Failed to create support ticket. Please check your inputs.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
        setData('attachments', [...data.attachments, ...files]);
    };

    const removeAttachment = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index);
        setAttachments(newAttachments);
        setData('attachments', newAttachments);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'technical':
                return <AlertCircle className="h-4 w-4" />;
            case 'billing':
                return <User className="h-4 w-4" />;
            case 'general':
                return <Info className="h-4 w-4" />;
            case 'feature_request':
                return <Tag className="h-4 w-4" />;
            case 'bug_report':
                return <Flag className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout>
            <Head title="Create Support Ticket" />

            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div>
                        <h1 className="text-tracking-light text-3xl font-bold">Create Support Ticket</h1>
                        <p className="mt-2 text-muted-foreground">Submit a new support request for assistance</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Info className="h-5 w-5" />
                                        <span>Ticket Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="Brief description of the issue"
                                            className={cn(errors.subject && 'border-red-500')}
                                        />
                                        {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Please provide detailed information about your issue..."
                                            rows={6}
                                            className={cn(errors.description && 'border-red-500')}
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Attachments */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Paperclip className="h-5 w-5" />
                                        <span>Attachments</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="attachments">Upload Files</Label>
                                            <Input id="attachments" type="file" multiple onChange={handleFileUpload} className="mt-1" />
                                            <p className="mt-1 text-sm text-gray-500">Upload screenshots, documents, or other relevant files</p>
                                        </div>

                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>Uploaded Files</Label>
                                                {attachments.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                                        <div className="flex items-center space-x-3">
                                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                            </div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Category & Priority */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Tag className="h-5 w-5" />
                                        <span>Classification</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="category">Category *</Label>
                                        <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                            <SelectTrigger className={cn(errors.category && 'border-red-500')}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        <div className="flex items-center space-x-2">
                                                            {getCategoryIcon(category.value)}
                                                            <span>{category.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map((priority) => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className={getPriorityColor(priority.value)}>{priority.label}</Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assignment */}
                            {canAssignToOthers && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <User className="h-5 w-5" />
                                            <span>Assignment</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div>
                                            <Label htmlFor="assignee">Assign To</Label>
                                            <Select
                                                value={data.assignee_id || 'unassigned'}
                                                onValueChange={(value) => setData('assignee_id', value === 'unassigned' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select assignee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Subject</Label>
                                            <p className="text-sm text-gray-900">{data.subject || 'No subject'}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Category</Label>
                                            <div className="mt-1 flex items-center space-x-2">
                                                {data.category && getCategoryIcon(data.category)}
                                                <span className="text-sm text-gray-900">
                                                    {categories.find((c) => c.value === data.category)?.label || 'Not selected'}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Priority</Label>
                                            <div className="mt-1">
                                                <Badge className={getPriorityColor(data.priority)}>
                                                    {priorities.find((p) => p.value === data.priority)?.label || 'Normal'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>

                        <div className="flex items-center space-x-3">
                            <Button type="submit" disabled={processing || isSubmitting} className="min-w-[120px]">
                                {processing || isSubmitting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Create Ticket
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
