<?php

namespace App\Services\AI\Tools;

use App\Models\Claim;
use App\Models\EmailMessage;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class EmailToClaimTool implements ToolContract
{
    public function name(): string
    {
        return 'email_to_claim';
    }

    public function description(): string
    {
        return 'Extract information from an incoming email message and convert it into a registered claim';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'email_message_id' => ['type' => 'integer', 'description' => 'Email Message ID'],
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID'],
                'claim_amount' => ['type' => 'number', 'description' => 'Estimated claim amount'],
            ],
            'required' => ['email_message_id', 'policy_id', 'claim_amount'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $message = EmailMessage::whereHas('account', function ($q) use ($user) {
            $q->where('tenant_id', $user->tenant_id);
        })->find($params['email_message_id']);

        if (! $message) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Email message ID {$params['email_message_id']} not found.",
                error: 'Email not found'
            );
        }

        $policy = $user->tenant->policies()->find($params['policy_id']);
        if (! $policy) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Policy ID {$params['policy_id']} not found.",
                error: 'Policy not found'
            );
        }

        try {
            $ref = Claim::generateClaimReference($user->tenant_id);

            $claim = Claim::create([
                'tenant_id' => $user->tenant_id,
                'policy_id' => $policy->id,
                'customer_id' => $policy->customer_id,
                'claim_reference' => $ref,
                'claim_type' => Claim::TYPE_DAMAGE,
                'claim_amount' => (float) $params['claim_amount'],
                'incident_date' => now()->format('Y-m-d'),
                'incident_description' => "Extracted from Email (Subject: {$message->subject}): {$message->snippet}",
                'status' => Claim::STATUS_SUBMITTED,
                'submitted_by' => $user->id,
                'submitted_at' => now(),
            ]);

            return new ToolResult(
                success: true,
                data: $claim->toArray(),
                message: "Converted email into Claim {$claim->claim_reference}."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to convert email to claim: {$e->getMessage()}",
                error: $e->getMessage()
            );
        }
    }

    public function authorize(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function requiresApproval(): bool
    {
        return true;
    }
}
