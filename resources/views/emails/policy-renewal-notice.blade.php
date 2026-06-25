<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $subject }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f3f4f6;
        }

        .wrapper {
            max-width: 620px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.09);
        }

        /* ---- HEADER ---- */
        .header {
            padding: 36px 32px 28px;
            text-align: center;
        }

        .header-expired {
            background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
        }

        .header-expiring {
            background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
        }

        .header-icon {
            font-size: 40px;
            margin-bottom: 12px;
            display: block;
        }

        .header h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.3px;
            margin-bottom: 6px;
        }

        .header .subtitle {
            color: rgba(255, 255, 255, 0.88);
            font-size: 13px;
        }

        /* ---- SENDER BANNER ---- */
        .sender-banner {
            background: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px 32px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
        }

        .sender-banner strong {
            color: #111827;
        }

        /* ---- CONTENT ---- */
        .content {
            padding: 36px 32px;
        }

        .greeting {
            font-size: 19px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 14px;
        }

        .body-text {
            color: #4b5563;
            font-size: 15px;
            margin-bottom: 20px;
        }

        /* ---- POLICY CARD ---- */
        .policy-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin: 24px 0;
        }

        .policy-card-header {
            background: #f1f5f9;
            padding: 12px 20px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #64748b;
        }

        .policy-card-body {
            padding: 20px;
        }

        .policy-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
        }

        .policy-row:last-child {
            border-bottom: none;
        }

        .policy-row .label {
            color: #6b7280;
        }

        .policy-row .value {
            font-weight: 600;
            color: #111827;
        }

        .value-danger {
            color: #ef4444 !important;
        }

        .value-warning {
            color: #f59e0b !important;
        }

        /* ---- URGENCY BOX ---- */
        .urgency-box {
            border-radius: 8px;
            padding: 16px 20px;
            margin: 24px 0;
            font-size: 14px;
            font-weight: 500;
        }

        .urgency-box-expired {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            color: #b91c1c;
        }

        .urgency-box-expiring {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            color: #92400e;
        }

        /* ---- CTA BUTTON ---- */
        .cta-wrap {
            text-align: center;
            margin: 32px 0;
        }

        .cta-button {
            display: inline-block;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
        }

        .cta-expired {
            background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
        }

        .cta-expiring {
            background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
        }

        /* ---- DIVIDER ---- */
        .divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 28px 0;
        }

        /* ---- FOOTER ---- */
        .footer {
            padding: 24px 32px;
            background: #f9fafb;
            text-align: center;
        }

        .footer p {
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 4px;
        }

        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }

        .footer .company-name {
            font-weight: 600;
            color: #6b7280;
            font-size: 13px;
        }
    </style>
</head>

<body>
    <div class="wrapper">

        {{-- ===== HEADER ===== --}}
        <div class="header {{ $noticeType === 'expired' ? 'header-expired' : 'header-expiring' }}">
            <span class="header-icon">{{ $noticeType === 'expired' ? '⚠️' : '🔔' }}</span>
            <h1>{{ $noticeType === 'expired' ? 'Your Policy Has Expired' : 'Policy Renewal Reminder' }}</h1>
            <p class="subtitle">{{ $tenantName }}</p>
        </div>

        {{-- ===== SENDER BANNER ===== --}}
        <div class="sender-banner">
            This notice is sent on behalf of <strong>{{ $tenantName }}</strong>
        </div>

        {{-- ===== MAIN CONTENT ===== --}}
        <div class="content">
            <p class="greeting">Dear {{ $customerName }},</p>

            @if ($noticeType === 'expired')
                <p class="body-text">
                    We are writing to inform you that your insurance policy listed below has <strong>expired</strong>.
                    Your coverage is no longer active. Please contact us or renew immediately to restore your protection.
                </p>
            @else
                <p class="body-text">
                    This is a friendly reminder that your insurance policy is <strong>expiring soon</strong>.
                    To avoid any lapse in coverage, please take action before the expiry date.
                </p>
            @endif

            {{-- ===== POLICY CARD ===== --}}
            <div class="policy-card">
                <div class="policy-card-header">Policy Details</div>
                <div class="policy-card-body">
                    <div class="policy-row">
                        <span class="label">Policy Number</span>
                        <span class="value">{{ $policyNumber }}</span>
                    </div>
                    @if ($policyClass)
                    <div class="policy-row">
                        <span class="label">Policy Class</span>
                        <span class="value">{{ $policyClass }}</span>
                    </div>
                    @endif
                    <div class="policy-row">
                        <span class="label">Effective Date</span>
                        <span class="value">{{ $effectiveDate }}</span>
                    </div>
                    <div class="policy-row">
                        <span class="label">Expiry Date</span>
                        <span class="value {{ $noticeType === 'expired' ? 'value-danger' : 'value-warning' }}">
                            {{ $expiryDate }}
                        </span>
                    </div>
                    @if ($premiumAmount)
                    <div class="policy-row">
                        <span class="label">Premium Amount</span>
                        <span class="value">{{ $premiumAmount }}</span>
                    </div>
                    @endif
                </div>
            </div>

            {{-- ===== URGENCY BOX ===== --}}
            <div class="urgency-box {{ $noticeType === 'expired' ? 'urgency-box-expired' : 'urgency-box-expiring' }}">
                @if ($noticeType === 'expired')
                    ⚠️ <strong>Action Required:</strong> Your policy expired on {{ $expiryDate }}.
                    Please renew as soon as possible to reinstate your coverage.
                @else
                    🕐 <strong>Reminder:</strong> Your policy expires on {{ $expiryDate }} — that's
                    in <strong>{{ $daysUntilExpiry }} day(s)</strong>. Renew now to stay covered.
                @endif
            </div>

            {{-- ===== CTA BUTTON ===== --}}
            <div class="cta-wrap">
                <a href="{{ $renewalUrl }}"
                   class="cta-button {{ $noticeType === 'expired' ? 'cta-expired' : 'cta-expiring' }}">
                    {{ $noticeType === 'expired' ? 'Renew Policy Now' : 'Renew Before It Expires' }} →
                </a>
            </div>

            <hr class="divider">

            <p class="body-text" style="font-size:13px; text-align:center;">
                If you have already renewed or have any questions, please reply to this email or contact your
                insurance broker directly.
            </p>
        </div>

        {{-- ===== FOOTER ===== --}}
        <div class="footer">
            <p class="company-name">{{ $tenantName }}</p>
            @if ($tenantContact)
                <p><a href="mailto:{{ $tenantContact }}">{{ $tenantContact }}</a></p>
            @endif
            <p style="margin-top:8px;">© {{ date('Y') }} {{ $tenantName }}. All rights reserved.</p>
            <p style="margin-top:4px; font-size:11px;">Powered by InsurePal</p>
        </div>

    </div>
</body>

</html>
