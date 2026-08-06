<?php

namespace App\Services\AI\Tools;

use App\Models\EmailMessage;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class SummarizeEmailsTool implements ToolContract
{
    public function name(): string
    {
        return 'summarize_emails';
    }

    public function description(): string
    {
        return 'Fetch and summarize recent inbox emails or messages regarding renewals, quotes, or claims';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'query' => ['type' => 'string', 'description' => 'Optional filter term (e.g., renewal, quote, claim)'],
                'limit' => ['type' => 'integer', 'description' => 'Max number of emails to summarize', 'default' => 5],
            ],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $limit = $params['limit'] ?? 5;
            $query = EmailMessage::whereHas('account', function ($q) use ($user) {
                $q->where('tenant_id', $user->tenant_id);
            });

            if (! empty($params['query'])) {
                $searchTerm = $params['query'];
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('subject', 'like', "%{$searchTerm}%")
                        ->orWhere('body_text', 'like', "%{$searchTerm}%");
                });
            }

            $messages = $query->latest('received_at')->limit($limit)->get(['id', 'subject', 'from_address', 'received_at', 'snippet']);

            return new ToolResult(
                success: true,
                data: $messages->toArray(),
                message: "Retrieved {$messages->count()} email(s) for summary."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to fetch emails: {$e->getMessage()}",
                error: $e->getMessage()
            );
        }
    }

    public function authorize(User $user): bool
    {
        return true;
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
