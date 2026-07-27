@extends('pdf.layouts.master')

@section('title', 'Policy Record - ' . ($payload['policy_number_display'] ?? $payload['policy_number'] ?? 'Record'))

@section('content')
<style>
    /* Styling adjustments specifically for Policy Record Report */
    .report-title-container {
        border-bottom: 2px solid {{ $branding['primary_color'] ?? '#0f172a' }};
        padding-bottom: 12px;
        margin-bottom: 20px;
    }

    .report-title {
        font-size: 20px;
        font-weight: 700;
        color: {{ $branding['primary_color'] ?? '#0f172a' }};
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 6px 0;
    }

    .report-subtitle {
        font-size: 10px;
        color: #64748b;
        margin: 0;
    }

    .section-header {
        background-color: {{ $branding['primary_color'] ?? '#0f172a' }};
        color: #ffffff;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 18px;
        margin-bottom: 10px;
        border-radius: 2px;
    }

    .info-grid {
        display: table;
        width: 100%;
        margin-bottom: 10px;
        border-spacing: 0;
    }

    .info-row {
        display: table-row;
    }

    .info-cell {
        display: table-cell;
        padding: 5px 8px;
        font-size: 10px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
    }

    .info-label {
        font-weight: 600;
        color: #475569;
        width: 30%;
    }

    .info-value {
        color: #0f172a;
        width: 70%;
    }

    .two-col-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }

    .two-col-table td {
        width: 50%;
        vertical-align: top;
        padding: 0 6px;
    }

    .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .status-active { background-color: #dcfce7; color: #15803d; }
    .status-expired { background-color: #fee2e2; color: #b91c1c; }
    .status-draft { background-color: #f1f5f9; color: #475569; }
    .status-pending { background-color: #fef3c7; color: #b45309; }

    .financial-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 12px;
        margin-top: 10px;
        margin-bottom: 15px;
    }

    .financial-table {
        width: 100%;
        border-collapse: collapse;
    }

    .financial-table td {
        padding: 4px 8px;
        font-size: 10px;
    }

    .financial-table .total-row td {
        border-top: 2px solid {{ $branding['primary_color'] ?? '#0f172a' }};
        font-weight: 700;
        font-size: 12px;
        color: {{ $branding['primary_color'] ?? '#0f172a' }};
        padding-top: 6px;
        padding-bottom: 6px;
    }

    .timeline-item {
        padding: 6px 10px;
        border-left: 3px solid {{ $branding['primary_color'] ?? '#0f172a' }};
        margin-left: 6px;
        margin-bottom: 8px;
        background: #f8fafc;
    }

    .timeline-date {
        font-size: 9px;
        font-weight: 700;
        color: #64748b;
    }

    .timeline-title {
        font-size: 10px;
        font-weight: 600;
        color: #0f172a;
    }

    .timeline-desc {
        font-size: 9px;
        color: #334155;
    }
</style>

<!-- Top Header Section -->
<div class="report-title-container avoid-break ">
    <div class="flex justify-between items-start">
        <div>
            <h1 class="report-title">{{ $labels['title_label'] ?? 'POLICY RECORD SUMMARY' }}</h1>
            <p class="report-subtitle">Official Insurance Policy Summary & Master Audit Log</p>
        </div>
        <div class="text-right">
            <span class="status-badge status-{{ strtolower($payload['status'] ?? 'draft') }}">
                {{ strtoupper(str_replace('_', ' ', $payload['status'] ?? 'DRAFT')) }}
            </span>
            <p style="font-size: 9px; color: #64748b; margin-top: 4px;">
                Generated: {{ $payload['generated_at'] ?? now()->format('Y-m-d H:i:s') }}
            </p>
        </div>
    </div>
</div>

<!-- 1. Policy Overview & Customer Info (Side-by-Side) -->
<table class="two-col-table avoid-break">
    <tr>
        <!-- Left: Policy Overview -->
        <td style="padding-left: 0;">
            <div class="section-header" style="margin-top: 0;">1. Policy Overview</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell info-label">Policy Number:</div>
                    <div class="info-cell info-value font-bold">{{ $payload['policy_number_display'] ?? $payload['policy_number'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Internal Ref:</div>
                    <div class="info-cell info-value">{{ $payload['internal_reference'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Product Name:</div>
                    <div class="info-cell info-value">{{ $payload['product_name'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Policy Type / Class:</div>
                    <div class="info-cell info-value">{{ $payload['policy_type_name'] ?? 'N/A' }} / {{ $payload['policy_class_name'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Underwriter:</div>
                    <div class="info-cell info-value">{{ $payload['insurer_name'] ?? $payload['tenant_name'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Broker Name:</div>
                    <div class="info-cell info-value">{{ $payload['broker_name'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Coverage Period:</div>
                    <div class="info-cell info-value">{{ $payload['effective_date'] ?? 'N/A' }} to {{ $payload['expiry_date'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Duration:</div>
                    <div class="info-cell info-value">{{ $payload['duration_days'] ?? 'N/A' }} Days</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Payment Frequency:</div>
                    <div class="info-cell info-value">{{ ucfirst(str_replace('_', ' ', $payload['payment_frequency'] ?? 'N/A')) }}</div>
                </div>
            </div>
        </td>

        <!-- Right: Customer Information -->
        <td style="padding-right: 0;">
            <div class="section-header" style="margin-top: 0;">2. Customer Information</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell info-label">Customer Name:</div>
                    <div class="info-cell info-value font-bold">{{ $payload['customer_name'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Customer Code:</div>
                    <div class="info-cell info-value">{{ $payload['customer_code'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Account Type:</div>
                    <div class="info-cell info-value">{{ ucfirst($payload['customer_type'] ?? 'Individual') }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Email Address:</div>
                    <div class="info-cell info-value">{{ $payload['customer_email'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Phone Number:</div>
                    <div class="info-cell info-value">{{ $payload['customer_phone'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Street Address:</div>
                    <div class="info-cell info-value">{{ $payload['customer_address'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">City / State:</div>
                    <div class="info-cell info-value">{{ $payload['customer_city'] ?? 'N/A' }}, {{ $payload['customer_state'] ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Tax ID / TIN:</div>
                    <div class="info-cell info-value">{{ $payload['customer_tin'] ?? 'N/A' }}</div>
                </div>
            </div>
        </td>
    </tr>
</table>

<!-- 3. Insurance Details & Coverage Terms -->
<div class="avoid-break">
    <div class="section-header">3. Insurance & Risk Details</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-cell info-label" style="width: 20%;">Sum Insured:</div>
            <div class="info-cell info-value font-bold" style="width: 80%;">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['sum_insured'] ?? 0), 2) }}</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label" style="width: 20%;">Coverage Terms:</div>
            <div class="info-cell info-value" style="width: 80%;">{{ $payload['coverage_description'] ?? $payload['coverage_summary'] ?? 'Standard terms as per policy schedule.' }}</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label" style="width: 20%;">Special Conditions:</div>
            <div class="info-cell info-value" style="width: 80%;">{{ $payload['policy_notes'] ?? 'None specified.' }}</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label" style="width: 20%;">Territory:</div>
            <div class="info-cell info-value" style="width: 80%;">{{ $payload['territory'] ?? 'Nigeria (Federal Republic)' }}</div>
        </div>
    </div>
</div>

<!-- 4. Risk Schedule -->
@if(!empty($payload['risks_schedule']) && count($payload['risks_schedule']) > 0)
<div class="avoid-break">
    <div class="section-header">4. Risk Schedule</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 30%;">Item / Property / Insured Risk</th>
                <th style="width: 25%;">Category / Description</th>
                <th style="width: 20%; text-align: right;">Sum Insured ({{ $payload['currency'] ?? 'NGN' }})</th>
                <th style="width: 20%; text-align: right;">Premium ({{ $payload['currency'] ?? 'NGN' }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['risks_schedule'] as $index => $risk)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td class="font-semibold">{{ $risk['item_name'] ?? $risk['risk_name'] ?? 'Insured Item' }}</td>
                <td>{{ $risk['description'] ?? $risk['category'] ?? 'N/A' }}</td>
                <td class="text-right">{{ number_format((float)($risk['sum_insured'] ?? 0), 2) }}</td>
                <td class="text-right">{{ number_format((float)($risk['premium'] ?? 0), 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 5. Financial Summary & Breakdown -->
<div class="avoid-break">
    <div class="section-header">5. Financial Summary</div>
    <div class="financial-box">
        <table class="financial-table">
            <tr>
                <td class="font-semibold" style="width: 60%;">Sum Insured Amount:</td>
                <td class="text-right font-bold" style="width: 40%;">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['sum_insured'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Gross Premium:</td>
                <td class="text-right">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['gross_premium'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Commission Rate & Amount:</td>
                <td class="text-right">({{ $payload['commission_rate'] ?? 0 }}%) - {{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['commission_amount'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Taxes / Statutory Levies:</td>
                <td class="text-right">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['tax_amount'] ?? 0), 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Net Premium Payable:</td>
                <td class="text-right">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['net_premium'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Total Amount Paid to Date:</td>
                <td class="text-right font-semibold text-primary">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['total_paid'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Outstanding Balance:</td>
                <td class="text-right font-bold" style="color: {{ ($payload['outstanding_balance'] ?? 0) > 0 ? '#b91c1c' : '#15803d' }};">
                    {{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['outstanding_balance'] ?? 0), 2) }}
                </td>
            </tr>
        </table>
    </div>
</div>

<!-- 6. Debit Notes & Financial Records -->
@if(!empty($payload['debit_notes']) && count($payload['debit_notes']) > 0)
<div class="avoid-break">
    <div class="section-header">6. Debit Notes</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th>Note Number</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th style="text-align: right;">Amount ({{ $payload['currency'] ?? 'NGN' }})</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['debit_notes'] as $dn)
            <tr>
                <td class="font-semibold">{{ $dn['note_number'] }}</td>
                <td>{{ $dn['issue_date'] ?? 'N/A' }}</td>
                <td>{{ $dn['due_date'] ?? 'N/A' }}</td>
                <td class="text-right">{{ number_format((float)($dn['amount'] ?? 0), 2) }}</td>
                <td><span class="status-badge status-{{ strtolower($dn['status'] ?? 'draft') }}">{{ strtoupper($dn['status'] ?? 'DRAFT') }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 7. Credit Notes -->
@if(!empty($payload['credit_notes']) && count($payload['credit_notes']) > 0)
<div class="avoid-break">
    <div class="section-header">7. Credit Notes</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th>Note Number</th>
                <th>Issue Date</th>
                <th>Description / Reason</th>
                <th style="text-align: right;">Amount ({{ $payload['currency'] ?? 'NGN' }})</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['credit_notes'] as $cn)
            <tr>
                <td class="font-semibold">{{ $cn['note_number'] }}</td>
                <td>{{ $cn['created_at'] ?? 'N/A' }}</td>
                <td>{{ $cn['description'] ?? 'Credit adjustment' }}</td>
                <td class="text-right">{{ number_format((float)($cn['amount'] ?? 0), 2) }}</td>
                <td><span class="status-badge status-{{ strtolower($cn['status'] ?? 'draft') }}">{{ strtoupper($cn['status'] ?? 'DRAFT') }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 8. Payment & Receipt History -->
@if(!empty($payload['receipts']) && count($payload['receipts']) > 0)
<div class="avoid-break">
    <div class="section-header">8. Receipts & Payment Records</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th>Receipt Number</th>
                <th>Payment Date</th>
                <th>Method</th>
                <th style="text-align: right;">Amount Paid ({{ $payload['currency'] ?? 'NGN' }})</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['receipts'] as $rc)
            <tr>
                <td class="font-semibold">{{ $rc['receipt_number'] }}</td>
                <td>{{ $rc['payment_date'] ?? 'N/A' }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $rc['payment_method'] ?? 'N/A')) }}</td>
                <td class="text-right font-semibold">{{ number_format((float)($rc['amount_paid'] ?? 0), 2) }}</td>
                <td><span class="status-badge status-{{ strtolower($rc['status'] ?? 'completed') }}">{{ strtoupper($rc['status'] ?? 'COMPLETED') }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 9. Commission Summary -->
<div class="avoid-break">
    <div class="section-header">9. Commission Summary</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-cell info-label">Commission Rate:</div>
            <div class="info-cell info-value">{{ $payload['commission_rate'] ?? 0 }}%</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Total Commission Amount:</div>
            <div class="info-cell info-value font-bold">{{ $payload['currency'] ?? 'NGN' }} {{ number_format((float)($payload['commission_amount'] ?? 0), 2) }}</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Broker / Intermediary:</div>
            <div class="info-cell info-value">{{ $payload['broker_name'] ?? 'Direct / N/A' }}</div>
        </div>
    </div>
</div>

<!-- 10. Policy Amendments History -->
@if(!empty($payload['amendments']) && count($payload['amendments']) > 0)
<div class="avoid-break">
    <div class="section-header">10. Policy Amendments & Endorsements</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th>Amendment Ref</th>
                <th>Type</th>
                <th>Effective Date</th>
                <th>Reason</th>
                <th style="text-align: right;">Adjustment</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['amendments'] as $am)
            <tr>
                <td class="font-semibold">{{ $am['amendment_number'] }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $am['amendment_type'] ?? 'N/A')) }}</td>
                <td>{{ $am['effective_date'] ?? 'N/A' }}</td>
                <td>{{ $am['amendment_reason'] ?? 'N/A' }}</td>
                <td class="text-right">{{ number_format((float)($am['premium_adjustment'] ?? 0), 2) }}</td>
                <td><span class="status-badge status-{{ strtolower($am['status'] ?? 'draft') }}">{{ strtoupper($am['status'] ?? 'DRAFT') }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 11. Documents & Attachments -->
@if(!empty($payload['documents']) && count($payload['documents']) > 0)
<div class="avoid-break">
    <div class="section-header">11. Documents & Attachments</div>
    <table class="modern-table">
        <thead>
            <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Uploaded Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payload['documents'] as $doc)
            <tr>
                <td class="font-semibold">{{ $doc['document_name'] ?? $doc['file_name'] }}</td>
                <td>{{ ucfirst($doc['document_type'] ?? 'Attachment') }}</td>
                <td>{{ $doc['created_at'] ?? 'N/A' }}</td>
                <td>{{ ucfirst($doc['status'] ?? 'Active') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- 12. Audit Trail & Personnel -->
<div class="avoid-break">
    <div class="section-header">12. Audit Trail & Verification</div>
    <div class="info-grid">
        <div class="info-row">
            <div class="info-cell info-label">Created By:</div>
            <div class="info-cell info-value">{{ $payload['created_by_name'] ?? 'N/A' }} ({{ $payload['created_at'] ?? 'N/A' }})</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Approved By:</div>
            <div class="info-cell info-value">{{ $payload['approved_by_name'] ?? 'N/A' }} ({{ $payload['approved_at'] ?? 'N/A' }})</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Issued By:</div>
            <div class="info-cell info-value">{{ $payload['issued_by_name'] ?? 'N/A' }} ({{ $payload['issued_at'] ?? 'N/A' }})</div>
        </div>
        <div class="info-row">
            <div class="info-cell info-label">Report Generated By:</div>
            <div class="info-cell info-value">{{ $payload['generated_by'] ?? 'Authenticated System User' }}</div>
        </div>
    </div>
</div>

<!-- 13. Timeline / Activity History -->
@if(!empty($payload['timeline']) && count($payload['timeline']) > 0)
<div class="avoid-break">
    <div class="section-header">13. Policy Timeline</div>
    <div style="margin-top: 8px;">
        @foreach($payload['timeline'] as $event)
        <div class="timeline-item">
            <div class="timeline-date">{{ $event['date'] }}</div>
            <div class="timeline-title">{{ $event['title'] }}</div>
            <div class="timeline-desc">{{ $event['description'] }}</div>
        </div>
        @endforeach
    </div>
</div>
@endif

<!-- Verification & Footer Stamp -->
<div class="avoid-break" style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    <table style="width: 100%;">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                <p style="font-size: 8px; color: #64748b; margin: 0 0 4px 0;"><strong>CONFIDENTIALITY NOTICE:</strong> This document contains confidential information intended solely for authorized internal records, insured clients, and regulatory authorities. Any unauthorized review, use, or distribution is prohibited.</p>
                <p style="font-size: 8px; color: #64748b; margin: 0;">InsurePal AI SaaS Enterprise Engine &bull; Automated Document Verification Code: {{ md5($payload['policy_number'] ?? 'insurepal') }}</p>
            </td>
            <td style="width: 40%; text-align: right; vertical-align: bottom;">
                @if(!empty($qr_base64))
                    <img src="{{ $qr_base64 }}" alt="QR Verification" style="width: 60px; height: 60px; display: inline-block;">
                @endif
            </td>
        </tr>
    </table>
</div>

@endsection
