@extends('pdf.templates.layouts.financial-note')

@section('title', 'Payment Receipt - ' . ($payload['receipt_number'] ?? ''))

@section('content')

{{--
    ─────────────────────────────────────────────────────────────────────────
    PAYMENT RECEIPT BODY
    Strict black-and-white corporate design.
    Tenant header/footer are injected by the master layout.
    ─────────────────────────────────────────────────────────────────────────
--}}

<style>
    /* ── Receipt Body Overrides (body-only, no color) ── */

    /* Receipt title row */
    .receipt-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1.5px solid #222;
        padding-bottom: 14px;
        margin-bottom: 20px;
    }

    .receipt-title {
        font-size: 26px;
        font-weight: 700;
        color: #000;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin: 0;
        line-height: 1.1;
    }

    .receipt-number-box {
        border: 1px solid #444;
        padding: 7px 16px;
        text-align: right;
        white-space: nowrap;
    }

    .receipt-number-box .rn-label {
        font-size: 10px;
        color: #666;
        font-weight: 400;
    }

    .receipt-number-box .rn-value {
        font-size: 12px;
        font-weight: 700;
        color: #000;
    }

    /* Customer / payment information grid */
    .info-section {
        margin-bottom: 20px;
    }

    .info-row {
        display: table;
        width: 100%;
        padding: 6px 0;
        border-bottom: 1px solid #EEEEEE;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .info-icon {
        display: table-cell;
        width: 28px;
        vertical-align: middle;
        color: #333;
        font-size: 13px;
    }

    .info-label {
        display: table-cell;
        width: 150px;
        vertical-align: middle;
        font-size: 11px;
        color: #555;
        font-weight: 600;
    }

    .info-value {
        display: table-cell;
        vertical-align: middle;
        font-size: 12px;
        font-weight: 700;
        color: #111;
    }

    /* Payment table */
    .payment-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        margin-bottom: 0;
        font-size: 12px;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .payment-table thead tr {
        background-color: #F2F2F2;
    }

    .payment-table th {
        padding: 9px 12px;
        text-align: left;
        font-weight: 700;
        font-size: 11px;
        color: #000;
        border: 1px solid #CCCCCC;
        text-transform: none;
        letter-spacing: 0;
    }

    .payment-table th.col-amount {
        text-align: right;
    }

    .payment-table td {
        padding: 9px 12px;
        border: 1px solid #CCCCCC;
        border-top: none;
        color: #222;
        vertical-align: middle;
    }

    .payment-table td.col-amount {
        text-align: right;
        font-weight: 600;
    }

    /* Total paid row */
    .total-row td {
        border: 1px solid #999 !important;
        background-color: #F7F7F7;
        font-weight: 700 !important;
        font-size: 13px !important;
    }

    /* Amount in words */
    .amount-in-words {
        margin-top: 16px;
        font-size: 11px;
        color: #333;
        line-height: 1.6;
    }

    .amount-in-words .aiw-label {
        font-weight: 700;
        color: #000;
        margin-bottom: 2px;
    }

    .amount-in-words .aiw-text {
        font-style: italic;
        color: #333;
    }

    /* Divider */
    .receipt-divider {
        border: none;
        border-top: 1px solid #999;
        margin: 20px 0;
    }

    /* Thank you / signature section */
    .bottom-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .thankyou-block {
        width: 45%;
    }

    .thankyou-heading {
        font-family: Georgia, 'Times New Roman', serif;
        font-style: italic;
        font-size: 22px;
        font-weight: 700;
        color: #111;
        margin: 0 0 4px 0;
        line-height: 1.2;
    }

    .thankyou-sub {
        font-size: 11px;
        color: #555;
        margin: 0;
    }

    .signature-block {
        width: 45%;
        text-align: center;
    }

    .signature-img {
        height: 50px;
        max-width: 180px;
        object-fit: contain;
        margin-bottom: 4px;
    }

    .signature-line-spacer {
        height: 48px;
    }

    .signature-line {
        border-top: 1px solid #333;
        padding-top: 6px;
    }

    .signature-label {
        font-size: 10px;
        color: #444;
        font-weight: 600;
    }

    .signature-company {
        font-size: 10px;
        color: #333;
        margin-top: 2px;
    }
</style>

{{-- ── 1. Title Row ── --}}
<div class="receipt-title-row avoid-break">
    <div>
        <h1 class="receipt-title">{{ $labels['title_label'] ?? 'Payment Receipt' }}</h1>
    </div>
    <div class="receipt-number-box">
        <div class="rn-label">Receipt No:</div>
        <div class="rn-value">{{ $payload['receipt_number'] ?? '—' }}</div>
    </div>
</div>

{{-- ── 2. Customer & Payment Information ── --}}
<div class="info-section">

    {{-- Customer Name --}}
    <div class="info-row">
        <div class="info-icon">&#x1F464;</div>
        <div class="info-label">Customer Name:</div>
        <div class="info-value">{{ $payload['customer_name'] ?? '—' }}</div>
    </div>

    {{-- Address --}}
    @if(!empty($payload['customer_address']))
    <div class="info-row">
        <div class="info-icon">&#x1F4CD;</div>
        <div class="info-label">Address:</div>
        <div class="info-value">{{ $payload['customer_address'] }}</div>
    </div>
    @endif

    {{-- Date --}}
    <div class="info-row">
        <div class="info-icon">&#x1F4C5;</div>
        <div class="info-label">Date:</div>
        <div class="info-value">{{ $payload['receipt_date'] ?? '—' }}</div>
    </div>

    {{-- Payment Method --}}
    @if(!empty($payload['payment_method']))
    <div class="info-row">
        <div class="info-icon">&#x1F4B3;</div>
        <div class="info-label">Payment Method:</div>
        <div class="info-value">{{ $payload['payment_method'] }}</div>
    </div>
    @endif

    {{-- Reference No --}}
    @if(!empty($payload['transaction_reference']) && $payload['transaction_reference'] !== 'N/A')
    <div class="info-row">
        <div class="info-icon">&#x1F9FE;</div>
        <div class="info-label">Reference No:</div>
        <div class="info-value">{{ $payload['transaction_reference'] }}</div>
    </div>
    @endif

    {{-- Invoice Reference --}}
    @if(!empty($payload['invoice_number']) && $payload['invoice_number'] !== 'N/A')
    <div class="info-row">
        <div class="info-icon">&#x1F4CB;</div>
        <div class="info-label">Invoice Ref:</div>
        <div class="info-value">{{ $payload['invoice_number'] }}</div>
    </div>
    @endif

    {{-- Policy Reference --}}
    @if(!empty($payload['policy_number']) && $payload['policy_number'] !== 'N/A')
    <div class="info-row">
        <div class="info-icon">&#x1F4C4;</div>
        <div class="info-label">Policy No:</div>
        <div class="info-value">{{ $payload['policy_number'] }}</div>
    </div>
    @endif

</div>

{{-- ── 3. Payment Table ── --}}
<div class="avoid-break">
    <table class="payment-table">
        <thead>
            <tr>
                <th style="width: 75%;">Description</th>
                <th class="col-amount" style="width: 25%;">Amount ({{ strtoupper($payload['currency'] ?? 'NGN') }})</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    @if(!empty($payload['policy_name']))
                        &ndash; {{ $payload['policy_name'] }}
                    @elseif(!empty($payload['description']))
                        &ndash; {{ $payload['description'] }}
                    @endif
                </td>
                <td class="col-amount">{{ $payload['amount_paid'] ?? '0.00' }}</td>
            </tr>
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td>Total Paid</td>
                <td class="col-amount">{{ strtoupper($payload['currency'] ?? 'NGN') }} {{ $payload['amount_paid'] ?? '0.00' }}</td>
            </tr>
        </tfoot>
    </table>
</div>

{{-- ── 4. Amount in Words ── --}}
@if(!empty($payload['amount_in_words']))
<div class="amount-in-words avoid-break">
    <p class="aiw-label">Amount in Words:</p>
    <p class="aiw-text">{{ $payload['amount_in_words'] }}</p>
</div>
@endif

{{-- ── 5. Divider ── --}}
<hr class="receipt-divider">

{{-- ── 6. Thank You / Signature Section ── --}}
<div class="bottom-section avoid-break">

    {{-- Left: Thank you message --}}
    <div class="thankyou-block">
        <p class="thankyou-heading">Thank you!</p>
        <p class="thankyou-sub">for your trust and support.</p>
    </div>

    {{-- Right: Authorised Signature --}}
    <div class="signature-block">
        @if(!empty($branding['signature_path']))
            <img src="{{ $branding['signature_path'] }}" class="signature-img" alt="Authorised Signature">
        @elseif(!empty($branding['signature_base64']))
            <img src="{{ $branding['signature_base64'] }}" class="signature-img" alt="Authorised Signature">
        @else
            <div class="signature-line-spacer"></div>
        @endif
        <div class="signature-line">
            <p class="signature-label">Authorised Signatory</p>
            <p class="signature-company">{{ $branding['company_name'] ?? 'InsurePal' }}</p>
        </div>
    </div>

</div>

@endsection