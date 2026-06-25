<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Scheduled Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2E86AB;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 0 0 5px 5px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #2E86AB;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $reportTitle }}</h1>
        <p>Automated Report Delivery</p>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        
        <p>Your scheduled {{ $reportTitle }} has been generated and is attached to this email.</p>
        
        <p><strong>Report Details:</strong></p>
        <ul>
            <li><strong>Report Type:</strong> {{ $reportTitle }}</li>
            <li><strong>Generated At:</strong> {{ $generatedAt }}</li>
            <li><strong>Company:</strong> {{ $tenantName }}</li>
        </ul>
        
        <p>The report contains the latest data and analytics for your insurance business. Please review the attached files for detailed insights.</p>
        
        <p>If you have any questions about this report, please contact your system administrator.</p>
        
        <p>Best regards,<br>
        InsurePal Reporting System</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© {{ date('Y') }} InsurePal. All rights reserved.</p>
    </div>
</body>
</html>
