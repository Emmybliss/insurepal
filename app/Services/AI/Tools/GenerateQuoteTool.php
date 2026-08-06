<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class GenerateQuoteTool implements ToolContract
{
    public function name(): string
    {
        return 'generate_quote';
    }

    public function description(): string
    {
        return 'Generate a new insurance quote for a customer';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'customer_id' => ['type' => 'integer', 'description' => 'Customer ID'],
                'product_id' => ['type' => 'integer', 'description' => 'Insurance product ID'],
                'sum_assured' => ['type' => 'number', 'description' => 'Sum assured amount'],
                'premium' => ['type' => 'number', 'description' => 'Premium amount'],
            ],
            'required' => ['customer_id', 'product_id', 'sum_assured', 'premium'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        if (empty($params['customer_id']) || empty($params['product_id'])) {
            return new ToolResult(
                success: true,
                data: [
                    'redirect' => '/broker-slips/create',
                    'action' => 'create_broker_slip',
                ],
                message: "I can help you create a **New Broker Placement Slip**!\n\n".
                         "Please choose how you would like to proceed:\n".
                         "- **[Open Broker Slip Form](/broker-slips/create)** (or [Direct Creation](/broker-slips/create-direct))\n".
                         '- Or reply with the **Customer ID**, **Product ID**, **Sum Assured**, and **Premium** to generate it right here.',
            );
        }

        $quote = $user->tenant->quotes()->create([
            'customer_id' => $params['customer_id'],
            'insurance_product_id' => $params['product_id'],
            'sum_assured' => $params['sum_assured'] ?? 0,
            'premium' => $params['premium'] ?? 0,
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        return new ToolResult(
            success: true,
            data: $quote->toArray(),
            message: "Broker Slip / Quote #{$quote->id} generated successfully!",
        );
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
