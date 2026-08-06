<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class CalculateCommissionTool implements ToolContract
{
    public function name(): string
    {
        return 'calculate_commission';
    }

    public function description(): string
    {
        return 'Calculate commission amount and net payable for a premium';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'premium_amount' => ['type' => 'number', 'description' => 'Gross premium amount'],
                'commission_rate' => ['type' => 'number', 'description' => 'Commission percentage rate (e.g., 10 for 10%)', 'default' => 10],
            ],
            'required' => ['premium_amount'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $premium = (float) $params['premium_amount'];
            $rate = (float) ($params['commission_rate'] ?? 10);
            $commission = $premium * ($rate / 100);
            $netPayable = $premium - $commission;

            return new ToolResult(
                success: true,
                data: [
                    'gross_premium' => $premium,
                    'commission_rate' => $rate,
                    'commission_amount' => $commission,
                    'net_payable' => $netPayable,
                ],
                message: "Commission at {$rate}%: ₦".number_format($commission, 2).' (Net Payable: ₦'.number_format($netPayable, 2).')'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Calculation failed: {$e->getMessage()}",
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
