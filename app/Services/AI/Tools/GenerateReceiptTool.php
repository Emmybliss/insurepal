<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\Finance\GenerateReceiptService;

class GenerateReceiptTool implements ToolContract
{
    public function __construct(
        private GenerateReceiptService $receiptService
    ) {}

    public function name(): string
    {
        return 'generate_receipt';
    }

    public function description(): string
    {
        return 'Generate a payment receipt for a policy, invoice, or customer payment';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'customer_id' => ['type' => 'integer', 'description' => 'Customer ID'],
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID (optional)'],
                'invoice_id' => ['type' => 'integer', 'description' => 'Invoice ID (optional)'],
                'amount_paid' => ['type' => 'number', 'description' => 'Amount paid'],
                'payment_method' => ['type' => 'string', 'description' => 'Payment method (bank_transfer, cash, cheque, online, card)', 'default' => 'bank_transfer'],
                'transaction_id' => ['type' => 'string', 'description' => 'Transaction ID / payment reference (optional)'],
                'notes' => ['type' => 'string', 'description' => 'Receipt notes (optional)'],
            ],
            'required' => ['customer_id', 'amount_paid'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $customer = $user->tenant->customers()->find($params['customer_id']);

        if (! $customer) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Customer with ID {$params['customer_id']} not found.",
                error: 'Customer not found'
            );
        }

        try {
            $amount = (float) $params['amount_paid'];
            $data = [
                'customer_id' => $customer->id,
                'policy_id' => $params['policy_id'] ?? null,
                'invoice_id' => $params['invoice_id'] ?? null,
                'amount_paid' => $amount,
                'payment_method' => $params['payment_method'] ?? 'bank_transfer',
                'payment_date' => now()->format('Y-m-d'),
                'transaction_id' => $params['transaction_id'] ?? null,
                'notes' => $params['notes'] ?? 'Receipt generated via AI Copilot',
                'currency' => 'NGN',
            ];

            $receipt = $this->receiptService->generate($data, $user->tenant_id, $user->id);

            return new ToolResult(
                success: true,
                data: $receipt->toArray(),
                message: "Receipt {$receipt->receipt_number} for ₦".number_format($amount, 2).' generated successfully.'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to generate receipt: {$e->getMessage()}",
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
