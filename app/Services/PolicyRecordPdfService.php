<?php

namespace App\Services;

use App\Models\Policy;
use App\Models\User;
use App\Services\Documents\HtmlTemplatePdfGenerator;
use App\Services\Pdf\PdfService;
use Carbon\Carbon;

class PolicyRecordPdfService
{
    public function __construct(
        protected HtmlTemplatePdfGenerator $htmlTemplatePdfGenerator,
        protected PdfService $pdfService
    ) {}

    /**
     * Map Policy model data into structured payload for PDF generation.
     */
    public function mapPayload(Policy $policy, ?User $user = null): array
    {
        $policy->loadMissing([
            'customer',
            'policyProduct',
            'policyType',
            'policyClass',
            'createdBy',
            'approvedBy',
            'issuedBy',
            'brokerTenant',
            'debitNotes',
            'creditNotes',
            'invoices',
            'receipts',
            'amendments',
            'documents',
            'quote',
            'tenant',
        ]);

        $effectiveDate = $policy->effective_date ? Carbon::parse($policy->effective_date) : null;
        $expiryDate = $policy->expiry_date ? Carbon::parse($policy->expiry_date) : null;
        $durationDays = ($effectiveDate && $expiryDate) ? $effectiveDate->diffInDays($expiryDate) : 0;

        $grossPremium = (float) ($policy->premium_amount ?? 0);
        $commissionAmount = (float) ($policy->commission_amount ?? 0);
        $commissionRate = $policy->commission_rate ?? ($grossPremium > 0 ? round(($commissionAmount / $grossPremium) * 100, 2) : 0);
        $netPremium = $policy->net_premium ?? ($grossPremium - $commissionAmount);

        // Sum paid receipts/notes
        $totalPaid = 0.0;
        if ($policy->receipts) {
            $totalPaid += (float) $policy->receipts->where('status', 'completed')->sum('amount_paid');
        }

        $outstandingBalance = max(0.0, $grossPremium - $totalPaid);

        // Extract risks schedule if available
        $risksSchedule = [];
        if (is_array($policy->coverage_details)) {
            $risksSchedule = $policy->coverage_details['risks']
                ?? $policy->coverage_details['items']
                ?? $policy->coverage_details['schedule']
                ?? [];
        }

        // Build chronological timeline events
        $timeline = [];

        if ($policy->created_at) {
            $timeline[] = [
                'date' => Carbon::parse($policy->created_at)->format('Y-m-d H:i'),
                'title' => 'Policy Record Created',
                'description' => 'Policy created by '.($policy->createdBy?->name ?? 'System'),
            ];
        }

        if ($policy->approved_at) {
            $timeline[] = [
                'date' => Carbon::parse($policy->approved_at)->format('Y-m-d H:i'),
                'title' => 'Policy Approved',
                'description' => 'Policy approved by '.($policy->approvedBy?->name ?? 'Underwriter'),
            ];
        }

        if ($policy->issued_at) {
            $timeline[] = [
                'date' => Carbon::parse($policy->issued_at)->format('Y-m-d H:i'),
                'title' => 'Policy Formally Issued',
                'description' => 'Policy issued by '.($policy->issuedBy?->name ?? 'System'),
            ];
        }

        if ($policy->debitNotes) {
            foreach ($policy->debitNotes as $dn) {
                $timeline[] = [
                    'date' => Carbon::parse($dn->created_at)->format('Y-m-d H:i'),
                    'title' => "Debit Note Issued (#{$dn->note_number})",
                    'description' => "Amount: {$policy->currency} ".number_format((float) $dn->amount, 2),
                ];
            }
        }

        if ($policy->creditNotes) {
            foreach ($policy->creditNotes as $cn) {
                $timeline[] = [
                    'date' => Carbon::parse($cn->created_at)->format('Y-m-d H:i'),
                    'title' => "Credit Note Generated (#{$cn->note_number})",
                    'description' => "Amount: {$policy->currency} ".number_format((float) $cn->amount, 2),
                ];
            }
        }

        if ($policy->receipts) {
            foreach ($policy->receipts as $rc) {
                $timeline[] = [
                    'date' => Carbon::parse($rc->created_at)->format('Y-m-d H:i'),
                    'title' => "Payment Received (#{$rc->receipt_number})",
                    'description' => "Paid: {$policy->currency} ".number_format((float) $rc->amount_paid, 2),
                ];
            }
        }

        if ($policy->amendments) {
            foreach ($policy->amendments as $am) {
                $timeline[] = [
                    'date' => Carbon::parse($am->created_at)->format('Y-m-d H:i'),
                    'title' => "Policy Endorsement / Amendment (#{$am->amendment_number})",
                    'description' => "Reason: {$am->amendment_reason}",
                ];
            }
        }

        // Sort timeline chronologically
        usort($timeline, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return [
            'policy_id' => $policy->id,
            'policy_number' => $policy->policy_number ?? 'N/A',
            'policy_number_display' => $policy->policy_number_display ?? $policy->policy_number ?? 'N/A',
            'internal_reference' => $policy->internal_reference ?? 'N/A',
            'status' => $policy->status ?? 'draft',
            'approval_status' => $policy->approval_status ?? 'not_required',
            'source_type' => $policy->source_type ?? 'N/A',

            'product_name' => $policy->policyProduct?->name ?? 'N/A',
            'product_code' => $policy->policyProduct?->code ?? 'N/A',
            'policy_type_name' => $policy->policyType?->name ?? 'N/A',
            'policy_class_name' => $policy->policyClass?->name ?? 'N/A',
            'tenant_name' => $policy->tenant?->name ?? 'N/A',

            'insurer_name' => $policy->insurer_name ?? $policy->tenant?->name ?? 'N/A',
            'broker_name' => $policy->brokerTenant?->name ?? ($policy->isBrokerRecorded() ? ($policy->tenant?->name ?? 'N/A') : 'N/A'),

            'effective_date' => $effectiveDate ? $effectiveDate->format('d M Y') : 'N/A',
            'expiry_date' => $expiryDate ? $expiryDate->format('d M Y') : 'N/A',
            'duration_days' => $durationDays,
            'payment_frequency' => $policy->payment_frequency ?? 'annual',

            // Customer Info
            'customer_name' => $policy->customer ? $policy->customer->display_name : 'N/A',
            'customer_code' => $policy->customer?->customer_code ?? 'N/A',
            'customer_type' => $policy->customer?->type ?? 'individual',
            'customer_email' => $policy->customer?->email ?? 'N/A',
            'customer_phone' => $policy->customer?->phone ?? 'N/A',
            'customer_address' => $policy->customer?->address ?? 'N/A',
            'customer_city' => $policy->customer?->city ?? 'N/A',
            'customer_state' => $policy->customer?->state ?? 'N/A',
            'customer_country' => $policy->customer?->country ?? 'Nigeria',
            'customer_tin' => $policy->customer?->tax_identification_number ?? 'N/A',

            // Financial Info
            'currency' => $policy->currency ?? 'NGN',
            'sum_insured' => (float) ($policy->sum_insured ?? 0),
            'gross_premium' => $grossPremium,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'tax_amount' => 0.0,
            'net_premium' => $netPremium,
            'total_paid' => $totalPaid,
            'outstanding_balance' => $outstandingBalance,

            // Lists & Schedules
            'risks_schedule' => $risksSchedule,
            'coverage_description' => is_array($policy->coverage_details)
                ? ($policy->coverage_details['description'] ?? json_encode($policy->coverage_details))
                : ($policy->coverage_details ?? 'N/A'),
            'policy_notes' => $policy->notes ?? $policy->internal_notes ?? 'N/A',

            'debit_notes' => $policy->debitNotes ? $policy->debitNotes->toArray() : [],
            'credit_notes' => $policy->creditNotes ? $policy->creditNotes->toArray() : [],
            'receipts' => $policy->receipts ? $policy->receipts->toArray() : [],
            'amendments' => $policy->amendments ? $policy->amendments->toArray() : [],
            'documents' => $policy->documents ? $policy->documents->toArray() : [],

            // Audit
            'created_by_name' => $policy->createdBy?->name ?? 'N/A',
            'created_at' => $policy->created_at ? Carbon::parse($policy->created_at)->format('d M Y H:i') : 'N/A',
            'approved_by_name' => $policy->approvedBy?->name ?? 'N/A',
            'approved_at' => $policy->approved_at ? Carbon::parse($policy->approved_at)->format('d M Y H:i') : 'N/A',
            'issued_by_name' => $policy->issuedBy?->name ?? 'N/A',
            'issued_at' => $policy->issued_at ? Carbon::parse($policy->issued_at)->format('d M Y H:i') : 'N/A',
            'generated_by' => $user?->name ?? auth()->user()?->name ?? 'System User',
            'generated_at' => now()->format('d M Y H:i:s'),

            'timeline' => $timeline,
        ];
    }

    /**
     * Generate raw PDF binary stream for the given Policy.
     */
    public function generatePdf(Policy $policy, ?User $user = null): string
    {
        $payload = $this->mapPayload($policy, $user);

        return $this->htmlTemplatePdfGenerator->generateOutput(
            $policy->tenant,
            'policy_record.classic',
            $payload
        );
    }

    /**
     * Render the Blade HTML string for preview or testing.
     */
    public function renderHtml(Policy $policy, ?User $user = null, bool $isPreview = true): string
    {
        $payload = $this->mapPayload($policy, $user);

        return $this->htmlTemplatePdfGenerator->renderHtml(
            $policy->tenant,
            'policy_record.classic',
            $payload,
            isPreview: $isPreview
        );
    }
}
