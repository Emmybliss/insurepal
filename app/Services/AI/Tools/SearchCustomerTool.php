<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class SearchCustomerTool implements ToolContract
{
    public function name(): string
    {
        return 'search_customer';
    }

    public function description(): string
    {
        return 'Search for customers by name, email, or phone number';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'query' => ['type' => 'string', 'description' => 'Search query (name, email, or phone)'],
                'limit' => ['type' => 'integer', 'description' => 'Max results to return', 'default' => 10],
            ],
            'required' => ['query'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $customers = $user->tenant->customers()
            ->where(function ($q) use ($params) {
                $q->where('first_name', 'like', "%{$params['query']}%")
                    ->orWhere('last_name', 'like', "%{$params['query']}%")
                    ->orWhere('email', 'like', "%{$params['query']}%")
                    ->orWhere('phone', 'like', "%{$params['query']}%");
            })
            ->limit($params['limit'] ?? 10)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone']);

        return new ToolResult(
            success: true,
            data: $customers->toArray(),
            message: "Found {$customers->count()} customer(s)",
        );
    }

    public function authorize(User $user): bool
    {
        return $user->can('view customers');
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
