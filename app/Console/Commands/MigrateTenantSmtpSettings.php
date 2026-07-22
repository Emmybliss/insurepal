<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use App\Models\Tenant;
use Illuminate\Console\Command;

class MigrateTenantSmtpSettings extends Command
{
    protected $signature = 'app:migrate-tenant-smtp-settings';

    protected $description = 'Migrate tenant smtp_settings JSON column to EmailAccount records';

    public function handle()
    {
        $tenants = Tenant::whereNotNull('smtp_settings')->get();

        $count = 0;

        foreach ($tenants as $tenant) {
            $smtp = $tenant->smtp_settings;

            if (empty($smtp) || empty($smtp['use_custom'])) {
                continue;
            }

            $existing = EmailAccount::where('tenant_id', $tenant->id)
                ->where('provider', 'smtp')
                ->where('email', $smtp['username'] ?? '')
                ->first();

            if ($existing) {
                $existing->update([
                    'is_system_default' => true,
                    'smtp_host' => $smtp['host'] ?? $existing->smtp_host,
                    'smtp_port' => $smtp['port'] ?? $existing->smtp_port,
                ]);

                $this->info("Updated existing SMTP account for tenant {$tenant->id}");

                continue;
            }

            EmailAccount::create([
                'tenant_id' => $tenant->id,
                'provider' => 'smtp',
                'email' => $smtp['username'] ?? $tenant->contact_email ?? $tenant->email,
                'account_name' => $tenant->company_name ?? $tenant->name,
                'smtp_host' => $smtp['host'] ?? '',
                'smtp_port' => $smtp['port'] ?? 587,
                'is_system_default' => true,
                'is_active' => true,
            ]);

            $count++;
        }

        $this->info("Migrated {$count} tenant SMTP settings to EmailAccount records.");
    }
}
