@extends('pdf.templates.layouts.financial-note')

@section('title', 'Credit Note - ' . ($payload['note_number'] ?? ''))

@section('content')
    <div class="flex justify-between items-center border-b pb-4 mb-4">
        <div>
            <h1 class="text-2xl font-bold text-primary uppercase">{{ $labels['title_label'] ?? 'Credit Note' }}</h1>
            <h2 class="text-base font-semibold text-secondary mt-1"># {{ $payload['note_number'] ?? '' }}</h2>
            <p class="text-xs text-muted mt-2">Date: <span class="font-bold text-base text-primary">{{ $payload['created_at'] }}</span></p>
            <p class="text-xs text-muted mt-1">Coverage Period: <span class="font-bold text-base text-primary">{{ !empty($payload['issue_date']) && !empty($payload['due_date']) ? $payload['issue_date'] . ' — ' . $payload['due_date'] : 'To Be Advised' }}</span></p>
        </div>
        @if(!empty($qr_base64))
            <div>
                <img src="{{ $qr_base64 }}" class="w-20 h-20 object-contain" alt="QR Code">
            </div>
        @endif
    </div>

    <div class="grid grid-cols-2 gap-8 my-4">
        <div>
            <h3 class="text-xs text-muted font-semibold uppercase">{{ $labels['recipient_label'] ?? 'Insurer:' }}</h3>
            <p class="text-base font-bold mt-1">{{ $payload['customer_name'] }}</p>
            @if(!empty($payload['customer_address']))
                <p class="text-xs text-muted mt-1 leading-normal">{{ $payload['customer_address'] }}</p>
            @endif
        </div>
        <div class="flex flex-col items-end">
            @if(!empty($payload['policy_number']) && $payload['policy_number'] !== 'N/A')
                <div class="bg-light p-3 border-l-4 border-primary text-left mb-2 w-64">
                    <p class="text-xs text-muted uppercase">Policy Reference</p>
                    <p class="text-sm font-bold mt-1 text-primary">{{ $payload['policy_number'] }}</p>
                    @if(!empty($payload['policy_type']))
                        <p class="text-xs text-muted mt-1">Policy Type: <span class="font-semibold text-primary">{{ $payload['policy_type'] }}</span></p>
                    @endif
                    @if(!empty($payload['class_of_business']))
                        <p class="text-xs text-muted mt-1">Class of Business: <span class="font-semibold text-primary">{{ $payload['class_of_business'] }}</span></p>
                    @endif
                </div>
            @endif

            @if(!empty($payload['insurer_name']) && $payload['insurer_name'] !== 'N/A')
                <div class="bg-light p-3 border-l-4 border-secondary text-left w-64">
                    <p class="text-xs text-muted uppercase">Underwriter</p>
                    <p class="text-sm font-bold mt-1 text-primary">{{ $payload['insurer_name'] }}</p>
                    @if(!empty($payload['insurer_address']))
                        <p class="text-xs text-muted mt-1 leading-normal">{{ $payload['insurer_address'] }}</p>
                    @endif
                    @if(!empty($payload['insurer_email']))
                        <p class="text-xs text-muted mt-1">{{ $payload['insurer_email'] }}</p>
                    @endif
                    @if(!empty($payload['insurer_phone']))
                        <p class="text-xs text-muted mt-1">{{ $payload['insurer_phone'] }}</p>
                    @endif
                </div>
            @endif
        </div>
    </div>

    <table class="modern-table mt-6">
        <thead>
            <tr>
                <th style="width: 70%;">Description</th>
                <th class="text-right" style="width: 30%;">Amount ({{ $payload['currency'] }})</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-left">
                    @if(!empty($payload['description']))
                        {{ $payload['description'] }}
                    @else
                        N/A
                    @endif
                </td>
                <td class="text-right font-semibold">{{ $payload['amount'] }}</td>
            </tr>
        </tbody>
    </table>

    <div class="flex justify-end mt-4">
        <div class="w-64">
            <div class="flex justify-between py-1 text-xs text-muted">
                <span>Subtotal:</span>
                <span class="font-semibold text-primary">{{ $payload['amount'] }}</span>
            </div>
            @if(isset($payload['tax_amount']) && $payload['tax_amount'] !== '0.00')
                <div class="flex justify-between py-1 text-xs text-muted">
                    <span>Tax:</span>
                    <span class="font-semibold text-primary">{{ $payload['tax_amount'] }}</span>
                </div>
            @endif
            @if(isset($payload['commission_amount']) && $payload['commission_amount'] !== '0.00')
                <div class="flex justify-between py-1 text-xs text-muted">
                    <span>Commission:</span>
                    <span class="font-semibold text-primary">{{ $payload['commission_amount'] }}</span>
                </div>
            @endif
            <div class="flex justify-between py-2 border-t border-slate-200 mt-1">
                <span class="font-bold text-base text-primary">Total Credit:</span>
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