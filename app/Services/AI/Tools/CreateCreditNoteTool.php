<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\CreditNoteService;

class CreateCreditNoteTool implements ToolContract
{
    public function __construct(
        private CreditNoteService $creditNoteService
    ) {}

    public function name(): string
    {
        return 'create_credit_note';
    }

    public function description(): string
    {
        return 'Create a credit note for a customer or policy refund/reversal';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'customer_id' => ['type' => 'integer', 'description' => 'Customer ID'],
                'debit_note_id' => ['type' => 'integer', 'description' => 'Related Debit Note ID (optional)'],
                'policy_id' => ['type' => 'integer', 'description' => 'Policy ID (optional)'],
                'amount' => ['type' => 'number', 'description' => 'Credit amount'],
                'description' => ['type' => 'string', 'description' => 'Reason or description for credit note'],
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
            $data = [
                'customer_id' => $customer->id,
                'policy_id' => $params['policy_id'] ?? null,
                'debit_note_id' => $params['debit_note_id'] ?? null,
                'amount' => $amount,
                'total_amount' => $amount,
                'description' => $params['description'] ?? "Credit note for {$customer->first_name} {$customer->last_name}",
                'issue_date' => now()->format('Y-m-d'),
            ];

            $creditNote = $this->creditNoteService->create($data, $user->tenant_id, $user->id);

            return new ToolResult(
                success: true,
                data: $creditNote->toArray(),
                message: "Credit Note {$creditNote->note_number} for ₦".number_format($amount, 2).' created successfully.'
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to create credit note: {$e->getMessage()}",
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
