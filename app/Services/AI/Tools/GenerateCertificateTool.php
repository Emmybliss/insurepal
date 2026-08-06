<?php

namespace App\Services\AI\Tools;

use App\Models\PolicyCertificate;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class GenerateCertificateTool implements ToolContract
{
    public function name(): string
    {
        return 'generate_certificate';
    }

    public function description(): string
    {
        return 'Generate an official insurance certificate for a policy';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID'],
                'certificate_type' => ['type' => 'string', 'description' => 'Type of certificate (policy_certificate, motor_certificate, marine_certificate)', 'default' => 'policy_certificate'],
            ],
            'required' => ['policy_id'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $policy = $user->tenant->policies()->find($params['policy_id']);

        if (! $policy) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Policy with ID {$params['policy_id']} not found.",
                error: 'Policy not found'
            );
        }

        try {
            $certNumber = PolicyCertificate::generateCertificateNumber($user->tenant_id, 'CERT');

            $certificate = PolicyCertificate::create([
                'tenant_id' => $user->tenant_id,
                'policy_id' => $policy->id,
                'certificate_number' => $certNumber,
                'type' => $params['certificate_type'] ?? 'policy_certificate',
                'status' => PolicyCertificate::STATUS_GENERATED,
                'generated_at' => now(),
                'generated_by' => $user->id,
                'certificate_data' => [
                    'policy_number' => $policy->policy_number_display,
                    'customer_name' => $policy->customer ? "{$policy->customer->first_name} {$policy->customer->last_name}" : 'N/A',
                    'effective_date' => $policy->start_date?->format('Y-m-d'),
                    'expiry_date' => $policy->expiry_date?->format('Y-m-d'),
                    'sum_insured' => $policy->sum_insured,
                ],
            ]);

            return new ToolResult(
                success: true,
                data: $certificate->toArray(),
                message: "Certificate {$certificate->certificate_number} generated for policy {$policy->policy_number_display}."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to generate certificate: {$e->getMessage()}",
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
        return false;
    }
}
