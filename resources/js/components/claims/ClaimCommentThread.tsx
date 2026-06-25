import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { ClaimComment } from '@/types/claim';
import { router } from '@inertiajs/react';
import { MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

interface ClaimCommentThreadProps {
    claimId: number;
    comments: ClaimComment[];
    canComment: boolean;
}

export function ClaimCommentThread({ claimId, comments, canComment }: ClaimCommentThreadProps) {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        router.post(
            route('claims.add-comment', claimId),
            { body: newComment, is_internal: false },
            {
                onSuccess: () => {
                    setNewComment('');
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Comment */}
                {canComment && (
                    <div className="space-y-2">
                        <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
                        <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
                            <Send className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">No comments yet.</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3 rounded border p-3">
                                <Avatar>
                                    <AvatarFallback>{comment.author?.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{comment.author?.name}</p>
                                        <span className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <p className="mt-1 text-sm">{comment.body}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
