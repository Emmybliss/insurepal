@extends('pdf.templates.layouts.financial-note')

@section('title', 'Invoice - ' . ($payload['invoice_number'] ?? ''))

@section('content')
    <div class="flex justify-between items-center border-b pb-4 mb-4">
        <div>
            <h1 class="text-2xl font-bold text-primary uppercase">{{ $labels['title_label'] ?? 'Invoice' }}</h1>
            <h2 class="text-base font-semibold text-secondary mt-1"># {{ $payload['invoice_number'] ?? '' }}</h2>
            <p class="text-xs text-muted mt-2">Date: <span class="font-bold text-base text-primary">{{ $payload['invoice_date'] }}</span></p>
            @if(!empty($payload['due_date']))
                <p class="text-xs text-muted mt-1">Due Date: <span class="font-bold text-base text-primary">{{ $payload['due_date'] }}</span></p>
            @endif
        </div>
        @if(!empty($qr_base64))
            <div>
                <img src="{{ $qr_base64 }}" class="w-20 h-20 object-contain" alt="QR Code">
            </div>
        @endif
    </div>

    <div class="my-4">
        <h3 class="text-xs text-muted font-semibold uppercase">{{ $labels['recipient_label'] ?? 'Bill To:' }}</h3>
        <p class="text-base font-bold mt-1 text-primary">{{ $payload['customer_name'] }}</p>
        @if(!empty($payload['customer_address']))
            <p class="text-xs text-muted mt-1 leading-normal" style="max-width: 60%;">{{ $payload['customer_address'] }}</p>
        @endif
    </div>

    <table class="modern-table mt-6">
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th class="text-center" style="width: 15%;">Quantity</th>
                <th class="text-right" style="width: 15%;">Unit Price</th>
                <th class="text-right" style="width: 20%;">Total ({{ $payload['currency'] }})</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($payload['items']) && is_array($payload['items']))
                @foreach($payload['items'] as $item)
                    <tr>
                        <td class="text-left">{{ $item['description'] ?? 'Item' }}</td>
                        <td class="text-center">{{ $item['quantity'] ?? 1 }}</td>
                        <td class="text-right">{{ $item['unit_price'] ?? '0.00' }}</td>
                        <td class="text-right font-semibold">{{ $item['total'] ?? '0.00' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" class="text-center text-muted">No items found.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="flex justify-end mt-4">
        <div class="w-64">
            <div class="flex justify-between py-1 text-xs text-muted">
                <span>Subtotal:</span>
                <span class="font-semibold text-primary">{{ $payload['subtotal'] ?? '0.00' }}</span>
            </div>
            @if(isset($payload['discount_amount']) && $payload['discount_amount'] !== '0.00')
                <div class="flex justify-between py-1 text-xs text-muted">
                    <span>Discount:</span>
                    <span class="font-semibold text-primary">-{{ $payload['discount_amount'] }}</span>
                </div>
            @endif
            @if(isset($payload['tax_amount']) && $payload['tax_amount'] !== '0.00')
                <div class="flex justify-between py-1 text-xs text-muted">
                    <span>Tax:</span>
                    <span class="font-semibold text-primary">{{ $payload['tax_amount'] }}</span>
                </div>
            @endif
            <div class="flex justify-between py-2 border-t border-slate-200 mt-1">
                <span class="font-bold text-base text-primary">Total Due:</span>
                <span class="font-bold text-base text-primary">{{ $payload['currency'] }} {{ $payload['total_amount'] }}</span>
            </div>
        </div>
    </div>

    @include('pdf.partials.verification', [
        'qr_base64' => null,
        'verification_url' => $verification_url ?? $verificationUrl ?? null,
    ])

    @include('pdf.partials.signatures')
@endsection