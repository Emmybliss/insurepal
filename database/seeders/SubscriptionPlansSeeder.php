<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For small brokers ready to move from manual to structured operations',
                'price' => 25000.00,
                'setup_fee' => 100000.00,
                'currency' => 'NGN',
                'billing_cycle' => 'monthly',
                'trial_days' => 0,
                'features' => [
                    'Claims Management',
                    'Customers / Clients Management',
                    'Quotes Management',
                    'Policy Management',
                    'Renewals Tracking',
                    'Receipts, Debit & Credit Notes',
                    'Basic Operational & Summary Reports',
                    'Pre-designed Professional PDF Templates',
                    'Logo Upload',
                    'Standard Backend Document Generation',
                    'Internal Messaging',
                    'Support Tickets',
                    'Instant Notifications',
                    'Up to 3 Staff Accounts',
                    'Basic Role Assignment',
                    'PWA Access',
                    'Single Language (English)',
                    '5GB Secure Cloud Storage',
                    'Document Toolkit: Image Optimizer',
                    'Document Toolkit: Batch Image to PDF',
                ],
                'max_users' => 3,
                'max_policies' => null,
                'max_storage_gb' => 5,
                'is_active' => true,
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'For growing insurance firms managing higher volume and staff',
                'price' => 50000.00,
                'setup_fee' => 200000.00,
                'currency' => 'NGN',
                'billing_cycle' => 'monthly',
                'trial_days' => 0,
                'features' => [
                    'Everything in Starter',
                    'Advanced Analytics & Performance Reports',
                    'Renewal Reminder Automation Controls',
                    'Enhanced Financial Reporting',
                    'Document Template Designer (Canvas-based)',
                    'Header / Footer Configuration',
                    'Signature Placement',
                    'Multiple Template Variations',
                    'Theme Presets',
                    'Stakeholder Business Relationship System',
                    'Broker ↔ Underwriter ↔ Client Connection',
                    'Tenant Client Portal Access',
                    'Advanced Messaging',
                    'Linked Transaction Visibility',
                    'Unlimited Staff Accounts',
                    'Full Roles & Permissions Control',
                    'Multi-Language (English, French, Spanish)',
                    '20GB Secure Cloud Storage',
                    'Priority Support',
                    'Document Toolkit: Converter',
                    'Document Toolkit: Merger',
                    'Document Toolkit: Compressor',
                ],
                'max_users' => null,
                'max_policies' => null,
                'max_storage_gb' => 20,
                'is_active' => true,
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large brokers, underwriters, and insurance networks building scale',
                'price' => 100000.00,
                'setup_fee' => 300000.00,
                'currency' => 'NGN',
                'billing_cycle' => 'monthly',
                'trial_days' => 0,
                'features' => [
                    'Everything in Professional',
                    'Sell Policies on Any Website via Tenant API',
                    'InsurePal Product Widget Integration',
                    'Custom Domain / Subdomain',
                    'Dedicated Workspace',
                    'Higher Performance Hosting Allocation',
                    'Dedicated Onboarding',
                    'Data Migration Assistance',
                    'SLA-Based Support',
                    '100GB Secure Cloud Storage',
                    'Expandable Storage Add-ons',
                    'Custom Feature Configuration',
                    'API Access for Integrations',
                    'Priority Feature Requests',
                    'Document Toolkit: Enterprise Auto-save',
                ],
                'max_users' => null,
                'max_policies' => null,
                'max_storage_gb' => 100,
                'is_active' => true,
                'is_popular' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }

        $this->command->info('Subscription plans seeded: prices, setup fees, and clean features updated.');
    }
}
