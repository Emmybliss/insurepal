<?php

use App\Models\CommissionEntry;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->policy = Policy::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
});

test('belongs to a policy', function () {
    $entry = CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'created_by' => $this->user->id,
    ]);

    expect($entry->policy)->toBeInstanceOf(Policy::class);
    expect($entry->policy->id)->toBe($this->policy->id);
});

test('belongs to a tenant', function () {
    $entry = CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'created_by' => $this->user->id,
    ]);

    expect($entry->tenant)->toBeInstanceOf(Tenant::class);
    expect($entry->tenant_id)->toBe($this->tenant->id);
});

test('amount is cast to decimal', function () {
    $entry = CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'amount' => 1234.56,
        'created_by' => $this->user->id,
    ]);

    expect($entry->amount)->toEqual(1234.56);
});

test('transaction_type is cast to enum', function () {
    $entry = CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'created_by' => $this->user->id,
    ]);

    expect($entry->transaction_type)->toBeInstanceOf(\App\Enums\CommissionTransactionType::class);
    expect($entry->transaction_type->value)->toBe('policy');
});

test('scope byPolicy filters correctly', function () {
    $policy2 = Policy::factory()->create(['tenant_id' => $this->tenant->id]);

    CommissionEntry::factory()->count(3)->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->count(2)->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy2->id,
        'created_by' => $this->user->id,
    ]);

    expect(CommissionEntry::byPolicy($this->policy->id)->count())->toBe(3);
    expect(CommissionEntry::byPolicy($policy2->id)->count())->toBe(2);
});

test('scope byTransactionType filters correctly', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'credit_note',
        'created_by' => $this->user->id,
    ]);

    expect(CommissionEntry::byTransactionType('policy')->count())->toBe(1);
    expect(CommissionEntry::byTransactionType('credit_note')->count())->toBe(1);
});
