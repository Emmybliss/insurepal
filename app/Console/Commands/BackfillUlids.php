<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BackfillUlids extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'insurepal:backfill-ulids {--chunk=500 : Number of records to process per chunk}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate shadow ULID primary and foreign keys for all existing records';

    /**
     * Primary tables to backfill.
     */
    protected array $ulidTables = [
        'tenants', 'users', 'customers', 'policies', 'quotes', 'claims',
        'policy_products', 'policy_classes', 'policy_types', 'insurance_companies',
        'insurance_company_branches', 'insurance_company_contacts', 'placements',
        'placement_markets', 'broker_slips', 'broker_slip_items', 'broker_slip_risks',
        'policy_risks', 'quote_risks', 'clause_library',
        'documents', 'document_assets', 'document_overlays', 'policy_amendments',
        'policy_approvals', 'policy_documents', 'policy_certificates', 'claim_documents',
        'claim_comments', 'claim_activities', 'messages', 'message_recipients',
        'notifications', 'policy_notifications', 'announcements', 'support_tickets',
        'kb_categories', 'kb_articles', 'communication_threads', 'communication_messages',
        'communication_participants', 'communication_attachments', 'communication_read_receipts',
        'email_accounts', 'email_folders', 'email_messages', 'email_attachments',
        'email_signatures', 'email_templates', 'ai_conversations', 'ai_messages',
        'ai_tool_executions', 'customer_kycs', 'tenant_kycs', 'tenant_relationships',
        'dynamic_fields', 'tenant_template_overrides', 'tenant_default_templates',
        'certificate_settings',
        'invoices', 'invoice_items', 'receipts', 'receipt_allocations',
        'debit_notes', 'credit_notes', 'payments', 'policy_payments', 'expenses',
        'remittances', 'remittance_allocations', 'commission_entries',
        'commission_entry_audits', 'naicom_report_runs', 'naicom_report_lines',
        'naicom_adjustments', 'client_bank_accounts', 'bank_reconciliations',
        'bank_reconciliation_lines',
    ];

    /**
     * Map of child table -> [shadow_fk => [parent_table, parent_fk]]
     */
    protected array $fkMappings = [
        'users' => ['tenant_ulid' => ['tenants', 'tenant_id']],
        'customers' => ['tenant_ulid' => ['tenants', 'tenant_id']],
        'policies' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'customer_ulid' => ['customers', 'customer_id'],
            'policy_product_ulid' => ['policy_products', 'policy_product_id'],
            'policy_class_ulid' => ['policy_classes', 'policy_class_id'],
            'policy_type_ulid' => ['policy_types', 'policy_type_id'],
            'created_by_ulid' => ['users', 'created_by'],
        ],
        'quotes' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'customer_ulid' => ['customers', 'customer_id'],
            'policy_product_ulid' => ['policy_products', 'policy_product_id'],
        ],
        'claims' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'customer_ulid' => ['customers', 'customer_id'],
        ],
        'invoices' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'customer_ulid' => ['customers', 'customer_id'],
            'policy_ulid' => ['policies', 'policy_id'],
        ],
        'receipts' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'invoice_ulid' => ['invoices', 'invoice_id'],
            'customer_ulid' => ['customers', 'customer_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'user_ulid' => ['users', 'user_id'],
        ],
        'payments' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'customer_ulid' => ['customers', 'customer_id'],
        ],
        'policy_payments' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
        ],
        'debit_notes' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'customer_ulid' => ['customers', 'customer_id'],
        ],
        'credit_notes' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'customer_ulid' => ['customers', 'customer_id'],
        ],
        'commission_entries' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
            'policy_ulid' => ['policies', 'policy_id'],
            'created_by_ulid' => ['users', 'created_by'],
        ],
        'sync_changes' => [
            'tenant_ulid' => ['tenants', 'tenant_id'],
        ],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting ULID backfill process...');
        $chunkSize = (int) $this->option('chunk');

        // Step 1: Backfill primary entity shadow ULIDs
        foreach ($this->ulidTables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'ulid')) {
                continue;
            }

            $unfilledCount = DB::table($table)->whereNull('ulid')->count();
            if ($unfilledCount === 0) {
                $this->line("Table <info>{$table}</info>: All records already have ULIDs.");

                continue;
            }

            $this->info("Backfilling {$unfilledCount} records in <comment>{$table}</comment>...");

            DB::table($table)->whereNull('ulid')->orderBy('id')->chunkById($chunkSize, function ($records) use ($table) {
                foreach ($records as $record) {
                    DB::table($table)
                        ->where('id', $record->id)
                        ->update(['ulid' => (string) Str::ulid()]);
                }
            });

            $this->info("Completed <info>{$table}</info>.");
        }

        // Step 2: Backfill shadow foreign keys
        $this->info('Backfilling shadow foreign key relationships...');

        foreach ($this->fkMappings as $childTable => $mappings) {
            if (! Schema::hasTable($childTable)) {
                continue;
            }

            foreach ($mappings as $shadowFk => [$parentTable, $fkCol]) {
                if (! Schema::hasTable($parentTable) || ! Schema::hasColumn($childTable, $shadowFk) || ! Schema::hasColumn($childTable, $fkCol)) {
                    continue;
                }

                $unfilledFkCount = DB::table($childTable)
                    ->whereNotNull($fkCol)
                    ->whereNull($shadowFk)
                    ->count();

                if ($unfilledFkCount === 0) {
                    continue;
                }

                $this->info("Mapping <comment>{$childTable}.{$fkCol}</comment> -> <comment>{$childTable}.{$shadowFk}</comment> ({$unfilledFkCount} records)...");

                DB::statement("
                    UPDATE {$childTable} c
                    JOIN {$parentTable} p ON c.{$fkCol} = p.id
                    SET c.{$shadowFk} = p.ulid
                    WHERE c.{$fkCol} IS NOT NULL AND c.{$shadowFk} IS NULL
                ");
            }
        }

        $this->info('ULID backfill operation completed successfully!');

        return Command::SUCCESS;
    }
}
