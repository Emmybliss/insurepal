<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.3;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 18px 28px;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
        }
        .logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 4px;
        }
        .company-name {
            font-size: 15px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 2px;
        }
        .document-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .receipt-info {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        .receipt-info-row {
            display: table-row;
        }
        .receipt-info-label {
            display: table-cell;
            width: 40%;
            padding: 3px 0;
            font-weight: bold;
            color: #64748b;
        }
        .receipt-info-value {
            display: table-cell;
            padding: 3px 0;
            color: #1e293b;
        }
        .section {
            margin-bottom: 8px;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            width: 35%;
            padding: 4px 8px;
            background-color: #f1f5f9;
            font-weight: 600;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .info-value {
            display: table-cell;
            padding: 4px 8px;
            background-color: #ffffff;
            color: #1e293b;
            border: 1px solid #e2e8f0;
        }
       .amount-section {
    background: #1e293b; /* dark slate */
    padding: 10px;
    border-radius: 6px;
    margin: 8px 0;
    text-align: center;
}

.amount-label {
    color: #cbd5f5;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 3px;
}

.amount-value {
    color: #ffffff;
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 1px;
}
        .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 9px;
        }
        .stamp-section {
            margin-top: 8px;
            text-align: right;
        }
        .stamp {
            display: inline-block;
            padding: 5px 16px;
            border: 2px solid #10b981;
            border-radius: 6px;
            color: #10b981;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .note {
            background-color: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 6px 10px;
            margin-top: 8px;
            border-radius: 3px;
        }
        .note-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 2px;
        }
        .note-text {
            color: #78350f;
            font-size: 9px;
        }
    </style>
</head>
<body>
   
    <div class="container">
        <!-- Header -->
        <div class="header">
            @if($logo_data)
                <img src="{{ $logo_data }}" alt="Company Logo" class="logo">
            @else
                <div class="company-name">{{ $company_name }}</div>
            @endif
            <div class="company-name">{{ $company_name }}</div>
            <div style="color: #64748b; margin-top: 5px;">
                {{ $company_address }}<br>
                {{ $company_email }} | {{ $company_phone }}
            </div>
            <div class="document-title">Payment Receipt</div>
        </div>

        <!-- Receipt Info -->
        <div class="receipt-info">
            <div class="receipt-info-row">
                <div class="receipt-info-label">Receipt Number:</div>
                <div class="receipt-info-value"><strong>{{ $receipt_number }}</strong></div>
            </div>
            <div class="receipt-info-row">
                <div class="receipt-info-label">Receipt Date:</div>
                <div class="receipt-info-value">{{ $receipt_date }}</div>
            </div>
            <div class="receipt-info-row">
                <div class="receipt-info-label">Payment Reference:</div>
                <div class="receipt-info-value">{{ $payment_reference }}</div>
            </div>
        </div>

        <!-- Customer Details -->
        <div class="section">
            <div class="section-title">Billed To</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-label">Company Name</div>
                    <div class="info-value">{{ $customer_name }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email</div>
                    <div class="info-value">{{ $customer_email }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone</div>
                    <div class="info-value">{{ $customer_phone ?? 'N/A' }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address</div>
                    <div class="info-value">{{ $customer_address }}</div>
                </div>
            </div>
        </div>

        <!-- Payment Details -->
        <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-label">Subscription Plan</div>
                    <div class="info-value"><strong>{{ $plan_name }}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Description</div>
                    <div class="info-value">{{ $plan_description }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Billing Cycle</div>
                    <div class="info-value">{{ $billing_cycle }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Service Period</div>
                    <div class="info-value">{{ $period_start }} - {{ $period_end }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Payment Date</div>
                    <div class="info-value">{{ $payment_date }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Payment Method</div>
                    <div class="info-value">
                        {{ $payment_method }}
                        @if($card_type && $last4)
                            ({{ $card_type }} ****{{ $last4 }})
                        @endif
                    </div>
                </div>
                @if($bank)
                    <div class="info-row">
                        <div class="info-label">Bank</div>
                        <div class="info-value">{{ $bank }}</div>
                    </div>
                @endif
            </div>
        </div>

        <!-- Amount Paid -->
        <div class="amount-section">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">
                {{ strtoupper($currency) }} {{ number_format($amount, 2) }}
            </div>
        </div>

        <!-- Stamp -->
        <div class="stamp-section">
            <div class="stamp">PAID</div>
        </div>

        <!-- Note -->
        <div class="note">
            <div class="note-title">Note:</div>
            <div class="note-text">
                This is a computer-generated receipt and does not require a physical signature.
                For any queries regarding this payment, please contact us at {{ $company_email }}.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p style="margin-top: 10px;">
                This receipt was generated on {{ $receipt_date }}.<br>
                {{ $company_name }} - Streamlining Insurance Management
            </p>
        </div>
    </div>
</body>
</html>
