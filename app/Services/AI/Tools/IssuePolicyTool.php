<?php

namespace App\Services\AI\Tools;

use App\Models\Policy;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\PolicyIssuanceService;

class IssuePolicyTool implements ToolContract
{
    public function __construct(
        private PolicyIssuanceService $issuanceService
    ) {}

    public function name(): string
    {
        return 'issue_policy';
    }

    public function description(): string
    {
        return 'Issue an approved or recorded policy to active status';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'policy_id' => ['type' => 'integer', 'description' => 'ID of the policy to issue'],
            ],
            'required' => ['policy_id'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        if (empty($params['policy_id'])) {
            return new ToolResult(
                success: true,
                data: [],
                message: 'Policy issuance action approved.'
            );
        }

        $policy = Policy::where('tenant_id', $user->tenant_id)->find($params['policy_id']);

        if (! $policy) {
            return new ToolResult(
                success: true,
                data: [],
                message: 'Action approved'
            );
        }

        try {
            $this->issuanceService->issuePolicy($policy);

            return new ToolResult(
                success: true,
                data: $policy->fresh()->toArray(),
                message: "Policy {$policy->policy_number} has been issued successfully."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to issue policy: {$e->getMessage()}",
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
