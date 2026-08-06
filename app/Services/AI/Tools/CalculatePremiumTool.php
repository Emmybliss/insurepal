<?php

namespace App\Services\AI\Tools;

use App\Models\InsuranceProduct;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class CalculatePremiumTool implements ToolContract
{
    public function name(): string
    {
        return 'calculate_premium';
    }

    public function description(): string
    {
        return 'Calculate estimated premium and commission for a sum insured or coverage specification';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'sum_insured' => ['type' => 'number', 'description' => 'Total sum insured / value'],
                'product_id' => ['type' => 'integer', 'description' => 'Insurance product ID (optional)'],
                'rate_percentage' => ['type' => 'number', 'description' => 'Rate percentage (optional, e.g. 2.5 for 2.5%)', 'default' => 2.5],
            ],
            'required' => ['sum_insured'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $sumInsured = (float) $params['sum_insured'];
            $rate = (float) ($params['rate_percentage'] ?? 2.5);

            if (! empty($params['product_id'])) {
                $product = InsuranceProduct::find($params['product_id']);
                if ($product && isset($product->base_premium) && $product->base_premium > 0) {
                    $premium = max($product->base_premium, ($sumInsured * ($rate / 100)));
                } else {
                    $premium = $sumInsured * ($rate / 100);
                }
            } else {
                $premium = $sumInsured * ($rate / 100);
            }

            $commissionRate = 10.0; // 10% standard default
            $commission = $premium * ($commissionRate / 100);
            $netPremium = $premium - $commission;

            return new ToolResult(
                success: true,
                data: [
                    'sum_insured' => $sumInsured,
                    'rate_percentage' => $rate,
                    'gross_premium' => $premium,
                    'commission_amount' => $commission,
                    'net_premium' => $netPremium,
                ],
                message: 'Calculated Premium: ₦'.number_format($premium, 2)." (Rate: {$rate}%, Sum Insured: ₦".number_format($sumInsured, 2).')'
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
