<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NAICOM Compliance Report - {{ ucfirst($period) }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            font-size: 12px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 10px;
        }
        .company-name-logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .report-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .report-period {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .naicom-logo {
            font-size: 16px;
            color: #059669;
            font-weight: bold;
        }
        .naicom-logo-header {
            text-align: center;
            margin-bottom: 15px;
        }
        .naicom-logo-header img {
            max-width: 150px;
            height: auto;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-left: 4px solid #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table th,
        .info-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .info-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .info-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .amount {
            font-weight: bold;
            color: #1e40af;
            text-align: right;
        }
        .summary-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .summary-row {
            display: table-row;
        }
        .summary-cell {
            display: table-cell;
            width: 50%;
            padding: 10px;
            vertical-align: top;
        }
        .summary-box {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            background-color: #f9f9f9;
        }
        .summary-box h4 {
            margin-top: 0;
            color: #1e40af;
            font-size: 14px;
        }
        .key-metrics {
            display: table;
            width: 100%;
        }
        .metric-row {
            display: table-row;
        }
        .metric-label {
            display: table-cell;
            width: 70%;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        .metric-value {
            display: table-cell;
            width: 30%;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
            text-align: right;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            border-top: 2px solid #1e40af;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        .disclaimer {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 11px;
        }
        .page-break {
            page-break-before: always;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .no-border {
            border: none !important;
        }
        .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <table style="width: 100%; border: none; margin-bottom: 2px;">
            <tr>
                <td style="width: 5%; text-align: left; vertical-align: middle; border: none;">
                    @if(isset($data['company_info']['tenant_logo']) && $data['company_info']['tenant_logo'])
                        <img src="{{ $data['company_info']['tenant_logo'] }}" alt="Company Logo" class="logo">
                    @endif
                    
                </td>

                <td style="width: 90%; text-align: center; vertical-align: middle; border: none;">
                    <div class="company-name-logo" style="font-size: 25px; text-transform: uppercase; font-weight: bold; margin-top: 5px;">
                        {{ $data['company_info']['name'] }}
                    </div>
                </td>

                <td style="width: 5%; text-align: right; vertical-align: middle; border: none;">
                    @if(isset($data['company_info']['naicom_logo_data']) && $data['company_info']['naicom_logo_data'])
                        <img src="{{ $data['company_info']['naicom_logo_data'] }}" alt="NAICOM Logo" class="logo">
                    @endif
                </td>
            </tr>
        </table>

        <div style="text-align: center;">
            <div class="report-title">NAICOM COMPLIANCE REPORT</div>
            <div class="report-period">
                <strong>{{ ucfirst($period) }} Period:</strong> 
                {{ $startDate->format('M d, Y') }} — {{ $endDate->format('M d, Y') }}
            </div>
            
            <div style="font-size: 10px; color: #555; margin-top: 5px;">
                {{ $data['company_info']['address'] }} | 
                Tel: {{ $data['company_info']['phone'] }} | 
                {{ $data['company_info']['email'] }}
            </div>
            <div style="font-size: 10px; color: #1e40af;">{{ $data['company_info']['website'] }}</div>
        </div>
    </div>

    <!-- Company Information -->
    <div class="section">
        <div class="section-title">Company Information</div>
        <table class="info-table">
            <tr>
                <th>Company Name</th>
                <td>{{ $data['company_info']['name'] }}</td>
            </tr>
            <tr>
                <th>Registration Number</th>
                <td>{{ $data['company_info']['registration_number'] }}</td>
            </tr>
            <tr>
                <th>License Number</th>
                <td>{{ $data['company_info']['license_number'] }}</td>
            </tr>
            <tr>
                <th>Address</th>
                <td>{{ $data['company_info']['address'] }}</td>
            </tr>
            <tr>
                <th>Phone</th>
                <td>{{ $data['company_info']['phone'] }}</td>
            </tr>
            <tr>
                <th>Email</th>
                <td>{{ $data['company_info']['email'] }}</td>
            </tr>
            <tr>
                <th>Report Period</th>
                <td>{{ $startDate->format('F j, Y') }} - {{ $endDate->format('F j, Y') }}</td>
            </tr>
        </table>
    </div>

    <!-- Financial Summary -->
    <div class="section">
        <div class="section-title">Financial Summary</div>
        <div class="summary-grid">
            <div class="summary-row">
                <div class="summary-cell">
                    <div class="summary-box">
                        <h4>Premium Information</h4>
                        <div class="key-metrics">
                            <div class="metric-row">
                                <div class="metric-label">Gross Premium Written:</div>
                                <div class="metric-value">&#8358;{{ number_format($data['financial_summary']['gross_premium_written'], 2) }}</div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-label">Net Premium Written:</div>
                                <div class="metric-value">&#8358;{{ number_format($data['financial_summary']['net_premium_written'], 2) }}</div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-label">Outstanding Premiums:</div>
                                <div class="metric-value">&#8358;{{ number_format($data['financial_summary']['outstanding_premiums'], 2) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="summary-cell">
                    <div class="summary-box">
                        <h4>Commission & Refunds</h4>
                        <div class="key-metrics">
                            <div class="metric-row">
                                <div class="metric-label">Commission Paid:</div>
                                <div class="metric-value">&#8358;{{ number_format($data['financial_summary']['commission_paid'], 2) }}</div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-label">Premium Refunded:</div>
                                <div class="metric-value">&#8358;{{ number_format($data['financial_summary']['premium_refunded'], 2) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Business Statistics by Class -->
    <div class="section">
        <div class="section-title">Business Statistics by Class</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th>Class of Business</th>
                    <th>Product Name</th>
                    <th>Number of Policies</th>
                    <th>Total Premium (&#8358;)</th>
                    <th>Average Premium (&#8358;)</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalPolicies = 0;
                    $totalPremium = 0;
                @endphp
                @foreach($data['policy_stats'] as $stat)
                <tr>
                    <td>{{ ucfirst($stat->class_of_business) }}</td>
                    <td>{{ $stat->product_name }}</td>
                    <td class="text-center">{{ number_format($stat->policy_count) }}</td>
                    <td class="amount">{{ number_format($stat->total_premium, 2) }}</td>
                    <td class="amount">{{ number_format($stat->average_premium, 2) }}</td>
                </tr>
                @php
                    $totalPolicies += $stat->policy_count;
                    $totalPremium += $stat->total_premium;
                @endphp
                @endforeach
                <tr class="total-row">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td class="text-center"><strong>{{ number_format($totalPolicies) }}</strong></td>
                    <td class="amount"><strong>{{ number_format($totalPremium, 2) }}</strong></td>
                    <td class="amount"><strong>{{ $totalPolicies > 0 ? number_format($totalPremium / $totalPolicies, 2) : '0.00' }}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <!-- Customer Demographics -->
    <div class="section">
        <div class="section-title">Customer Demographics</div>
        <div class="summary-grid">
            <div class="summary-row">
                <div class="summary-cell">
                    <div class="summary-box">
                        <h4>Customer Distribution</h4>
                        <div class="key-metrics">
                            <div class="metric-row">
                                <div class="metric-label">Individual Customers:</div>
                                <div class="metric-value">{{ number_format($data['customer_demographics']['individual_customers']) }}</div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-label">Corporate Customers:</div>
                                <div class="metric-value">{{ number_format($data['customer_demographics']['corporate_customers']) }}</div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-label">Total Active Customers:</div>
                                <div class="metric-value">{{ number_format($data['customer_demographics']['total_active_customers']) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="summary-cell">
                    <div class="summary-box">
                        <h4>Period Activity</h4>
                        <div class="key-metrics">
                            <div class="metric-row">
                                <div class="metric-label">New Customers:</div>
                                <div class="metric-value">{{ number_format($data['customer_demographics']['new_customers_period']) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Claims Information -->
    <div class="section">
        <div class="section-title">Claims Information</div>
        <table class="info-table">
            <tr>
                <th>Total Claims Reported</th>
                <td class="amount">{{ number_format($data['claims_data']['total_claims_reported']) }}</td>
            </tr>
            <tr>
                <th>Total Claims Paid (&#8358;)</th>
                <td class="amount">{{ number_format($data['claims_data']['total_claims_paid'], 2) }}</td>
            </tr>
            <tr>
                <th>Total Claims Outstanding (&#8358;)</th>
                <td class="amount">{{ number_format($data['claims_data']['total_claims_outstanding'], 2) }}</td>
            </tr>
            <tr>
                <th>Claims Ratio (%)</th>
                <td class="amount">{{ number_format($data['claims_data']['claims_ratio'], 2) }}%</td>
            </tr>
        </table>
        
        <div class="disclaimer">
            <strong>Note:</strong> Claims data is currently under development. The values shown are placeholders and will be updated when the claims management module is implemented.
        </div>
    </div>

    <!-- Reinsurance Information -->
    <div class="section">
        <div class="section-title">Reinsurance Information</div>
        <table class="info-table">
            <tr>
                <th>Facultative Premium Ceded (&#8358;)</th>
                <td class="amount">{{ number_format($data['reinsurance_info']['facultative_premium_ceded'], 2) }}</td>
            </tr>
            <tr>
                <th>Treaty Premium Ceded (&#8358;)</th>
                <td class="amount">{{ number_format($data['reinsurance_info']['treaty_premium_ceded'], 2) }}</td>
            </tr>
            <tr>
                <th>Commission Received (&#8358;)</th>
                <td class="amount">{{ number_format($data['reinsurance_info']['commission_received'], 2) }}</td>
            </tr>
            <tr>
                <th>Claims Recovered (&#8358;)</th>
                <td class="amount">{{ number_format($data['reinsurance_info']['claims_recovered'], 2) }}</td>
            </tr>
        </table>
        
        <div class="disclaimer">
            <strong>Note:</strong> Reinsurance data is currently under development. The values shown are placeholders and will be updated when the reinsurance module is implemented.
        </div>
    </div>

    <!-- Regulatory Compliance Statement -->
    <div class="section">
        <div class="section-title">Regulatory Compliance Statement</div>
        <p>This report has been prepared in accordance with the National Insurance Commission (NAICOM) reporting requirements and guidelines. All financial figures are presented in Nigerian Naira (&#8358;) and reflect the business activities for the period specified.</p>
        
        <p><strong>Certification:</strong> I hereby certify that the information contained in this report is true and accurate to the best of my knowledge and belief, and has been prepared in accordance with the applicable NAICOM regulations.</p>
        
        <div style="margin-top: 40px;">
            <table class="info-table no-border" style="border: none;">
                <tr>
                    <td style="width: 50%; border: none; text-align: center; padding-top: 40px;">
                        <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto;">
                            <strong>Authorized Signatory</strong><br>
                            {{ $data['company_info']['name'] }}
                        </div>
                    </td>
                    <td style="width: 50%; border: none; text-align: center; padding-top: 40px;">
                        <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto;">
                            <strong>Date</strong><br>
                            {{ now()->format('F j, Y') }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This NAICOM compliance report was generated on {{ now()->format('F j, Y \\a\\t g:i A') }}</p>
        <p>{{ $data['company_info']['name'] }} | {{ $data['company_info']['email'] }} | {{ $data['company_info']['phone'] }}</p>
        @if($data['company_info']['address'])
        <p>{{ $data['company_info']['address'] }}</p>
        @endif
        <p><strong>Generated via Insure Pal SaaS Platform | Compliant with NAICOM Standards</strong></p>
    </div>
</body>
</html>