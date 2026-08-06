<?php

namespace App\Services\AI\Tools;

use App\Models\Customer;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\DebitNoteService;

class CreateDebitNoteTool implements ToolContract
{
    public function __construct(
        private DebitNoteService $debitNoteService
    ) {}

    public function name(): string
    {
        return 'create_debit_note';
    }

    public function description(): string
    {
        return 'Create a debit note for a customer or policy';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'customer_id' => ['type' => 'integer', 'description' => 'Customer ID'],
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID (optional)'],
                'amount' => ['type' => 'number', 'description' => 'Gross premium / debit amount'],
                'description' => ['type' => 'string', 'description' => 'Description or reason for debit note'],
                'due_date' => ['type' => 'string', 'description' => 'Due date (YYYY-MM-DD)'],
            ],
            'required' => ['customer_id', 'amount'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $customer = Customer::where('tenant_id', $user->tenant_id)->find($params['customer_id']);

        if (! $customer) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Customer with ID {$params['customer_id']} not found.",
                error: 'Customer not found'
            );
        }

        try {
            $amount = (float) $params['amount'];
            $customerName = trim(($customer->first_name ?? '').' '.($customer->last_name ?? '')) ?: ($customer->company_name ?? 'Customer');

            $data = [
                'customer_id' => $customer->id,
                'policy_id' => $params['policy_id'] ?? null,
                'amount' => $amount,
                'total_amount' => $amount,
                'description' => $params['description'] ?? "Debit note for {$customerName}",
                'due_date' => $params['due_date'] ?? now()->addDays(30)->format('Y-m-d'),
                'issue_date' => now()->format('Y-m-d'),
            ];

            $debitNote = $this->debitNoteService->create($data, $user->tenant_id, $user->id);

            return new ToolResult(
                success: true,
                data: $debitNote->toArray(),
                message: "Debit Note {$debitNote->note_number} for ₦".number_format($amount, 2).' created successfully.'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to create debit note: {$e->getMessage()}",
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
