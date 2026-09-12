@extends('pdf.templates.layouts.financial-note')

@section('title', 'Receipt - ' . ($payload['receipt_number'] ?? ''))

@section('content')
    <div class="flex justify-between items-center border-b pb-4 mb-4">
        <div>
            <h1 class="text-2xl font-bold text-[#000] uppercase">{{ $labels['title_label'] ?? 'Receipt' }}</h1>
        </div>
        <div class="text-right">
            <h2 class="text-lg font-semibold text-[#000]"># {{ $payload['receipt_number'] ?? '' }}</h2>
            <p class="text-lg text-muted mt-1">Date: <span class="font-bold text-lg text-[#000]">{{ $payload['receipt_date'] }}</span></p>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-8 my-4">
        <div>
            <h3 class="text-lg text-muted font-semibold ">{{ $labels['payer_label'] ?? 'Received From:' }}</h3>
            <p class="text-lg font-bold mt-1 text-[#000]">{{ $payload['customer_name'] }}</p>
        </div>
        <div class="flex justify-end gap-3">
            @if(!empty($payload['invoice_number']) && $payload['invoice_number'] !== 'N/A')
                <div class="bg-light p-3 border-l-4 border-[#000] text-left w-48">
                    <p class="text-lg text-muted ">Invoice Reference</p>
                    <p class="text-lg font-bold mt-1 text-[#000]">{{ $payload['invoice_number'] }}</p>
                </div>
            @endif
            @if(!empty($payload['policy_number']) && $payload['policy_number'] !== 'N/A')
                <div class="bg-light p-3 border-l-4 border-[#000] text-left w-48">
                    <p class="text-lg text-muted ">Policy Reference</p>
                    <p class="text-lg font-bold mt-1 text-[#000]">{{ $payload['policy_number'] }}</p>
                </div>
            @endif
        </div>
    </div>

    <div class="my-6 bg-light border border-slate-200 p-4 text-center rounded" style="border-radius: 4px;">
        <h2 class="text-lg text-muted font-semibold tracking-wider">Amount Received</h2>
        <p class="text-2xl font-bold text-[#000] mt-1">{{ $payload['currency'] }} {{ $payload['amount_paid'] }}</p>
    </div>

    <table class="modern-table mt-6" style="width: 60%; margin-left: auto; margin-right: auto;">
        <tbody>
            <tr>
                <td class="text-left text-muted" style="width: 45%;">Payment Method:</td>
                <td class="text-right font-bold text-[#000]">{{ $payload['payment_method'] }}</td>
            </tr>
            @if(!empty($payload['transaction_reference']) && $payload['transaction_reference'] !== 'N/A')
                <tr>
                    <td class="text-left text-muted">Transaction Ref:</td>
                    <td class="text-right font-bold text-[#000]">{{ $payload['transaction_reference'] }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    @if(!empty($payload['description']))
        <div class="my-4 p-3 bg-light border-l-4 border-[#000] text-left" style="border-radius: 4px;">
            <p class="text-lg font-semibold text-muted ">Description / Notes</p>
            <p class="text-lg text-[#000] mt-1" style="white-space: pre-wrap;">{{ $payload['description'] }}</p>
        </div>
    @endif

    <div class="text-center my-6">
        <p class="text-lg text-muted italic">Thank you for your business.</p>
    </div>

    @include('pdf.partials.signatures')
@endsection