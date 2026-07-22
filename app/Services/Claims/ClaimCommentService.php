<?php

namespace App\Services\Claims;

use App\Models\Claim;
use App\Models\ClaimComment;
use App\Models\User;

class ClaimCommentService
{
    public function addComment(Claim $claim, User $user, array $data): ClaimComment
    {
        $comment = $claim->comments()->create([
            'author_id' => $user->id,
            'body' => $data['body'],
            'is_internal' => $data['is_internal'] ?? false,
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        $claim->logActivity($user, 'comment_added', 'Comment added to claim');

        return $comment->load('author');
    }

    public function updateComment(ClaimComment $comment, User $user, array $data): ClaimComment
    {
        $comment->update([
            'body' => $data['body'],
            'is_internal' => $data['is_internal'] ?? $comment->is_internal,
        ]);

        $comment->claim->logActivity($user, 'comment_updated', 'Comment updated on claim');

        return $comment->fresh()->load('author');
    }

    public function deleteComment(ClaimComment $comment, User $user): void
    {
        $comment->claim->logActivity($user, 'comment_deleted', 'Comment deleted from claim');

        $comment->delete();
    }
}
