<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CustomerLookupService;
use App\Services\DebitNoteService;
use App\Services\Finance\GenerateInvoiceService;
use App\Services\Finance\GenerateReceiptService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('customer lookup service searches tenant customers by name email or phone', function () {
    $tenant = Tenant::factory()->create();
    $cust1 = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'individual',
        'first_name' => 'Emmy',
        'last_name' => 'Bliss',
        'email' => 'emmy@example.com',
        'phone' => '08012345678',
    ]);
    $cust2 = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'type' => 'corporate',
        'company_name' => 'Acme Insurance Brokers',
        'email' => 'acme@example.com',
        'phone' => '08099998888',
    ]);

    $service = app(CustomerLookupService::class);

    $results1 = $service->search($tenant->id, 'Emmy');
    expect($results1)->toHaveCount(1)
        ->and($results1->first()->id)->toBe($cust1->id);

    $results2 = $service->search($tenant->id, 'acme');
    expect($results2)->toHaveCount(1)
        ->and($results2->first()->id)->toBe($cust2->id);

    $results3 = $service->search($tenant->id, '08012345678');
    expect($results3)->toHaveCount(1)
        ->and($results3->first()->id)->toBe($cust1->id);
});

test('quick store customer creates minimal customer record', function () {
    $tenant = Tenant::factory()->create();
    $service = app(CustomerLookupService::class);

    $cust = $service->quickCreate($tenant->id, [
        'type' => 'individual',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@example.com',
        'phone' => '+2348000000000',
    ]);

    expect($cust->id)->not()->toBeNull()
        ->and($cust->tenant_id)->toBe($tenant->id)
        ->and($cust->first_name)->toBe('John')
        ->and($cust->email)->toBe('john.doe@example.com');
});

test('creating debit note without policy id creates draft policy with TBA behavior when policy number is empty', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $debitNoteData = [
        'customer_id' => $customer->id,
        'policy_number' => null, // empty / TBA
        'description' => 'Test Debit Note for TBA Policy',
        'amount' => 150000,
        'tax_rate' => 7.5,
        'tax_amount' => 11250,
        'total_amount' => 161250,
    ];

    $debitNoteService = app(DebitNoteService::class);
    $debitNote = $debitNoteService->create($debitNoteData, $tenant->id, $user->id);

    expect($debitNote->policy_id)->not()->toBeNull();

    $policy = Policy::find($debitNote->policy_id);
    expect($policy->status)->toBe(Policy::STATUS_DRAFT)
        ->and($policy->customer_id)->toBe($customer->id)
        ->and($policy->policy_number)->toBeNull()
        ->and($policy->internal_reference)->not()->toBeNull()
        ->and($policy->policy_number_display)->toBe($policy->internal_reference);
});

test('creating debit note with policy number attaches or creates policy avoiding duplicates per tenant', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $debitNoteData1 = [
        'customer_id' => $customer->id,
        'policy_number' => 'POL-EXT-2026-001',
        'description' => 'First Debit Note',
        'amount' => 200000,
        'total_amount' => 200000,
    ];

    $debitNoteService = app(DebitNoteService::class);
    $note1 = $debitNoteService->create($debitNoteData1, $tenant->id, $user->id);

    $policy1 = Policy::find($note1->policy_id);
    expect($policy1->policy_number)->toBe('POL-EXT-2026-001')
        ->and($policy1->status)->toBe(Policy::STATUS_DRAFT);

    // Create second note with exact same policy_number
    $debitNoteData2 = [
        'customer_id' => $customer->id,
        'policy_number' => 'POL-EXT-2026-001',
        'description' => 'Second Debit Note',
        'amount' => 50000,
        'total_amount' => 50000,
    ];

    $note2 = $debitNoteService->create($debitNoteData2, $tenant->id, $user->id);

    expect($note2->policy_id)->toBe($note1->policy_id);
    expect(Policy::where('tenant_id', $tenant->id)->where('policy_number', 'POL-EXT-2026-001')->count())->toBe(1);
});

test('generating invoice and receipt automatically links to draft policy when policy id is null', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $invoiceData = [
        'customer_id' => $customer->id,
        'policy_number' => 'INV-POL-001',
        'due_date' => now()->addDays(30)->format('Y-m-d'),
        'currency' => 'NGN',
        'items' => [
            ['description' => 'Brokerage Fee', 'quantity' => 1, 'unit_price' => 50000],
        ],
    ];

    $invoice = app(GenerateInvoiceService::class)->generate($invoiceData, $user);

    expect($invoice->policy_id)->not()->toBeNull();
    $policy = Policy::find($invoice->policy_id);
    expect($policy->policy_number)->toBe('INV-POL-001')
        ->and($policy->status)->toBe(Policy::STATUS_DRAFT);

    $receiptData = [
        'invoice_id' => $invoice->id,
        'customer_id' => $customer->id,
        'policy_number' => 'INV-POL-001',
        'amount_paid' => 50000,
        'payment_method' => 'bank_transfer',
        'payment_date' => now()->format('Y-m-d'),
        'currency' => 'NGN',
    ];

    $receipt = app(GenerateReceiptService::class)->generate($receiptData, $tenant->id, $user->id);

    expect($receipt->policy_id)->toBe($invoice->policy_id);
});
