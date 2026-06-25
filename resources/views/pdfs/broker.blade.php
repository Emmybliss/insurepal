<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Broker Profile - {{ $broker->company_name }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            padding: 30px;
            background-color: #f0f9ff;
            border-bottom: 2px solid #bae6fd;
            display: flex;
            align-items: center;
        }
        .logo-container {
            width: 80px;
            height: 80px;
            background-color: #0369a1;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            margin-right: 20px;
        }
        .title-container {
            flex: 1;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #0c4a6e;
            margin: 0;
        }
        .subtitle {
            font-size: 14px;
            color: #075985;
            margin: 5px 0 0 0;
        }
        .container {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .grid {
            display: table;
            width: 100%;
        }
        .grid-item {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-bottom: 15px;
        }
        .label {
            font-size: 12px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .value {
            font-size: 14px;
            color: #1e293b;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success {
            background-color: #dcfce7;
            color: #166534;
        }
        .badge-warning {
            background-color: #fef9c3;
            color: #854d0e;
        }
        .badge-danger {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .footer {
            margin-top: 50px;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
        .stats-box {
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-top: 20px;
        }
        .stats-grid {
            display: table;
            width: 100%;
        }
        .stats-item {
            display: table-cell;
            width: 25%;
            text-align: center;
        }
        .stats-value {
            font-size: 22px;
            font-weight: bold;
            color: #0369a1;
        }
        .stats-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: table; width: 100%;">
            <div style="display: table-cell; width: 100px; vertical-align: middle;">
                <div class="logo-container">
                    @php
                        $name = $broker->company_name ?? 'B';
                        $initials = collect(explode(' ', $name))->map(fn($n) => $n[0] ?? '')->take(2)->join('');
                        
                        $hasImage = false;
                        $imageSrc = '';
                        if ($broker->logo) {
                            $path = storage_path('app/public/' . $broker->logo);
                            if (file_exists($path)) {
                                $hasImage = true;
                                $ext = pathinfo($path, PATHINFO_EXTENSION);
                                $imageSrc = 'data:image/' . ($ext === 'jpg' ? 'jpeg' : $ext) . ';base64,' . base64_encode(file_get_contents($path));
                            }
                        }
                    @endphp
                    @if ($hasImage)
                        <img src="{{ $imageSrc }}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                    @else
                        {{ strtoupper($initials) }}
                    @endif
                </div>
            </div>
            <div style="display: table-cell; vertical-align: middle;">
                <h1 class="title">{{ $broker->company_name }}</h1>
                <p class="subtitle">Broker Certificate of Information | Generated on {{ date('d M, Y') }}</p>
            </div>
        </div>
    </div>

    @php
        if (!function_exists('getDynamicPolicyStatus')) {
            function getDynamicPolicyStatus($policy) {
                if ($policy->status !== 'active' && $policy->status !== 'expired') return $policy->status;
                if (!$policy->expiry_date) return $policy->status;
                
                $today = \Carbon\Carbon::now()->startOfDay();
                $expiryDate = \Carbon\Carbon::parse($policy->expiry_date)->startOfDay();
                
                if ($expiryDate->lessThan($today)) return 'expired';
                
                $diffDays = $today->diffInDays($expiryDate);
                if ($diffDays <= 60) return 'expiring_soon';
                
                return 'active';
            }
        }
        
        $activePolicies = $broker->policies->filter(function($p) {
            $status = getDynamicPolicyStatus($p);
            return in_array($status, ['active', 'expiring_soon']);
        });
        $activePremium = $activePolicies->sum('premium_amount');
        $activePoliciesCount = $activePolicies->count();
    @endphp

    <div class="container">
        <div class="section">
            <h2 class="section-title">Brokerage Information</h2>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Company Email</div>
                    <div class="value">{{ $broker->contact_email }}</div>
                </div>
                <div class="grid-item">
                    <div class="label">Phone Number</div>
                    <div class="value">{{ $broker->contact_phone }}</div>
                </div>
            </div>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Status</div>
                    <div class="value">
                        <span class="badge {{ $broker->status === 'active' ? 'badge-success' : 'badge-warning' }}">
                            {{ ucfirst($broker->status) }}
                        </span>
                    </div>
                </div>
                <div class="grid-item">
                    <div class="label">Commission Rate</div>
                    <div class="value">{{ $broker->settings['commission_rate'] ?? 10 }}%</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Office Address</h2>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Full Address</div>
                    <div class="value">
                        {{ $broker->address }}<br>
                        {{ $broker->city }}, {{ $broker->state }} {{ $broker->postal_code }}<br>
                        {{ $broker->country }}
                    </div>
                </div>
                <div class="grid-item">
                    <div class="label">Payment Terms</div>
                    <div class="value">{{ $broker->settings['payment_terms'] ?? 30 }} Days</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Performance Metrics</h2>
            <div class="stats-box">
                <div class="stats-grid">
                    <div class="stats-item">
                        <div class="stats-value">{{ $broker->customers->count() }}</div>
                        <div class="stats-label">Customers</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">{{ $broker->policies->count() }}</div>
                        <div class="stats-label">Total Policies</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">{{ $activePoliciesCount }}</div>
                        <div class="stats-label">Active Policies</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">&#8358;{{ number_format($activePremium, 0) }}</div>
                        <div class="stats-label">Premium Val.</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">All Policies</h2>
            @if($broker->policies->count() > 0)
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: left;">
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Policy #</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Customer</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Premium</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Status</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($broker->policies as $policy)
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $policy->policy_number }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $policy->customer?->display_name ?? 'N/A' }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">&#8358;{{ number_format($policy->premium_amount, 2) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    @php
                                        $derivedStatus = getDynamicPolicyStatus($policy);
                                        $badgeClass = match($derivedStatus) {
                                            'active' => 'badge-success',
                                            'expiring_soon' => 'badge-warning',
                                            'expired' => 'badge-danger',
                                            default => 'badge-warning',
                                        };
                                    @endphp
                                    <span class="badge {{ $badgeClass }}">
                                        {{ str_replace('_', ' ', strtoupper($derivedStatus)) }}
                                    </span>
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $policy->expiry_date ? $policy->expiry_date->format('d M, Y') : 'N/A' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 14px; color: #64748b;">No policies recorded for this broker.</p>
            @endif
        </div>

        <div class="section">
            <h2 class="section-title">All Quotes</h2>
            @if($broker->quotes->count() > 0)
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: left;">
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Quote #</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Customer</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Premium</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Status</th>
                            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Valid Until</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($broker->quotes as $quote)
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $quote->quote_number }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $quote->customer?->display_name ?? 'N/A' }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">&#8358;{{ number_format($quote->premium_amount, 2) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ ucfirst($quote->status) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $quote->valid_until ? $quote->valid_until->format('d M, Y') : 'N/A' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 14px; color: #64748b;">No quotes recorded for this broker.</p>
            @endif
        </div>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} {{ $company->name }}. Underwriter Managed.</p>
        <p>This report is for internal use only and serves as a record of broker performance.</p>
    </div>
</body>
</html>
