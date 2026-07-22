@extends('pdf.templates.layouts.financial-note')

@section('title', 'Receipt - ' . ($payload['receipt_number'] ?? ''))

@section('content')
    <div class="flex justify-between items-center border-b pb-4 mb-4">
        <div>
            <h1 class="text-2xl font-bold text-primary uppercase">{{ $labels['title_label'] ?? 'Receipt' }}</h1>
        </div>
        <div class="text-right">
            <h2 class="text-base font-semibold text-secondary"># {{ $payload['receipt_number'] ?? '' }}</h2>
            <p class="text-xs text-muted mt-1">Date: <span class="font-bold text-base text-primary">{{ $payload['receipt_date'] }}</span></p>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-8 my-4">
        <div>
            <h3 class="text-xs text-muted font-semibold uppercase">{{ $labels['payer_label'] ?? 'Received From:' }}</h3>
            <p class="text-base font-bold mt-1 text-primary">{{ $payload['customer_name'] }}</p>
        </div>
        <div class="flex justify-end">
            @if(!empty($payload['invoice_number']) && $payload['invoice_number'] !== 'N/A')
                <div class="bg-light p-3 border-l-4 border-primary text-left w-64">
                    <p class="text-xs text-muted uppercase">Invoice Reference</p>
                    <p class="text-sm font-bold mt-1 text-primary">{{ $payload['invoice_number'] }}</p>
                </div>
            @endif
        </div>
    </div>

    <div class="my-6 bg-light border border-slate-200 p-4 text-center rounded" style="border-radius: 4px;">
        <h2 class="text-xs text-muted font-semibold uppercase tracking-wider">Amount Received</h2>
        <p class="text-2xl font-bold text-primary mt-1">{{ $payload['currency'] }} {{ $payload['amount_paid'] }}</p>
    </div>

    <table class="modern-table mt-6" style="width: 60%; margin-left: auto; margin-right: auto;">
        <tbody>
            <tr>
                <td class="text-left text-muted" style="width: 45%;">Payment Method:</td>
                <td class="text-right font-bold text-primary">{{ $payload['payment_method'] }}</td>
            </tr>
            @if(!empty($payload['transaction_reference']) && $payload['transaction_reference'] !== 'N/A')
                <tr>
                    <td class="text-left text-muted">Transaction Ref:</td>
                    <td class="text-right font-bold text-primary">{{ $payload['transaction_reference'] }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="text-center my-6">
        <p class="text-sm text-muted italic">Thank you for your business.</p>
    </div>

    @include('pdf.partials.signatures')
@endsection