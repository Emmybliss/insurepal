<?php

namespace App\Services\AI\Tools;

use App\Models\Policy;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class CancelPolicyTool implements ToolContract
{
    public function name(): string
    {
        return 'cancel_policy';
    }

    public function description(): string
    {
        return 'Cancel an active or pending policy with a specified reason';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'policy_id' => ['type' => 'integer', 'description' => 'ID of the policy to cancel'],
                'reason' => ['type' => 'string', 'description' => 'Reason for policy cancellation'],
            ],
            'required' => ['policy_id', 'reason'],
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
            $policy->update([
                'status' => Policy::STATUS_CANCELLED,
                'cancellation_reason' => $params['reason'],
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
            ]);

            return new ToolResult(
                success: true,
                data: $policy->fresh()->toArray(),
                message: "Policy {$policy->policy_number} has been cancelled."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to cancel policy: {$e->getMessage()}",
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
        return true;
    }
}
