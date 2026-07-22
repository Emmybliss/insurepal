<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class SearchPolicyTool implements ToolContract
{
    public function name(): string
    {
        return 'search_policy';
    }

    public function description(): string
    {
        return 'Search for policies by policy number or customer name';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'query' => ['type' => 'string', 'description' => 'Search query (policy number or customer name)'],
                'status' => ['type' => 'string', 'description' => 'Filter by status (draft, active, expired, cancelled)'],
                'limit' => ['type' => 'integer', 'default' => 10],
            ],
            'required' => ['query'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $query = $user->tenant->policies()
            ->with('customer:id,first_name,last_name')
            ->where(function ($q) use ($params) {
                $q->where('policy_number', 'like', "%{$params['query']}%")
                    ->orWhereHas('customer', function ($cq) use ($params) {
                        $cq->where('first_name', 'like', "%{$params['query']}%")
                            ->orWhere('last_name', 'like', "%{$params['query']}%");
                    });
            });

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $policies = $query->limit($params['limit'] ?? 10)
            ->get(['id', 'policy_number', 'status', 'customer_id', 'premium_amount', 'start_date', 'expiry_date']);

        return new ToolResult(
            success: true,
            data: $policies->toArray(),
            message: "Found {$policies->count()} policy/policies",
        );
    }

    public function authorize(User $user): bool
    {
        return $user->can('view policies');
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
