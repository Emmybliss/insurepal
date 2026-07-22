<?php

use App\Enums\CommissionTransactionType;
use App\Events\CreditNoteGenerated;
use App\Events\DebitNoteGenerated;
use App\Events\PolicyAmended;
use App\Events\PolicyCancelled;
use App\Events\PolicyCreated;
use App\Events\PolicyRenewed;
use App\Models\CommissionEntry;
use App\Models\CreditNote;
use App\Models\Customer;
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
    $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
});

// ─── PostPolicyCommissionEntry (PolicyCreated) ───────────────────────────

test('PostPolicyCommissionEntry creates a POLICY entry when PolicyCreated is dispatched', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 125000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyCreated::dispatch($policy, (float) $policy->commission_amount, $this->user);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Policy)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(125000.00);
    expect($entry->reference_type)->toBe('policy');
    expect($entry->reference_id)->toBe($policy->id);
});

test('PostPolicyCommissionEntry creates entry with zero commission', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 0,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyCreated::dispatch($policy, 0.0, $this->user);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Policy)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(0.0);
});

// ─── PostCancellationCommissionEntry (PolicyCancelled) ───────────────────

test('PostCancellationCommissionEntry creates a CANCELLATION entry for the full balance when PolicyCancelled is dispatched', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 80000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::create([
        'tenant_id' => $policy->tenant_id,
        'policy_id' => $policy->id,
        'transaction_type' => CommissionTransactionType::Policy,
        'reference_type' => 'policy',
        'reference_id' => $policy->id,
        'amount' => 80000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    PolicyCancelled::dispatch($policy);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Cancellation)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(-80000.00);
    expect($entry->reference_type)->toBe('policy');
    expect($entry->reference_id)->toBe($policy->id);
});

test('PostCancellationCommissionEntry creates zero cancellation when no prior entries exist', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 50000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyCancelled::dispatch($policy);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Cancellation)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(0.0);
});

// ─── PostRenewalCommissionEntry (PolicyRenewed) ──────────────────────────

test('PostRenewalCommissionEntry creates a RENEWAL entry when PolicyRenewed is dispatched with commission_amount > 0', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 45000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyRenewed::dispatch($policy);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Renewal)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(45000.00);
    expect($entry->reference_type)->toBe('policy');
    expect($entry->reference_id)->toBe($policy->id);
});

test('PostRenewalCommissionEntry does nothing when commission_amount is zero', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 0,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    PolicyRenewed::dispatch($policy);

    $entries = CommissionEntry::where('policy_id', $policy->id)->get();

    expect($entries)->toBeEmpty();
});

// ─── PostCreditNoteCommissionEntry (CreditNoteGenerated) ─────────────────

test('PostCreditNoteCommissionEntry creates a CREDIT_NOTE entry when CreditNoteGenerated is dispatched', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 100000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $creditNote = CreditNote::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'amount' => 25000.00,
        'total_amount' => 25000.00,
        'status' => CreditNote::STATUS_ISSUED,
        'note_number' => CreditNote::generateCreditNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Test credit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    CreditNoteGenerated::dispatch($creditNote);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::CreditNote)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(-25000.00);
    expect($entry->reference_type)->toBe('credit_note');
    expect($entry->reference_id)->toBe($creditNote->id);
});

test('PostCreditNoteCommissionEntry does nothing when credit note has no policy_id', function () {
    $creditNote = CreditNote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'amount' => 10000.00,
        'total_amount' => 10000.00,
        'status' => CreditNote::STATUS_ISSUED,
        'note_number' => CreditNote::generateCreditNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Standalone credit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    CreditNoteGenerated::dispatch($creditNote);

    expect(CommissionEntry::count())->toBe(0);
});

// ─── PostDebitNoteCommissionEntry (DebitNoteGenerated) ───────────────────

test('PostDebitNoteCommissionEntry creates a DEBIT_NOTE entry when DebitNoteGenerated is dispatched', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 100000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $debitNote = DebitNote::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'amount' => 18000.00,
        'total_amount' => 18000.00,
        'status' => DebitNote::STATUS_ISSUED,
        'note_number' => DebitNote::generateDebitNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Test debit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    DebitNoteGenerated::dispatch($debitNote);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::DebitNote)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(18000.00);
    expect($entry->reference_type)->toBe('debit_note');
    expect($entry->reference_id)->toBe($debitNote->id);
});

test('PostDebitNoteCommissionEntry does nothing when debit note has no policy_id', function () {
    $debitNote = DebitNote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'amount' => 5000.00,
        'total_amount' => 5000.00,
        'status' => DebitNote::STATUS_ISSUED,
        'note_number' => DebitNote::generateDebitNoteNumber($this->tenant->id),
        'issue_date' => now(),
        'description' => 'Standalone debit note',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    DebitNoteGenerated::dispatch($debitNote);

    expect(CommissionEntry::count())->toBe(0);
});

// ─── PostEndorsementCommissionEntry (PolicyAmended) ──────────────────────

test('PostEndorsementCommissionEntry creates an ENDORSEMENT entry when PolicyAmended is dispatched with non-zero delta', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 50000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $amendment = PolicyAmendment::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'premium_adjustment' => 15000.00,
        'status' => 'draft',
        'created_by' => $this->user->id,
    ]);

    PolicyAmended::dispatch($policy, $amendment, 15000.00);

    $entry = CommissionEntry::where('policy_id', $policy->id)
        ->where('transaction_type', CommissionTransactionType::Endorsement)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->amount)->toEqual(15000.00);
    expect($entry->reference_type)->toBe('policy_amendment');
    expect($entry->reference_id)->toBe($amendment->id);
});

test('PostEndorsementCommissionEntry does nothing when commissionDelta is zero', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'commission_amount' => 50000.00,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->user->id,
    ]);

    $amendment = PolicyAmendment::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'premium_adjustment' => 0,
        'status' => 'draft',
        'created_by' => $this->user->id,
    ]);

    PolicyAmended::dispatch($policy, $amendment, 0.0);

    $entries = CommissionEntry::where('policy_id', $policy->id)->get();

    expect($entries)->toBeEmpty();
});
