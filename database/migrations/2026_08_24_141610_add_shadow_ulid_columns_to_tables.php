<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Target tables receiving shadow ULID primary key column.
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
     * Map of tables to shadow foreign key columns to add.
     */
    protected array $shadowForeignKeys = [
        'users' => ['tenant_ulid'],
        'customers' => ['tenant_ulid'],
        'policies' => ['tenant_ulid', 'customer_ulid', 'policy_product_ulid', 'policy_class_ulid', 'policy_type_ulid', 'created_by_ulid'],
        'quotes' => ['tenant_ulid', 'customer_ulid', 'policy_product_ulid'],
        'claims' => ['tenant_ulid', 'policy_ulid', 'customer_ulid'],
        'invoices' => ['tenant_ulid', 'customer_ulid', 'policy_ulid'],
        'receipts' => ['tenant_ulid', 'invoice_ulid', 'customer_ulid', 'policy_ulid', 'user_ulid'],
        'payments' => ['tenant_ulid', 'policy_ulid', 'customer_ulid'],
        'policy_payments' => ['tenant_ulid', 'policy_ulid'],
        'debit_notes' => ['tenant_ulid', 'policy_ulid', 'customer_ulid'],
        'credit_notes' => ['tenant_ulid', 'policy_ulid', 'customer_ulid'],
        'commission_entries' => ['tenant_ulid', 'policy_ulid', 'created_by_ulid'],
        'remittances' => ['tenant_ulid', 'client_bank_account_ulid', 'insurer_ulid'],
        'remittance_allocations' => ['remittance_ulid'],
        'bank_reconciliations' => ['tenant_ulid', 'client_bank_account_ulid'],
        'bank_reconciliation_lines' => ['bank_reconciliation_ulid'],
        'sync_changes' => ['tenant_ulid'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add shadow ULID to primary entities
        foreach ($this->ulidTables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'ulid')) {
                Schema::table($table, function (Blueprint $tableSchema) {
                    $tableSchema->char('ulid', 26)->nullable()->after('id')->index();
                });
            }
        }

        // 2. Add shadow foreign key columns
        foreach ($this->shadowForeignKeys as $table => $fkColumns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tableSchema) use ($table, $fkColumns) {
                    foreach ($fkColumns as $fkCol) {
                        if (! Schema::hasColumn($table, $fkCol)) {
                            $tableSchema->char($fkCol, 26)->nullable()->index();
                        }
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->shadowForeignKeys as $table => $fkColumns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tableSchema) use ($table, $fkColumns) {
                    foreach ($fkColumns as $fkCol) {
                        if (Schema::hasColumn($table, $fkCol)) {
                            $tableSchema->dropColumn($fkCol);
                        }
                    }
                });
            }
        }

        foreach ($this->ulidTables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'ulid')) {
                Schema::table($table, function (Blueprint $tableSchema) {
                    $tableSchema->dropColumn('ulid');
                });
            }
        }
    }
};
