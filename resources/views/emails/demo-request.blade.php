<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Demo Request Confirmation</title>
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
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .header {
            background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
            padding: 40px 32px;
            text-align: center;
        }

        .header img {
            height: 36px;
            margin-bottom: 16px;
        }

        .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .header p {
            color: rgba(255, 255, 255, 0.85);
            font-size: 14px;
            margin-top: 6px;
        }

        .content {
            padding: 40px 32px;
        }

        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }

        .body-text {
            color: #6b7280;
            font-size: 15px;
            margin-bottom: 20px;
        }

        .highlight-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            border-radius: 0 8px 8px 0;
            padding: 16px 20px;
            margin: 24px 0;
        }

        .highlight-box p {
            font-size: 14px;
            color: #1d4ed8;
            font-weight: 500;
        }

        .what-next {
            margin: 28px 0;
        }

        .what-next h3 {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 12px;
        }

        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .step-number {
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
            margin-right: 12px;
            margin-top: 2px;
        }

        .step p {
            font-size: 14px;
            color: #6b7280;
        }

        .cta-button {
            display: block;
            width: fit-content;
            margin: 32px auto;
            background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            text-align: center;
        }

        .divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 32px 0;
        }

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
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="header">
            <h1>🎉 We've Got Your Request!</h1>
            <p>InsurePal — AI-Powered Insurance Platform</p>
        </div>

        <div class="content">
            <p class="greeting">Hello, {{ $name }}!</p>

            <p class="body-text">
                Thank you for your interest in InsurePal. We've received your demo request for
                <strong>{{ $company }}</strong> and our team is excited to show you what we can do for your
                insurance operations.
            </p>

            <div class="highlight-box">
                <p>⏰ Expect to hear from us within <strong>24 business hours</strong>. We'll reach out to {{ $email }}
                    to schedule a personalised demo call.</p>
            </div>

            <div class="what-next">
                <h3>What happens next?</h3>

                <div class="step">
                    <span class="step-number">1</span>
                    <p>Our team will review your request and prepare a demo tailored to
                        <strong>{{ $company }}</strong>'s needs.</p>
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <p>We'll send you a calendar invite so you can pick a time that works for you.</p>
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    <p>You'll see a live walkthrough of the platform and get all your questions answered.</p>
                </div>
            </div>

            <p class="body-text">
                In the meantime, you can explore the platform by signing up for a free trial — no credit card required.
            </p>

            <a href="{{ route('register') }}" class="cta-button">
                Start Your Free Trial →
            </a>

            <hr class="divider">

            <p class="body-text" style="font-size:13px; text-align:center;">
                Questions? Reply to this email or contact us at
                <a href="mailto:support@insurepal.app" style="color:#3b82f6;">support@insurepal.app</a>
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} InsurePal. All rights reserved.</p>
            <p>AI-Powered Insurance Management for Nigerian Brokers & Underwriters</p>
        </div>
    </div>
</body>

</html>