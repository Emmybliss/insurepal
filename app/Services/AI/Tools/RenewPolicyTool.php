<?php

namespace App\Services\AI\Tools;

use App\Models\Policy;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class RenewPolicyTool implements ToolContract
{
    public function name(): string
    {
        return 'renew_policy';
    }

    public function description(): string
    {
        return 'Renew an existing policy for another term';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'policy_id' => ['type' => 'integer', 'description' => 'ID of the policy to renew'],
                'months' => ['type' => 'integer', 'description' => 'Renewal duration in months', 'default' => 12],
            ],
            'required' => ['policy_id'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $policy = Policy::where('tenant_id', $user->tenant_id)->find($params['policy_id']);

        if (! $policy) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Policy with ID {$params['policy_id']} not found.",
                error: 'Policy not found'
            );
        }

        try {
            $months = $params['months'] ?? 12;
            $newExpiry = $policy->expiry_date ? $policy->expiry_date->addMonths($months) : now()->addMonths($months);

            $policy->update([
                'expiry_date' => $newExpiry,
                'status' => Policy::STATUS_ACTIVE,
            ]);

            return new ToolResult(
                success: true,
                data: $policy->fresh()->toArray(),
                message: "Policy {$policy->policy_number} extended until {$newExpiry->format('Y-m-d')}."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to renew policy: {$e->getMessage()}",
                error: $e->getMessage()
            );
        }
    }

    public function authorize(User $user): bool
    {
        return $user->is_active && $user->tenant_id !== null;
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
