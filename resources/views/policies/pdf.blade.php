<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Policy Certificate - {{ $policy->policy_number }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .policy-title {
            font-size: 20px;
            margin-bottom: 5px;
        }
        .policy-number {
            font-size: 16px;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            background-color: #f8f9fa;
            padding: 8px 12px;
            border-left: 4px solid #0066cc;
            margin-bottom: 15px;
        }
        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        .info-label {
            display: table-cell;
            width: 150px;
            font-weight: bold;
            padding-right: 15px;
        }
        .info-value {
            display: table-cell;
        }
        .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .coverage-table th,
        .coverage-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .coverage-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .amount {
            font-weight: bold;
            color: #0066cc;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .signature-section {
            display: table;
            width: 100%;
            margin-top: 40px;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 20px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $policy->tenant->name }}</div>
        <div class="policy-title">INSURANCE POLICY CERTIFICATE</div>
        <div class="policy-number">Policy No: {{ $policy->policy_number }}</div>
    </div>

    <div class="section">
        <div class="section-title">POLICY HOLDER INFORMATION</div>
        @if($policy->customer->type === 'individual')
            <div class="info-row">
                <div class="info-label">Full Name:</div>
                <div class="info-value">{{ $policy->customer->first_name }} {{ $policy->customer->last_name }}</div>
            </div>
        @else
            <div class="info-row">
                <div class="info-label">Company Name:</div>
                <div class="info-value">{{ $policy->customer->company_name }}</div>
            </div>
        @endif
        <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">{{ $policy->customer->email }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Phone:</div>
            <div class="info-value">{{ $policy->customer->phone }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Address:</div>
            <div class="info-value">{{ $policy->customer->address }}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">POLICY DETAILS</div>
        <div class="info-row">
            <div class="info-label">Product:</div>
            <div class="info-value">{{ $policy->insuranceProduct->name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Policy Status:</div>
            <div class="info-value">{{ strtoupper($policy->status) }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Effective Date:</div>
            <div class="info-value">{{ $policy->effective_date->format('F d, Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Expiry Date:</div>
            <div class="info-value">{{ $policy->expiry_date->format('F d, Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Frequency:</div>
            <div class="info-value">{{ ucfirst($policy->payment_frequency) }}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">COVERAGE DETAILS</div>
        @if($policy->coverage_details)
            @foreach($policy->coverage_details as $key => $value)
            <div class="info-row">
                <div class="info-label">{{ ucfirst(str_replace('_', ' ', $key)) }}:</div>
                <div class="info-value">{{ is_array($value) ? implode(', ', $value) : $value }}</div>
            </div>
            @endforeach
        @endif
    </div>

    <div class="section">
        <div class="section-title">PREMIUM INFORMATION</div>
        <table class="coverage-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (NGN)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Base Premium</td>
                    <td class="amount">&#8358;{{ number_format($policy->premium_amount, 2) }}</td>
                </tr>
                <tr>
                    <td>Commission</td>
                    <td class="amount">&#8358;{{ number_format($policy->commission_amount, 2) }}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f8f9fa;">
                    <td>Total Amount</td>
                    <td class="amount">&#8358;{{ number_format($policy->total_amount, 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    @if($policy->terms_conditions)
    <div class="section">
        <div class="section-title">TERMS & CONDITIONS</div>
        <div>{{ $policy->terms_conditions }}</div>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                <strong>Policy Holder Signature</strong><br>
                Date: ________________
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                <strong>{{ $policy->tenant->name }}</strong><br>
                Authorized Signatory
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This policy certificate was generated on {{ now()->format('F d, Y \a\t g:i A') }}</p>
        <p>{{ $policy->tenant->name }} | {{ $policy->tenant->email }} | {{ $policy->tenant->phone }}</p>
        @if($policy->tenant->address)
        <p>{{ $policy->tenant->address }}</p>
        @endif
        <p><strong>Policy Generated via Insure Pal SaaS Platform</strong></p>
    </div>
</body>
</html>