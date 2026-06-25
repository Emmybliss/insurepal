<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAICOM Compliance Report</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2E86AB;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #2E86AB;
            font-size: 24px;
            margin: 0 0 10px 0;
        }
        
        .naicom-logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 10px;
        }
        
        .company-name-logo {
            color: #2E86AB;
            font-size: 24px;
            margin: 0 0 10px 0;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 14px;
            margin: 0;
        }
        
        .company-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .company-info h3 {
            color: #2E86AB;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-label {
            font-weight: bold;
            color: #555;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section h3 {
            color: #2E86AB;
            font-size: 16px;
            margin: 0 0 15px 0;
            padding: 10px;
            background-color: #e3f2fd;
            border-left: 4px solid #2E86AB;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .kpi-card {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2E86AB;
        }
        
        .kpi-title {
            font-size: 12px;
            color: #666;
            margin: 0 0 5px 0;
        }
        
        .kpi-value {
            font-size: 18px;
            font-weight: bold;
            color: #2E86AB;
            margin: 0;
        }
        
        .kpi-trend {
            font-size: 10px;
            color: #28a745;
            margin: 5px 0 0 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background-color: #2E86AB;
            color: white;
            font-weight: bold;
            font-size: 11px;
        }
        
        td {
            font-size: 11px;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .positive {
            color: #28a745;
        }
        
        .negative {
            color: #dc3545;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(isset($company_info['naicom_logo_data']) && $company_info['naicom_logo_data'])
            <img src="{{ $company_info['naicom_logo_data'] }}" alt="NAICOM Logo" class="naicom-logo">
        @else
            <h1 class="company-name-logo">NAICOM</h1>
        @endif
        @if(isset($company_info['tenant_logo']) && $company_info['tenant_logo'])
            <img src="{{ $company_info['tenant_logo'] }}" alt="Company Logo" class="naicom-logo">
        @else
            <h1 class="company-name-logo">{{ $companyName }}</h1>
        @endif
        <p class="subtitle">Generated on {{ $generatedAt }}</p>
        <p class="subtitle">Reporting Period: {{ $period }}</p>
    </div>

    <div class="company-info">
        <h3>Company Information</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Company Name:</span>
                <span>{{ $company_info['name'] ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Registration Number:</span>
                <span>{{ $company_info['registration_number'] ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">License Number:</span>
                <span>{{ $company_info['license_number'] ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Phone:</span>
                <span>{{ $company_info['phone'] ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span>{{ $company_info['email'] ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Address:</span>
                <span>{{ $company_info['address'] ?? 'N/A' }}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>Financial Summary</h3>
        <div class="kpi-grid">
            <div class="kpi-card">
                <p class="kpi-title">Gross Premium Written</p>
                <p class="kpi-value">&#8358;{{ number_format($financial_summary['gross_premium_written'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Net Premium Written</p>
                <p class="kpi-value">&#8358;{{ number_format($financial_summary['net_premium_written'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Commission Paid</p>
                <p class="kpi-value">&#8358;{{ number_format($financial_summary['commission_paid'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Outstanding Premiums</p>
                <p class="kpi-value">&#8358;{{ number_format($financial_summary['outstanding_premiums'] ?? 0, 2) }}</p>
            </div>
        </div>
    </div>

    @if(isset($policy_stats) && count($policy_stats) > 0)
    <div class="section">
        <h3>Policy Statistics by Product</h3>
        <table>
            <thead>
                <tr>
                    <th>Class of Business</th>
                    <th>Product Name</th>
                    <th>Policy Count</th>
                    <th>Total Premium</th>
                    <th>Average Premium</th>
                </tr>
            </thead>
            <tbody>
                @foreach($policy_stats as $policy)
                <tr>
                    <td>{{ $policy->class_of_business ?? 'N/A' }}</td>
                    <td>{{ $policy->product_name ?? 'N/A' }}</td>
                    <td>{{ number_format($policy->policy_count ?? 0) }}</td>
                    <td class="amount">&#8358;{{ number_format($policy->total_premium ?? 0, 2) }}</td>
                    <td class="amount">&#8358;{{ number_format($policy->average_premium ?? 0, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="section">
        <h3>Claims Information</h3>
        <div class="kpi-grid">
            <div class="kpi-card">
                <p class="kpi-title">Total Claims Reported</p>
                <p class="kpi-value">{{ number_format($claims_data['total_claims_reported'] ?? 0) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Total Claims Paid</p>
                <p class="kpi-value">&#8358;{{ number_format($claims_data['total_claims_paid'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Claims Ratio</p>
                <p class="kpi-value">{{ number_format($claims_data['claims_ratio'] ?? 0, 1) }}%</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Outstanding Claims</p>
                <p class="kpi-value">&#8358;{{ number_format($claims_data['total_claims_outstanding'] ?? 0, 2) }}</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>Customer Demographics</h3>
        <div class="kpi-grid">
            <div class="kpi-card">
                <p class="kpi-title">Individual Customers</p>
                <p class="kpi-value">{{ number_format($customer_demographics['individual_customers'] ?? 0) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Corporate Customers</p>
                <p class="kpi-value">{{ number_format($customer_demographics['corporate_customers'] ?? 0) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">New Customers (Period)</p>
                <p class="kpi-value">{{ number_format($customer_demographics['new_customers_period'] ?? 0) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Active Customers</p>
                <p class="kpi-value">{{ number_format($customer_demographics['total_active_customers'] ?? 0) }}</p>
            </div>
        </div>
    </div>

    @if(isset($reinsurance_info))
    <div class="section">
        <h3>Reinsurance Information</h3>
        <div class="kpi-grid">
            <div class="kpi-card">
                <p class="kpi-title">Facultative Premium Ceded</p>
                <p class="kpi-value">&#8358;{{ number_format($reinsurance_info['facultative_premium_ceded'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Treaty Premium Ceded</p>
                <p class="kpi-value">&#8358;{{ number_format($reinsurance_info['treaty_premium_ceded'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Commission Received</p>
                <p class="kpi-value">&#8358;{{ number_format($reinsurance_info['commission_received'] ?? 0, 2) }}</p>
            </div>
            <div class="kpi-card">
                <p class="kpi-title">Claims Recovered</p>
                <p class="kpi-value">&#8358;{{ number_format($reinsurance_info['claims_recovered'] ?? 0, 2) }}</p>
            </div>
        </div>
    </div>
    @endif

    <div class="footer">
        <p>This report was generated automatically by InsurePal on {{ $generatedAt }}</p>
        <p>For questions about this report, please contact your system administrator.</p>
    </div>
</body>
</html>
