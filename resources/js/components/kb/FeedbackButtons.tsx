import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, MessageSquare, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useState } from 'react';

interface FeedbackButtonsProps {
    articleId: number;
    helpfulCount: number;
    notHelpfulCount: number;
    userFeedback?: 'helpful' | 'not_helpful' | null;
    onFeedback: (articleId: number, feedback: 'helpful' | 'not_helpful') => void;
    onComment?: (articleId: number, comment: string) => void;
    showCounts?: boolean;
    showComment?: boolean;
    variant?: 'default' | 'compact' | 'inline';
    className?: string;
}

export default function FeedbackButtons({
    articleId,
    helpfulCount,
    notHelpfulCount,
    userFeedback,
    onFeedback,
    onComment,
    showCounts = true,
    showComment = true,
    variant = 'default',
    className = '',
}: FeedbackButtonsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [comment, setComment] = useState('');

    const handleFeedback = async (feedback: 'helpful' | 'not_helpful') => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onFeedback(articleId, feedback);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComment = async () => {
        if (!comment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onComment?.(articleId, comment.trim());
            setComment('');
            setShowCommentForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getHelpfulnessPercentage = () => {
        const total = helpfulCount + notHelpfulCount;
        if (total === 0) return 0;
        return Math.round((helpfulCount / total) * 100);
    };

    const getFeedbackButtonStyle = (type: 'helpful' | 'not_helpful') => {
        if (userFeedback === type) {
            return type === 'helpful'
                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
        }
        return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    };

    if (variant === 'compact') {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback('helpful')}
                    disabled={isSubmitting}
                    className={`h-8 px-3 ${getFeedbackButtonStyle('helpful')}`}
                >
                    <ThumbsUp className="mr-1 h-3 w-3" />
                    {showCounts && helpfulCount > 0 && <span className="ml-1">{helpfulCount}</span>}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback('not_helpful')}
                    disabled={isSubmitting}
                    className={`h-8 px-3 ${getFeedbackButtonStyle('not_helpful')}`}
                >
                    <ThumbsDown className="mr-1 h-3 w-3" />
                    {showCounts && notHelpfulCount > 0 && <span className="ml-1">{notHelpfulCount}</span>}
                </Button>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className={`flex items-center space-x-1 ${className}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('helpful')}
                    disabled={isSubmitting}
                    className={`h-6 w-6 p-0 ${getFeedbackButtonStyle('helpful')}`}
                >
                    <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('not_helpful')}
                    disabled={isSubmitting}
                    className={`h-6 w-6 p-0 ${getFeedbackButtonStyle('not_helpful')}`}
                >
                    <ThumbsDown className="h-3 w-3" />
                </Button>
                {showCounts && (helpfulCount > 0 || notHelpfulCount > 0) && (
                    <span className="ml-2 text-xs text-gray-500">{getHelpfulnessPercentage()}% helpful</span>
                )}
            </div>
        );
    }

    // Default variant
    return (
        <Card className={`${className}`}>
            <CardContent className="p-4">
                <div className="text-center">
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Was this article helpful?</h3>

                    <div className="mb-4 flex items-center justify-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => handleFeedback('helpful')}
                            disabled={isSubmitting}
                            className={`px-6 ${getFeedbackButtonStyle('helpful')}`}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Yes
                            {userFeedback === 'helpful' && <Check className="ml-2 h-3 w-3" />}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleFeedback('not_helpful')}
                            disabled={isSubmitting}
                            className={`px-6 ${getFeedbackButtonStyle('not_helpful')}`}
                        >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            No
                            {userFeedback === 'not_helpful' && <X className="ml-2 h-3 w-3" />}
                        </Button>
                    </div>

                    {showCounts && (helpfulCount > 0 || notHelpfulCount > 0) && (
                        <div className="mb-4">
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>{helpfulCount} helpful</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <ThumbsDown className="h-4 w-4" />
                                    <span>{notHelpfulCount} not helpful</span>
                                </div>
                            </div>
                            <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                    {getHelpfulnessPercentage()}% found this helpful
                                </Badge>
                            </div>
                        </div>
                    )}

                    {showComment && (
                        <div className="border-t pt-4">
                            {!showCommentForm ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCommentForm(true)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Leave a comment
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Tell us how we can improve this article..."
                                        className="w-full resize-none rounded-md border p-2 text-sm"
                                        rows={3}
                                    />
                                    <div className="flex items-center justify-end space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowCommentForm(false);
                                                setComment('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleComment} disabled={!comment.trim() || isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
