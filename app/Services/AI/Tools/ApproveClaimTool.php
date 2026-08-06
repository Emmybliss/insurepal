<?php

namespace App\Services\AI\Tools;

use App\Models\Claim;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class ApproveClaimTool implements ToolContract
{
    public function name(): string
    {
        return 'approve_claim';
    }

    public function description(): string
    {
        return 'Approve a submitted claim and set approved payout amount';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'claim_id' => ['type' => 'integer', 'description' => 'Claim ID to approve'],
                'approved_amount' => ['type' => 'number', 'description' => 'Approved payout amount'],
                'notes' => ['type' => 'string', 'description' => 'Decision notes or comments'],
            ],
            'required' => ['claim_id', 'approved_amount'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $claim = Claim::where('tenant_id', $user->tenant_id)->find($params['claim_id']);

        if (! $claim) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Claim with ID {$params['claim_id']} not found.",
                error: 'Claim not found'
            );
        }

        try {
            $approvedAmount = (float) $params['approved_amount'];
            if ($claim->status === Claim::STATUS_SUBMITTED) {
                $claim->startReview($user);
            }

            $claim->approve($user, $approvedAmount, $params['notes'] ?? 'Approved via AI Copilot');

            return new ToolResult(
                success: true,
                data: $claim->fresh()->toArray(),
                message: "Claim {$claim->claim_reference} approved for ₦".number_format($approvedAmount, 2).'.'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to approve claim: {$e->getMessage()}",
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
