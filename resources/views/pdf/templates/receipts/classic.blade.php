@extends('pdf.templates.layouts.financial-note')

@section('title', 'Receipt - ' . ($payload['receipt_number'] ?? ''))

@section('content')
    <div class="border-bottom" style="padding-bottom: 15px; margin-bottom: 15px;">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
            <tr>
                <td style="vertical-align: middle; text-align: left;">
                    <h1 style="margin: 0; color: {{ $branding['primary_color'] ?? '#333' }}; font-size: 26px; text-transform: uppercase;">{{ $labels['title_label'] ?? 'Receipt' }}</h1>
                </td>
                <td style="vertical-align: middle; text-align: right;">
                    <h2 style="margin: 0; font-size: 16px; color: #555;"># {{ $payload['receipt_number'] ?? '' }}</h2>
                    <p style="margin: 4px 0 0 0; color: #666; font-size: 11px;">Date: <span style="font-weight: bold; color: #333;">{{ $payload['receipt_date'] }}</span></p>
                </td>
            </tr>
        </table>
    </div>

    <div style="margin-top: 15px; margin-bottom: 15px;">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed;">
            <tr>
                <td style="vertical-align: top; text-align: left; width: 60%;">
                    <h3 style="color: #777; margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">{{ $labels['payer_label'] ?? 'Received From:' }}</h3>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #222;">{{ $payload['customer_name'] }}</p>
                </td>
                <td style="vertical-align: top; text-align: right; width: 40%;">
                    @if(!empty($payload['invoice_number']) && $payload['invoice_number'] !== 'N/A')
                        <div style="background: #f9f9f9; padding: 8px 12px; border-left: 3px solid {{ $branding['primary_color'] ?? '#ccc' }}; display: inline-block; text-align: left;">
                            <p style="margin: 0; color: #777; font-size: 10px; text-transform: uppercase;">Invoice Reference</p>
                            <p style="margin: 3px 0 0 0; font-size: 14px; font-weight: bold; color: #333;">{{ $payload['invoice_number'] }}</p>
                        </div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div style="margin: 25px 0; border: 1px solid #ddd; padding: 15px 20px; border-radius: 4px; background-color: #fafafa; text-align: center;">
        <h2 style="margin: 0 0 6px 0; color: #666; font-size: 13px; font-weight: normal; text-transform: uppercase; letter-spacing: 0.5px;">Amount Received</h2>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: {{ $branding['primary_color'] ?? '#333' }};">{{ $payload['currency'] }} {{ $payload['amount_paid'] }}</p>
    </div>

    <table style="width: 60%; margin: 0 auto; border-collapse: collapse;">
        <tbody>
            <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #eee; color: #666; font-size: 11px; text-align: left; width: 45%;">Payment Method:</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-align: right; color: #333;">{{ $payload['payment_method'] }}</td>
            </tr>
            @if(!empty($payload['transaction_reference']) && $payload['transaction_reference'] !== 'N/A')
                <tr>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #eee; color: #666; font-size: 11px; text-align: left;">Transaction Ref:</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-align: right; color: #333;">{{ $payload['transaction_reference'] }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
        <p style="color: #666; font-size: 12px; font-style: italic; margin: 0;">Thank you for your business.</p>
    </div>

    @if($elementToggles['prepared_by'] ?? true || $elementToggles['authorized_signature'] ?? true)
    <div style="margin-top: 50px; width: 100%; page-break-inside: avoid;">
        <table style="width: 100%; border: none; border-collapse: collapse; table-layout: fixed;">
            <tr>
                @if($elementToggles['prepared_by'] ?? true)
                <td style="width: 50%; border: none; text-align: left; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if(!empty($payload['preparer_signature_base64']))
                            <img src="{{ $payload['preparer_signature_base64'] }}" style="height: 45px; max-width: 180px; object-fit: contain; margin-bottom: 4px; position: relative; z-index: 10;">
                        @else
                            <div style="height: 45px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 4px;">
                            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #333;">{{ $payload['preparer_name'] ?? 'Preparer' }}</p>
                            <p style="margin: 1px 0 0 0; font-size: 10px; color: #555;">Prepared By</p>
                        </div>
                    </div>
                </td>
                @endif

                @if($elementToggles['authorized_signature'] ?? true)
                <td style="width: 50%; border: none; text-align: right; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if($elementToggles['stamp'] ?? true)
                            @if(!empty($branding['stamp_base64']))
                                <div style="margin-bottom: -63px; position: relative; z-index: 2;">
                                    <img src="{{ $branding['stamp_base64'] }}" style="width: 80px; height: 80px; object-fit: contain;">
                                </div>
                            @endif
                        @endif
                        
                        @if(!empty($branding['signature_base64']))
                            <img src="{{ $branding['signature_base64'] }}" style="height: 45px; max-width: 180px; object-fit: contain; margin-bottom: 4px; position: relative; z-index: 1;">
                        @else
                            <div style="height: 45px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 4px; margin-left: auto;">
                            <p style="margin: 0; font-size: 11px; color: #555;">Authorized Signature</p>
                        </div>
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
    @endif
@endsection