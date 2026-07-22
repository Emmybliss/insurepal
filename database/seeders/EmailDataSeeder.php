<?php

namespace Database\Seeders;

use App\Models\EmailAccount;
use App\Models\EmailSignature;
use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmailDataSeeder extends Seeder
{
    public function run(User $brokerAdmin, User $underwriterAdmin): void
    {
        $this->command->info('Seeding email data...');

        // Create email accounts for each tenant
        $brokerAccount = EmailAccount::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'provider' => 'smtp',
            'email' => 'notifications@demobroker.com',
            'account_name' => 'Broker Notifications',
            'is_active' => true,
        ]);

        $underwriterAccount = EmailAccount::create([
            'tenant_id' => $underwriterAdmin->tenant_id,
            'provider' => 'smtp',
            'email' => 'notifications@premiumunder.ng',
            'account_name' => 'Underwriter Notifications',
            'is_active' => true,
        ]);

        // Email templates for broker tenant
        EmailTemplate::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'name' => 'Welcome Email',
            'subject' => 'Welcome to {company_name} - Your Insurance Partner',
            'body_html' => '<h2>Welcome to {company_name}!</h2>
<p>Dear {customer_name},</p>
<p>Thank you for choosing {company_name} as your insurance partner. We are delighted to have you on board.</p>
<p>Your policy <strong>{policy_number}</strong> is now active and your coverage details are as follows:</p>
<ul>
<li><strong>Policy Type:</strong> {policy_type}</li>
<li><strong>Effective Date:</strong> {effective_date}</li>
<li><strong>Expiry Date:</strong> {expiry_date}</li>
<li><strong>Premium:</strong> {premium_amount}</li>
</ul>
<p>If you have any questions, please don\'t hesitate to reach out to our support team.</p>
<p>Best regards,<br>{company_name} Team</p>',
            'category' => 'general',
        ]);

        EmailTemplate::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'name' => 'Claim Received Confirmation',
            'subject' => 'Claim #{claim_number} - Received Successfully',
            'body_html' => '<h2>Claim Received</h2>
<p>Dear {customer_name},</p>
<p>We have received your claim <strong>#{claim_number}</strong> submitted on {submitted_date}.</p>
<p><strong>Claim Details:</strong></p>
<ul>
<li><strong>Type:</strong> {claim_type}</li>
<li><strong>Incident Date:</strong> {incident_date}</li>
<li><strong>Claim Amount:</strong> {claim_amount}</li>
</ul>
<p>Your claim is now being processed. Our claims team will review the details and get back to you within 5 business days.</p>
<p>You can track the status of your claim through your customer portal.</p>
<p>Best regards,<br>Claims Department<br>{company_name}</p>',
            'category' => 'claims',
        ]);

        EmailTemplate::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'name' => 'Policy Renewal Reminder',
            'subject' => 'Your Policy {policy_number} is Due for Renewal',
            'body_html' => '<h2>Policy Renewal Reminder</h2>
<p>Dear {customer_name},</p>
<p>Your policy <strong>{policy_number}</strong> is set to expire on <strong>{expiry_date}</strong>.</p>
<p>We would like to invite you to renew your policy to ensure continuous coverage.</p>
<p><strong>Renewal Details:</strong></p>
<ul>
<li><strong>Current Premium:</strong> {current_premium}</li>
<li><strong>New Premium:</strong> {new_premium}</li>
<li><strong>Coverage End Date:</strong> {expiry_date}</li>
</ul>
<p>To renew, simply click the button below:</p>
<p style="text-align: center;">
<a href="{renewal_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Renew Now</a>
</p>
<p>Best regards,<br>{company_name} Team</p>',
            'category' => 'notifications',
        ]);

        EmailTemplate::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'name' => 'Quote Follow-up',
            'subject' => 'Your Insurance Quote #{quote_number} - Ready for Review',
            'body_html' => '<h2>Your Quote is Ready</h2>
<p>Dear {customer_name},</p>
<p>Your insurance quote <strong>#{quote_number}</strong> is now ready for review.</p>
<p><strong>Quote Summary:</strong></p>
<ul>
<li><strong>Product:</strong> {product_name}</li>
<li><strong>Coverage Amount:</strong> {coverage_amount}</li>
<li><strong>Premium:</strong> {premium_amount}</li>
<li><strong>Valid Until:</strong> {valid_until}</li>
</ul>
<p>This quote is valid until {valid_until}. To accept, please click the link below:</p>
<p style="text-align: center;">
<a href="{accept_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Quote</a>
</p>
<p>If you have any questions or would like to make adjustments, feel free to reply to this email.</p>
<p>Best regards,<br>{company_name} Team</p>',
            'category' => 'quotes',
        ]);

        EmailTemplate::create([
            'tenant_id' => $underwriterAdmin->tenant_id,
            'name' => 'Underwriter Welcome',
            'subject' => 'Welcome to Our Underwriting Platform',
            'body_html' => '<h2>Welcome to the Platform</h2>
<p>Dear {partner_name},</p>
<p>Welcome to our underwriting platform. We look forward to a successful partnership.</p>
<p>Best regards,<br>Underwriting Team</p>',
            'category' => 'general',
        ]);

        // Email signatures for broker account
        EmailSignature::create([
            'account_id' => $brokerAccount->id,
            'name' => 'Default Broker Signature',
            'body_html' => '<p>Best regards,<br><strong>{sender_name}</strong><br>{sender_title}<br>{company_name}<br>Phone: {company_phone}<br>Email: {sender_email}</p>',
            'is_default' => true,
        ]);

        EmailSignature::create([
            'account_id' => $brokerAccount->id,
            'name' => 'Claims Department',
            'body_html' => '<p>Best regards,<br><strong>{sender_name}</strong><br>Claims Department<br>{company_name}<br>Phone: {company_phone}<br>Email: {sender_email}</p>',
            'is_default' => false,
        ]);

        $this->command->info('✅ Email data seeded successfully!');
        $this->command->line('  • '.EmailTemplate::count().' email templates created');
        $this->command->line('  • '.EmailSignature::count().' email signatures created');
    }
}
