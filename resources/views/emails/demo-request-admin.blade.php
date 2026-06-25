<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Demo Request</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f3f4f6;
        }
        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #111827 0%, #1d4ed8 100%);
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
        }
        .header p {
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            margin-top: 4px;
        }
        .alert-badge {
            display: inline-block;
            background: #fbbf24;
            color: #78350f;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 4px 12px;
            border-radius: 20px;
            margin-bottom: 12px;
        }
        .content {
            padding: 36px 32px;
        }
        .lead-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 24px;
            margin: 20px 0;
        }
        .lead-card h3 {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 16px;
        }
        .field {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .field:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .field-label {
            font-size: 13px;
            color: #9ca3af;
            width: 90px;
            flex-shrink: 0;
        }
        .field-value {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
        }
        .field-value a {
            color: #3b82f6;
            text-decoration: none;
        }
        .cta-button {
            display: block;
            width: fit-content;
            margin: 28px auto 0;
            background: #1d4ed8;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
        }
        .footer {
            padding: 20px 32px;
            background: #f9fafb;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            font-size: 12px;
            color: #9ca3af;
        }
        .timestamp {
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="alert-badge">🔔 New Lead</div>
            <h1>New Demo Request Received</h1>
            <p>InsurePal Admin Notification</p>
        </div>

        <div class="content">
            <p style="color:#6b7280; font-size:15px; margin-bottom:20px;">
                A new demo request has been submitted via the InsurePal landing page. Here are the lead details:
            </p>

            <div class="lead-card">
                <h3>Lead Details</h3>

                <div class="field">
                    <span class="field-label">Name</span>
                    <span class="field-value">{{ $name }}</span>
                </div>
                <div class="field">
                    <span class="field-label">Email</span>
                    <span class="field-value">
                        <a href="mailto:{{ $email }}">{{ $email }}</a>
                    </span>
                </div>
                <div class="field">
                    <span class="field-label">Company</span>
                    <span class="field-value">{{ $company }}</span>
                </div>
            </div>

            <p class="timestamp">
                Submitted on {{ now()->format('D, d M Y \a\t h:i A') }} ({{ config('app.timezone', 'UTC') }})
            </p>

            <a href="mailto:{{ $email }}?subject=Your InsurePal Demo — Let's Schedule a Call!&body=Hello {{ urlencode($name) }}," class="cta-button">
                Reply to {{ $name }} →
            </a>
        </div>

        <div class="footer">
            <p>This is an automated admin notification from InsurePal.</p>
            <p>© {{ date('Y') }} InsurePal. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
