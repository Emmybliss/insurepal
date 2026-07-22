<?php

use App\Enums\CommissionTransactionType;
use App\Models\CommissionEntry;
use App\Models\CreditNote;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\PolicyAmendment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
});

test('dry-run shows expected counts without writing entries', function () {
    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 150000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--dry-run' => true, '--force' => true])
        ->expectsOutputToContain('DRY RUN')
        ->assertSuccessful();

    expect(CommissionEntry::count())->toBe(0);
});

test('backfill creates POLICY entries from commission_amount', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 150000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $entry = CommissionEntry::where('policy_id', $policy->id)->first();

    expect($entry)->not->toBeNull();
    expect($entry->transaction_type)->toBe(CommissionTransactionType::Policy);
    expect($entry->amount)->toEqual(150000.00);
    expect($entry->reference_type)->toBe('policy');
    expect($entry->reference_id)->toBe($policy->id);
});

test('backfill is idempotent — running twice skips existing entries', function () {
    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 75000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $firstCount = CommissionEntry::count();

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    expect(CommissionEntry::count())->toBe($firstCount);
});

test('backfill creates CREDIT_NOTE entries', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 100000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $creditNote = CreditNote::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $policy->customer_id,
        'amount' => 20000.00,
        'total_amount' => 20000.00,
        'status' => CreditNote::STATUS_ISSUED,
        'note_number' => CreditNote::generateCreditNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Test credit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::CreditNote)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(-20000.00);
    expect($entry->reference_type)->toBe('credit_note');
    expect($entry->reference_id)->toBe($creditNote->id);
});

test('backfill creates DEBIT_NOTE entries', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 100000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $debitNote = DebitNote::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $policy->customer_id,
        'amount' => 15000.00,
        'total_amount' => 15000.00,
        'status' => DebitNote::STATUS_ISSUED,
        'note_number' => DebitNote::generateDebitNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Test debit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::DebitNote)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(15000.00);
    expect($entry->reference_type)->toBe('debit_note');
    expect($entry->reference_id)->toBe($debitNote->id);
});

test('backfill creates CANCELLATION entries for cancelled policies', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 50000.00,
        'status' => Policy::STATUS_CANCELLED,
        'created_by' => $this->user->id,
    ]);

    // Policy entry must exist first for cancellation to be created
    CommissionEntry::create([
        'tenant_id' => $policy->tenant_id,
        'policy_id' => $policy->id,
        'transaction_type' => CommissionTransactionType::Policy,
        'reference_type' => 'policy',
        'reference_id' => $policy->id,
        'amount' => 50000.00,
        'posting_date' => $policy->effective_date,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Cancellation)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(-50000.00);
});

test('backfill flags amendments with premium adjustments for manual review', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 50000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyAmendment::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'amendment_type' => 'premium_adjustment',
        'status' => 'active',
        'original_data' => ['premium_amount' => 500000],
        'amended_data' => ['premium_amount' => 550000],
        'changes_summary' => [['field' => 'premium_amount', 'from' => '500000', 'to' => '550000']],
        'premium_adjustment' => 50000.00,
        'effective_date' => now(),
        'amendment_reason' => 'Rate increase',
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    // No ENDORSEMENT entry should be auto-created
    $endorsementEntries = CommissionEntry::where('transaction_type', CommissionTransactionType::Endorsement)->count();
    expect($endorsementEntries)->toBe(0);
});

test('backfill validates ledger totals against legacy values', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 200000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    $ledgerTotal = (float) CommissionEntry::where('policy_id', $policy->id)->sum('amount');

    expect($ledgerTotal)->toEqual(200000.00);
});

test('backfill skips policies with zero commission_amount', function () {
    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'commission_amount' => 0,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $this->artisan('insurance:backfill-commission-ledger', ['--force' => true])
        ->assertSuccessful();

    expect(CommissionEntry::count())->toBe(0);
});
