<?php

namespace App\Services;

use App\Models\Subscription;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentReceiptService
{
    /**
     * Get raw receipt data for a subscription payment
     */
    public function getReceiptData(Subscription $subscription): array
    {
        $tenant = $subscription->tenant;
        $plan = $subscription->plan;
        $metadata = $subscription->metadata ?? [];

        return [
            'receipt_number' => 'RCP-'.strtoupper(substr(md5($subscription->id.now()), 0, 10)),
            'receipt_date' => now()->format('F d, Y'),
            'payment_date' => $subscription->created_at->format('F d, Y'),
            'payment_reference' => $metadata['payment_reference'] ?? 'N/A',

            // Company details (Insure Pal)
            'company_name' => 'InsurePal',
            'company_address' => 'Federal Capital Territory Abuja, Nigeria',
            'company_email' => 'support@insurepal.app',
            'company_phone' => '+234 816 966 8690',

            // Customer details
            'customer_name' => $tenant->company_name ?? $tenant->name,
            'customer_email' => $tenant->email,
            'customer_phone' => $tenant->phone,
            'customer_address' => $this->formatAddress($tenant),

            // Payment details
            'plan_name' => $plan?->name ?? 'Subscription Plan',
            'plan_description' => $plan?->description ?? '',
            'billing_cycle' => ucfirst($subscription->billing_cycle ?? $plan?->billing_cycle ?? 'monthly'),
            'amount' => (float) (
                ($metadata['payment_amount'] ?? null)
                ?: ($plan?->price ?? 0)
                ?: ($subscription->billing_cycle === 'yearly' ? 1200000.00 : 0) // Default fallback
            ),
            'currency' => ($metadata['payment_currency'] ?? null) ?: ($plan?->currency ?? 'NGN'),
            'payment_method' => ($metadata['payment_channel'] ?? null) ?: 'Online Payment',
            'card_type' => $metadata['card_type'] ?? null,
            'last4' => $metadata['last4'] ?? null,
            'bank' => $metadata['bank'] ?? null,

            // Period
            'period_start' => ($subscription->current_period_start ?? $subscription->created_at)->format('F d, Y'),
            'period_end' => ($subscription->current_period_end ?? $subscription->created_at)->format('F d, Y'),

            // Always use InsurePal logo for platform-generated receipts
            'logo_data' => $this->getLogoAsBase64(),

        ];

    }

    /**
     * Generate a PDF receipt for a subscription payment
     */
    public function generateReceipt(Subscription $subscription): \Illuminate\Http\Response
    {
        $receiptData = $this->getReceiptData($subscription);

        // Generate PDF
        $pdf = Pdf::loadView('pdfs.payment-receipt', $receiptData)
            ->setPaper('a4', 'portrait')
            ->setOptions(['dpi' => 96, 'defaultFont' => 'sans-serif', 'isPhpEnabled' => false]);

        return $pdf->download('receipt-'.$receiptData['receipt_number'].'.pdf');
    }

    /**
     * Format tenant address
     */
    protected function formatAddress($tenant): string
    {
        $parts = array_filter([
            $tenant->address,
            $tenant->city,
            $tenant->state,
            $tenant->country,
        ]);

        return implode(', ', $parts) ?: 'N/A';
    }

    /**
     * Get logo as base64 encoded data URL for DOMPDF embedding
     */
    protected function getLogoAsBase64(): ?string
    {
        $logoPath = public_path('images/insurepal-logo.png');

        if (! file_exists($logoPath)) {
            return null;
        }

        $mimeType = match (pathinfo($logoPath, PATHINFO_EXTENSION)) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'jpg', 'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            default => 'image/png',
        };

        $contents = file_get_contents($logoPath);
        if ($contents === false) {
            return null;
        }

        return 'data:'.$mimeType.';base64,'.base64_encode($contents);
    }
}
