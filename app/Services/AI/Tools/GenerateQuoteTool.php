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
        $quote = $user->tenant->quotes()->create([
            'customer_id' => $params['customer_id'],
            'insurance_product_id' => $params['product_id'],
            'sum_assured' => $params['sum_assured'],
            'premium' => $params['premium'],
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        return new ToolResult(
            success: true,
            data: $quote->toArray(),
            message: "Quote #{$quote->id} generated successfully",
        );
    }

    public function authorize(User $user): bool
    {
        return $user->can('create quotes');
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
