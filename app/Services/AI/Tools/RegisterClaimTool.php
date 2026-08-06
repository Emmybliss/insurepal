<?php

namespace App\Services\AI\Tools;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class RegisterClaimTool implements ToolContract
{
    public function name(): string
    {
        return 'register_claim';
    }

    public function description(): string
    {
        return 'Register a new insurance claim for a customer policy';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID'],
                'customer_id' => ['type' => 'integer', 'description' => 'Customer ID'],
                'claim_amount' => ['type' => 'number', 'description' => 'Claimed monetary amount'],
                'claim_type' => ['type' => 'string', 'description' => 'Type of claim (accident, health, theft, damage, fire, flood, medical, death, disability, liability, other)', 'default' => 'damage'],
                'incident_date' => ['type' => 'string', 'description' => 'Date of incident (YYYY-MM-DD)'],
                'incident_description' => ['type' => 'string', 'description' => 'Description of incident'],
                'incident_location' => ['type' => 'string', 'description' => 'Location of incident (optional)'],
            ],
            'required' => ['policy_id', 'customer_id', 'claim_amount', 'incident_description'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $policy = Policy::where('tenant_id', $user->tenant_id)->find($params['policy_id']);
        $customer = Customer::where('tenant_id', $user->tenant_id)->find($params['customer_id']);

        if (! $policy) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Policy with ID {$params['policy_id']} not found.",
                error: 'Policy not found'
            );
        }

        try {
            $ref = Claim::generateClaimReference($user->tenant_id);

            $claim = Claim::create([
                'tenant_id' => $user->tenant_id,
                'policy_id' => $policy->id,
                'customer_id' => $params['customer_id'],
                'claim_reference' => $ref,
                'claim_type' => $params['claim_type'] ?? Claim::TYPE_DAMAGE,
                'claim_amount' => (float) $params['claim_amount'],
                'incident_date' => $params['incident_date'] ?? now()->format('Y-m-d'),
                'incident_description' => $params['incident_description'],
                'incident_location' => $params['incident_location'] ?? null,
                'status' => Claim::STATUS_SUBMITTED,
                'submitted_by' => $user->id,
                'submitted_at' => now(),
            ]);

            return new ToolResult(
                success: true,
                data: $claim->toArray(),
                message: "Claim {$claim->claim_reference} for ₦".number_format($claim->claim_amount, 2).' registered successfully.'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to register claim: {$e->getMessage()}",
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
