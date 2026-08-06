<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class DraftQuoteResponseTool implements ToolContract
{
    public function name(): string
    {
        return 'draft_quote_response';
    }

    public function description(): string
    {
        return 'Draft a professional email reply containing quote details for a customer';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'quote_id' => ['type' => 'integer', 'description' => 'Quote ID to draft response for'],
            ],
            'required' => ['quote_id'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        $quote = $user->tenant->quotes()->with(['customer', 'insuranceProduct'])->find($params['quote_id']);

        if (! $quote) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Quote with ID {$params['quote_id']} not found.",
                error: 'Quote not found'
            );
        }

        $customerName = $quote->customer ? "{$quote->customer->first_name} {$quote->customer->last_name}" : 'Valued Customer';
        $productName = $quote->insuranceProduct?->name ?? 'Insurance Policy';

        $draftBody = "Dear {$customerName},\n\nThank you for requesting a quote for {$productName}.\n\n".
            "Quote Reference: {$quote->quote_number}\n".
            'Premium Amount: ₦'.number_format($quote->premium_amount, 2)."\n".
            'Valid Until: '.($quote->valid_until ? $quote->valid_until->format('Y-m-d') : 'N/A')."\n\n".
            "Please let us know if you have any questions or would like to proceed with policy issuance.\n\nBest regards,\n{$user->name}";

        return new ToolResult(
            success: true,
            data: [
                'to' => $quote->customer?->email ?? '',
                'subject' => "Insurance Quote Response - {$quote->quote_number}",
                'draft_body' => $draftBody,
            ],
            message: "Drafted quote response for Quote #{$quote->quote_number}."
        );
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
