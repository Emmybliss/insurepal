<?php

use App\Models\CommissionEntry;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CommissionQueryService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->policy = Policy::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->service = app(CommissionQueryService::class);
});

test('getNetCommission returns sum of all entries', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'credit_note',
        'amount' => -200.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'debit_note',
        'amount' => 50.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $net = $this->service->getNetCommission($this->policy);
    expect($net)->toEqual(850.0);
});

test('getGrossCommission returns policy and renewal only', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'renewal',
        'amount' => 500.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'credit_note',
        'amount' => -100.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $gross = $this->service->getGrossCommission($this->policy);
    expect($gross)->toBe(1500.00);
});

test('getCommissionBreakdown returns ordered entries', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'debit_note',
        'amount' => 50.00,
        'posting_date' => now()->addDay(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $breakdown = $this->service->getCommissionBreakdown($this->policy);
    expect($breakdown)->toHaveCount(2);
    expect($breakdown->first()->transaction_type->value)->toBe('policy');
});

test('getEarnedCommission respects cutoff date', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => Carbon::parse('2025-01-01'),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'renewal',
        'amount' => 500.00,
        'posting_date' => Carbon::parse('2025-06-01'),
        'created_by' => $this->user->id,
    ]);

    $earnedAsOf = $this->service->getEarnedCommission($this->policy, Carbon::parse('2025-03-01'));
    expect($earnedAsOf)->toBe(1000.00);

    $earnedAll = $this->service->getEarnedCommission($this->policy);
    expect($earnedAll)->toBe(1500.00);
});

test('getReversedCommission returns reversal total', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'reversal',
        'amount' => -1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $reversed = $this->service->getReversedCommission($this->policy);
    expect($reversed)->toBe(-1000.00);
});

test('getCommissionBalance equals net commission', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    expect($this->service->getCommissionBalance($this->policy))
        ->toBe($this->service->getNetCommission($this->policy));
});

test('getCommissionByDateRange filters correctly', function () {
    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => Carbon::parse('2025-01-15'),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'credit_note',
        'amount' => -100.00,
        'posting_date' => Carbon::parse('2025-06-15'),
        'created_by' => $this->user->id,
    ]);

    $results = $this->service->getCommissionByDateRange(
        Carbon::parse('2025-01-01'),
        Carbon::parse('2025-03-31'),
        $this->tenant->id,
    );

    expect($results)->toHaveCount(1);
    expect((float) $results->first()->amount)->toBe(1000.00);
});

test('getTotalCommissionByTenant sums across policies', function () {
    $policy2 = Policy::factory()->create(['tenant_id' => $this->tenant->id]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $this->policy->id,
        'transaction_type' => 'policy',
        'amount' => 1000.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    CommissionEntry::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy2->id,
        'transaction_type' => 'policy',
        'amount' => 500.00,
        'posting_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $total = $this->service->getTotalCommissionByTenant($this->tenant->id);
    expect($total)->toBe(1500.00);
});

test('returns zero for policy with no entries', function () {
    expect($this->service->getNetCommission($this->policy))->toBe(0.0);
    expect($this->service->getGrossCommission($this->policy))->toBe(0.0);
    expect($this->service->getCommissionBalance($this->policy))->toBe(0.0);
});
