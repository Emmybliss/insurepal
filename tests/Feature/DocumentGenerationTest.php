<?php

use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\Tenant;
use App\Models\User;
use App\Services\DocumentGenerationService;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $this->service = app(DocumentGenerationService::class);
});

it('can generate invoice pdf', function () {
    $invoice = Invoice::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
    ]);

    $invoice->items()->createMany([
        ['description' => 'Annual Premium', 'quantity' => 1, 'unit_price' => 500000, 'total' => 500000],
        ['description' => 'Processing Fee', 'quantity' => 1, 'unit_price' => 5000, 'total' => 5000],
    ]);

    $pdfContent = $this->service->generateInvoicePdf($invoice);

    expect($pdfContent)->not->toBeNull();
    expect($pdfContent)->toStartWith('%PDF');
});

it('can generate receipt pdf', function () {
    $invoice = Invoice::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $invoice->id,
        'policy_id' => $this->policy->id,
    ]);

    $pdfContent = $this->service->generateReceiptPdf($receipt);

    expect($pdfContent)->not->toBeNull();
    expect($pdfContent)->toStartWith('%PDF');
});

it('can generate credit note pdf', function () {
    $creditNote = CreditNote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
        'note_number' => 'CN-2025-001',
        'status' => CreditNote::STATUS_DRAFT,
        'amount' => 75000,
        'total_amount' => 75000,
        'description' => 'Cancellation refund',
        'issue_date' => now(),
        'sequence_number' => 1,
        'created_by_id' => $this->user->id,
    ]);

    $pdfContent = $this->service->generateCreditNotePdf($creditNote);

    expect($pdfContent)->not->toBeNull();
    expect($pdfContent)->toStartWith('%PDF');
});

it('can generate invoice pdf with custom template key', function () {
    $invoice = Invoice::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
    ]);

    $invoice->items()->createMany([
        ['description' => 'Annual Premium', 'quantity' => 1, 'unit_price' => 500000, 'total' => 500000],
        ['description' => 'Processing Fee', 'quantity' => 1, 'unit_price' => 5000, 'total' => 5000],
    ]);

    $pdfContent = $this->service->generateInvoicePdf($invoice, 'invoice.classic');

    expect($pdfContent)->not->toBeNull();
});
