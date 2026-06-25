@extends('pdf.templates.layouts.financial-note')

@section('title', 'Credit Note - ' . ($payload['note_number'] ?? ''))

@section('content')
    <div class="border-bottom" style="padding-bottom: 10px; margin-bottom: 15px;">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
            <tr>
                <td style="vertical-align: middle; text-align: left;">
                    <h1 style="margin: 0; color: {{ $branding['primary_color'] ?? '#333' }}; font-size: 20px; text-transform: uppercase;">{{ $labels['title_label'] ?? 'Credit Note' }}</h1>
                    <h2 style="margin: 6px 0 0 0; font-size: 14px; color: #555;"># {{ $payload['note_number'] ?? '' }}</h2>
                    <p style="margin: 3px 0 0 0; color: #666; font-size: 11px;">Date: <span style="font-weight: bold; color: #333;">{{ $payload['issue_date'] }}</span></p>
                </td>
                @if(!empty($qr_base64))
                    <td style="vertical-align: middle; text-align: right; width: 90px; padding-left: 15px;">
                        <img src="{{ $qr_base64 }}" style="width: 75px; height: 75px; object-fit: contain;" alt="QR Code">
                    </td>
                @endif
            </tr>
        </table>
    </div>

    <div style="margin-top: 10px; ">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
            <tr>
                <td style="vertical-align: top; text-align: left; width: 60%;">
                    <h3 style="color: #777; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">{{ $labels['recipient_label'] ?? 'Insurer:' }}</h3>
                    <p style="margin: 0; font-size: 13px; font-weight: bold;">{{ $payload['customer_name'] }}</p>
                    @if(!empty($payload['customer_address']))
                        <p style="margin: 2px 0 0 0; color: #555; max-width: 90%; line-height: 1.3; font-size: 11px;">{{ $payload['customer_address'] }}</p>
                    @endif
                </td>
                <td style="vertical-align: top; text-align: right; width: 40%;">
                    @if(!empty($payload['policy_number']) && $payload['policy_number'] !== 'N/A')
                        <div style="background: #f9f9f9; padding: 6px 10px; border-left: 3px solid {{ $branding['primary_color'] ?? '#ccc' }}; display: inline-block; text-align: left; margin-bottom: 5px;">
                            <p style="margin: 0; color: #777; font-size: 10px; text-transform: uppercase;">Policy Reference</p>
                            <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold;">{{ $payload['policy_number'] }}</p>
                        </div>
                        <br>
                    @endif

                    @if(!empty($payload['insurer_name']) && $payload['insurer_name'] !== 'N/A')
                        <div style="background: #f9f9f9; padding: 4px 8px; border-left: 3px solid #666; display: inline-block; text-align: left;">
                            <p style="margin: 0; color: #777; font-size: 9px; text-transform: uppercase;">Underwriter</p>
                            <p style="margin: 1px 0 0 0; font-size: 11px; font-weight: bold;">{{ $payload['insurer_name'] }}</p>
                            @if(!empty($payload['insurer_address']))
                                <p style="margin: 1px 0 0 0; font-size: 11px;">{{ $payload['insurer_address'] }}</p>
                            @endif
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    </div>



    <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
        <thead>
            <tr>
                <th style="width: 70%; text-align: left; border-bottom: 2px solid #ddd; font-size: 12px; padding-bottom: 5px;">Description</th>
                <th style="width: 30%; text-align: right; border-bottom: 2px solid #ddd; font-size: 12px; padding-bottom: 5px;">Amount ({{ $payload['currency'] }})</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 8px 0; font-size: 12px; text-align: left;">@if(!empty($payload['description'])){{ $payload['description'] }} @else N/A @endif</td>
                <td style="padding: 8px 0; font-size: 12px; text-align: right;">{{ $payload['amount'] }}</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 10px; width: 100%;">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
            <tr>
                <td style="width: 55%; border: none;"></td>
                <td style="width: 45%; border: none;">
                    <table style="margin: 0; width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 3px 8px; border: none; color: #666; font-size: 11px; text-align: left;">Subtotal:</td>
                            <td style="padding: 3px 8px; border: none; font-weight: bold; font-size: 11px; text-align: right;">{{ $payload['amount'] }}</td>
                        </tr>
                        @if(isset($payload['tax_amount']) && $payload['tax_amount'] !== '0.00')
                            <tr>
                                <td style="padding: 3px 8px; border: none; color: #666; font-size: 11px; text-align: left;">Tax:</td>
                                <td style="padding: 3px 8px; border: none; font-size: 11px; text-align: right;">{{ $payload['tax_amount'] }}</td>
                            </tr>
                        @endif
                        <tr>
                            <td style="padding: 8px 8px 3px; border: none; border-top: 1px solid #ddd; font-weight: bold; font-size: 13px; color: {{ $branding['primary_color'] ?? '#000' }}; text-align: left;">Total Credit:</td>
                            <td style="padding: 8px 8px 3px; border: none; border-top: 1px solid #ddd; font-weight: bold; font-size: 13px; color: {{ $branding['primary_color'] ?? '#000' }}; text-align: right;">{{ $payload['currency'] }} {{ $payload['total_amount'] }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    @include('pdf.partials.verification', [
        'qr_base64' => null, {{-- Decoupled here since it is explicitly integrated into the matrix header if needed --}}
        'verification_url' => $verification_url ?? $verificationUrl ?? null,
    ])

    @if($elementToggles['prepared_by'] ?? true || $elementToggles['authorized_signature'] ?? true)
    <div style="margin-top: 35px; width: 100%; page-break-inside: avoid;">
        <table style="width: 100%; border: none; border-collapse: collapse; table-layout: fixed;">
            <tr>
                @if($elementToggles['prepared_by'] ?? true)
                <td style="width: 40%; border: none; text-align: left; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if(!empty($payload['preparer_signature_base64']))
                            <img src="{{ $payload['preparer_signature_base64'] }}" style="height: 40px; max-width: 160px; object-fit: contain; margin-bottom: 3px; position: relative; z-index: 10;">
                        @else
                            <div style="height: 40px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 180px; padding-top: 3px;">
                            <p style="margin: 0; font-size: 10px; color: #555;">Prepared By:</p>
                            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #333;">{{ $payload['preparer_name'] ?? 'Preparer' }}</p>
                        </div>
                    </div>
                </td>
                @endif

                @if($elementToggles['authorized_signature'] ?? true)
                <td style="width: 40%; border: none; text-align: right; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if($elementToggles['stamp'] ?? true)
                            @if(!empty($branding['stamp_base64']))
                                <div style="margin-bottom: -55px; position: relative; z-index: 2;">
                                    <img src="{{ $branding['stamp_base64'] }}" style="width: 70px; height: 70px; object-fit: contain;">
                                </div>
                            @endif
                        @endif
                        
                        @if(!empty($branding['signature_base64']))
                            <img src="{{ $branding['signature_base64'] }}" style="height: 40px; max-width: 160px; object-fit: contain; margin-bottom: 3px; position: relative; z-index: 1;">
                        @else
                            <div style="height: 40px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 180px; padding-top: 3px; margin-left: auto;">
                            <p style="margin: 0; font-size: 10px; color: #555;">Authorized Signature</p>
                        </div>
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
    @endif
@endsection