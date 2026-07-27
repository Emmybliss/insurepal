<?php

use App\Enums\CommissionTransactionType;
use App\Models\CommissionEntry;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CommissionPostingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->policy = Policy::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->service = app(CommissionPostingService::class);
});

test('postPolicyEntry creates a commission entry', function () {
    $entry = $this->service->postPolicyEntry($this->policy, 1000.00, $this->user);

    expect($entry)->toBeInstanceOf(CommissionEntry::class);
    expect($entry->policy_id)->toBe($this->policy->id);
    expect($entry->transaction_type)->toBe(CommissionTransactionType::Policy);
    expect($entry->amount)->toEqual(1000.00);
    expect($entry->reference_type)->toBe('policy');
    expect($entry->reference_id)->toBe($this->policy->id);
});

test('postCreditNoteEntry stores negative amount', function () {
    $entry = $this->service->postCreditNoteEntry($this->policy, 200.00, 1, $this->user);

    expect($entry->transaction_type)->toBe(CommissionTransactionType::CreditNote);
    expect($entry->amount)->toEqual(-200.00);
    expect($entry->reference_type)->toBe('credit_note');
    expect($entry->reference_id)->toBe(1);
});

test('postCancellationEntry stores negative amount', function () {
    $entry = $this->service->postCancellationEntry($this->policy, 500.00, $this->user);

    expect($entry->transaction_type)->toBe(CommissionTransactionType::Cancellation);
    expect($entry->amount)->toEqual(-500.00);
});

test('postRenewalEntry stores positive amount', function () {
    $entry = $this->service->postRenewalEntry($this->policy, 800.00, $this->user);

    expect($entry->transaction_type)->toBe(CommissionTransactionType::Renewal);
    expect($entry->amount)->toEqual(800.00);
});

test('postEndorsementEntry stores delta amount', function () {
    $entry = $this->service->postEndorsementEntry($this->policy, 50.00, 1, $this->user);

    expect($entry->transaction_type)->toBe(CommissionTransactionType::Endorsement);
    expect($entry->amount)->toEqual(50.00);
    expect($entry->reference_type)->toBe('policy_amendment');
    expect($entry->reference_id)->toBe(1);
});

test('postEntry creates audit record', function () {
    $entry = $this->service->postPolicyEntry($this->policy, 1000.00, $this->user);

    expect($entry->audits)->toHaveCount(1);
    expect($entry->audits->first()->action)->toBe('created');
});

test('updateEntry records audit trail', function () {
    $entry = $this->service->postPolicyEntry($this->policy, 1000.00, $this->user);

    $updated = $this->service->updateEntry(
        $entry,
        ['amount' => 1200.00],
        $this->user,
        'Correction: amount was wrong',
    );

    expect((float) $updated->amount)->toBe(1200.00);
    expect($updated->audits)->toHaveCount(2);

    $updateAudit = $updated->audits->where('action', 'updated')->first();
    expect($updateAudit)->not->toBeNull();
    expect((float) $updateAudit->original_amount)->toBe(1000.00);
    expect((float) $updateAudit->new_amount)->toBe(1200.00);
    expect($updateAudit->reason)->toBe('Correction: amount was wrong');
});

test('reverseEntry creates reversal with opposite amount', function () {
    $original = $this->service->postPolicyEntry($this->policy, 1000.00, $this->user);

    $reversal = $this->service->reverseEntry($original, $this->user, 'Erroneous entry');

    expect($reversal->transaction_type)->toBe(CommissionTransactionType::Reversal);
    expect((float) $reversal->amount)->toBe(-1000.00);
    expect($reversal->description)->toContain('Erroneous entry');
});

test('multiple entries accumulate', function () {
    $this->service->postPolicyEntry($this->policy, 1000.00, $this->user);
    $this->service->postCreditNoteEntry($this->policy, 200.00, 1, $this->user);

    $total = CommissionEntry::where('policy_id', $this->policy->id)->sum('amount');

    expect((float) $total)->toBe(800.00); // 1000 - 200
});
