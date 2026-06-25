@extends('pdf.templates.layouts.financial-note')

@section('title', 'Broker Slip - ' . ($slip->slip_number ?? ''))

@section('content')
    @if($watermark)
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 72px; color: rgba(200, 0, 0, 0.08); font-weight: bold; text-transform: uppercase; letter-spacing: 10px; z-index: 9999; pointer-events: none;">
            {{ $watermark }}
        </div>
    @endif

    <!-- <div class="border-bottom" style="padding-bottom: 20px; margin-bottom: 25px;"> -->
        <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
                <td style="vertical-align: middle; text-align: left;">
                    <h1 style="margin: 0; color: {{ $branding['primary_color'] ?? '#333' }}; font-size: 26px; text-transform: uppercase; letter-spacing: 1px;">Broker Slip</h1>
                    <p style="margin: 8px 0 0 0; color: #555; font-size: 14px;">
                        Ref #: <strong>{{ $slip->slip_number }}</strong> &nbsp;|&nbsp; 
                        Date: <strong>{{ $slip->created_at->format('d M Y') }}</strong> &nbsp;|&nbsp; 
                        Status: <span style="text-transform: uppercase; font-weight: bold; color: {{ $slip->status === 'approved' ? '#2e7d32' : '#555' }};">{{ $slip->status }}</span>
                        @if($slip->version > 1)
                            &nbsp;|&nbsp; Version: <strong>{{ $slip->version }}</strong>
                        @endif
                    </p>
                </td>
                @if(!empty($qr_base64))
                    <td style="vertical-align: middle; text-align: right; width: 100px; padding-left: 15px;">
                        <img src="{{ $qr_base64 }}" style="width: 85px; height: 85px; object-fit: contain;" alt="QR Code">
                    </td>
                @endif
            </tr>
        </table>
    <!-- </div> -->

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <tbody>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; width: 30%; color: #444; text-transform: uppercase;">TO:</td>
                <td style="padding: 12px 5px; width: 70%; font-weight: bold; text-transform: uppercase; color: #222;">
                    {{ $insurer->name ?? 'TBA' }}
                    @if(!empty($insurer->address))
                        <div style="font-weight: normal; color: #555; font-size: 13px; margin-top: 4px; text-transform: none;">{{ $insurer->address }}</div>
                    @endif
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">INSURED:</td>
                <td style="padding: 12px 5px; font-weight: bold; text-transform: uppercase; color: #222;">
                    {{ $customer->display_name ?? 'N/A' }}
                    @if(!empty($customer->address))
                        <div style="font-weight: normal; color: #555; font-size: 13px; margin-top: 4px; text-transform: none;">{{ $customer->address }}</div>
                    @endif
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">TYPES OF INSURANCE:</td>
                <td style="padding: 12px 5px; text-transform: uppercase;">{{ $placement->policyProduct->policyClass->name ?? 'N/A' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">CLASS OF BUSINESS:</td>
                <td style="padding: 12px 5px; text-transform: uppercase;">{{ $placement->policyProduct->name ?? 'N/A' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">VALUE:</td>
                <td style="padding: 12px 5px; font-weight: bold;">{{ number_format($slip->sum_insured ?? 0, 2) }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">DETAILS:</td>
                <td style="padding: 12px 5px; text-transform: uppercase;">{{ $placement->policyProduct->description ?? 'N/A' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">PERIOD:</td>
                <td style="padding: 12px 5px; text-transform: uppercase;">
                    @if(!empty($placement->proposed_start_date) && !empty($placement->proposed_end_date))
                        {{ $placement->proposed_start_date->format('jS F Y') }} TO {{ $placement->proposed_end_date->format('jS F Y') }}
                    @else
                        N/A
                    @endif
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">RATE:</td>
                <td style="padding: 12px 5px; text-transform: uppercase;">{{ $slip->rate ? number_format($slip->rate, 4) . ($slip->rate_basis ? ' ' . str_replace('_', ' ', $slip->rate_basis) : '') : 'TBA' }}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">PREMIUM:</td>
                <td style="padding: 12px 5px; font-weight: bold;">{{ number_format($slip->gross_premium ?? 0, 2) }}</td>
            </tr>
            @if(($slip->commission_amount ?? 0) > 0)
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">LESS {{ $slip->commission_rate }}% COMM:</td>
                    <td style="padding: 12px 5px;">{{ number_format($slip->commission_amount, 2) }}</td>
                </tr>
            @endif
            @if(($slip->taxes ?? 0) > 0)
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">LESS TAXES / VAT COMM:</td>
                    <td style="padding: 12px 5px;">{{ number_format($slip->taxes, 2) }}</td>
                </tr>
            @endif
            @if(($slip->fees ?? 0) > 0)
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 5px; font-weight: bold; color: #444; text-transform: uppercase;">FEES:</td>
                    <td style="padding: 12px 5px;">{{ number_format($slip->fees, 2) }}</td>
                </tr>
            @endif
            <tr style="border-bottom: 2px solid #333; background-color: #f9f9f9;">
                <td style="padding: 14px 5px; font-weight: bold; color: {{ $branding['primary_color'] ?? '#000' }}; text-transform: uppercase; font-size: 15px;">NET PREMIUM:</td>
                <td style="padding: 14px 5px; font-weight: bold; font-size: 16px; color: {{ $branding['primary_color'] ?? '#000' }};">
                    {{ number_format($slip->net_premium ?? max($slip->gross_premium, $slip->total_premium ?? 0), 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    @if($clauses->isNotEmpty())
        <div style="margin-top: 35px; page-break-inside: avoid;">
            <h3 style="color: #555; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #ddd; padding-bottom: 6px;">Clauses & Conditions</h3>
            @foreach($clauses as $clause)
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-left: 3px solid {{ $branding['primary_color'] ?? '#333' }};">
                    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px; color: #222;">{{ $clause->title ?? $clause->clause_title ?? 'Clause' }}</p>
                    <p style="margin: 0; font-size: 12px; color: #444; line-height: 1.5;">{{ $clause->text ?? $clause->clause_text ?? '' }}</p>
                </div>
            @endforeach
        </div>
    @endif

    <!-- @include('pdf.partials.verification', [
        'qr_base64' => null, {{-- Passed as null here since it is now rendered explicitly in the header --}}
        'verification_url' => $verification_url ?? $verificationUrl ?? null,
    ]) -->

    @if($elementToggles['prepared_by'] ?? true || $elementToggles['authorized_signature'] ?? true)
    <div style="margin-top: 25px; width: 100%;">
        <table style="width: 100%; border: none; border-collapse: collapse;">
            <tr>
                @if($elementToggles['prepared_by'] ?? true)
                <td style="width: 40%; border: none; text-align: left; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if(!empty($preparer_signature))
                            <img src="{{ $preparer_signature }}" style="height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 5px; position: relative; z-index: 10;">
                        @else
                            <div style="height: 60px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px;">
                            <p style="margin: 0; font-size: 12px; color: #555;">Prepared By:</p>
                            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">{{ $preparer_name }}</p>
                        </div>
                    </div>
                </td>
                @endif

                @if($elementToggles['authorized_signature'] ?? true)
                <td style="width: 40%; border: none; text-align: right; vertical-align: bottom;">
                    <div style="position: relative; display: inline-block; text-align: center;">
                        @if($elementToggles['stamp'] ?? true)
                            @if(!empty($branding['stamp_base64']))
                                <div style="margin-bottom: -80px; position: relative; z-index: 2;">
                                    <img src="{{ $branding['stamp_base64'] }}" style="width: 100px; height: 100px; object-fit: contain;">
                                </div>
                            @endif
                        @endif
                        
                        @if(!empty($branding['signature_base64']))
                            <img src="{{ $branding['signature_base64'] }}" style="height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 5px; position: relative; z-index: 1;">
                        @else
                            <div style="height: 60px;"></div>
                        @endif
                        <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px; margin-left: auto;">
                            <p style="margin: 0; font-size: 12px; color: #555;">Authorized Signature</p>
                        </div>
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
    @endif
@endsection