<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Customer Profile - {{ $customer->display_name }}</title>
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
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
        }

        .logo-container {
            width: 80px;
            height: 80px;
            background-color: #3b82f6;
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
            color: #1e293b;
            margin: 0;
        }

        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin: 5px 0 0 0;
        }

        .container {
            padding: 40px;
        }

        .section {
            margin-bottom: 15px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #334155;
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

        .badge-info {
            background-color: #dbeafe;
            color: #1e40af;
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
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .stats-grid {
            display: table;
            width: 100%;
        }

        .stats-item {
            display: table-cell;
            width: 33.33%;
            text-align: center;
        }

        .stats-value {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
        }

        .stats-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
        }
    </style>
</head>

<body>
    <div class="header">
        <div style="display: table; width: 100%;">
            <div style="display: table-cell; width: 100px; vertical-align: middle;">
                <div class="logo-container">
                    @php
                        $name = $customer->display_name ?? 'C';
                        $initials = collect(explode(' ', $name))->map(fn($n) => $n[0] ?? '')->take(2)->join('');
                        
                        $hasImage = false;
                        $imageSrc = '';
                        $imagePath = null;

                        if ($customer->type === 'corporate' && $customer->logo) {
                            $imagePath = $customer->logo;
                        } elseif ($customer->user && $customer->user->avatar) {
                            $imagePath = $customer->user->avatar;
                        }

                        if ($imagePath) {
                            $path = storage_path('app/public/' . $imagePath);
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
                <h1 class="title">{{ $customer->display_name }}</h1>
                <p class="subtitle">Customer Profile | Generated on {{ date('d M, Y') }}</p>
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
        
        $activePolicies = $customer->policies->filter(function($p) {
            $status = getDynamicPolicyStatus($p);
            return in_array($status, ['active', 'expiring_soon']);
        });
        $activePremium = $activePolicies->sum('premium_amount');
    @endphp

    <div class="container">
        <div class="section">
            <h2 class="section-title">Personal Information</h2>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Primary Email</div>
                    <div class="value">{{ $customer->email }}</div>
                </div>
                <div class="grid-item">
                    <div class="label">Phone Number</div>
                    <div class="value">{{ $customer->phone ?? 'N/A' }}</div>
                </div>
            </div>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Customer Type</div>
                    <div class="value">
                        <span class="badge badge-info">{{ ucfirst($customer->type) }}</span>
                    </div>
                </div>
                <div class="grid-item">
                    <div class="label">Status</div>
                    <div class="value">
                        <span class="badge {{ $customer->is_active ? 'badge-success' : 'badge-danger' }}">
                            {{ $customer->is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </div>
                </div>
            </div>
            @if ($customer->type === 'corporate')
                <div class="grid">
                    <div class="grid-item">
                        <div class="label">Company Name</div>
                        <div class="value">{{ $customer->company_name ?? 'N/A' }}</div>
                    </div>
                </div>
            @endif
        </div>

        <div class="section">
            <h2 class="section-title">Address Details</h2>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">Address</div>
                    <div class="value">{{ $customer->address ?? 'N/A' }}</div>
                </div>
                <div class="grid-item">
                    <div class="label">City</div>
                    <div class="value">{{ $customer->city ?? 'N/A' }}</div>
                </div>
            </div>
            <div class="grid">
                <div class="grid-item">
                    <div class="label">State / Region</div>
                    <div class="value">{{ $customer->state ?? 'N/A' }}</div>
                </div>
                <div class="grid-item">
                    <div class="label">Country</div>
                    <div class="value">{{ $customer->country ?? 'N/A' }}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Account Summary</h2>
            <div class="stats-box">
                <div class="stats-grid">
                    <div class="stats-item">
                        <div class="stats-value">{{ $customer->policies->count() }}</div>
                        <div class="stats-label">Total Policies</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">{{ $customer->quotes->count() }}</div>
                        <div class="stats-label">Total Quotes</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">
                            &#8358;{{ number_format($activePremium, 2) }}
                        </div>
                        <div class="stats-label">Active Premium</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Policies</h2>
            @if ($customer->policies->count() > 0)
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: left;">
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Policy #</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Product</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Premium</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Status</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($customer->policies as $policy)
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ $policy->policy_number }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ $policy->policyProduct?->name ?? 'N/A' }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    &#8358;{{ number_format($policy->premium_amount, 2) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    @php
                                        $derivedStatus = getDynamicPolicyStatus($policy);
                                        $badgeClass = match($derivedStatus) {
                                            'active' => 'badge-success',
                                            'expiring_soon' => 'badge-warning',
                                            'expired' => 'badge-danger',
                                            default => 'badge-info',
                                        };
                                    @endphp
                                    <span class="badge {{ $badgeClass }}">
                                        {{ str_replace('_', ' ', strtoupper($derivedStatus)) }}
                                    </span>
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ $policy->expiry_date ? $policy->expiry_date->format('d M, Y') : 'N/A' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 14px; color: #64748b;">No policies recorded for this customer.</p>
            @endif
        </div>

        <div class="section">
            <h2 class="section-title">Quotes</h2>
            @if ($customer->quotes->count() > 0)
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: left;">
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Quote #</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Product</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Premium</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Status</th>
                            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0;">Valid Until</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($customer->quotes as $quote)
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">{{ $quote->quote_number }}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ $quote->insuranceProduct?->name ?? 'N/A' }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    &#8358;{{ number_format($quote->premium_amount, 2) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ ucfirst($quote->status) }}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                                    {{ $quote->valid_until ? $quote->valid_until->format('d M, Y') : 'N/A' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 14px; color: #64748b;">No quotes recorded for this customer.</p>
            @endif
        </div>
    </div>

    <div class="footer">
        <p>&copy; {{ date('Y') }} {{ $company->name }}. All rights reserved.</p>
        <p>This is an automatically generated document. Confidentiality is advised.</p>
    </div>
</body>

</html>
