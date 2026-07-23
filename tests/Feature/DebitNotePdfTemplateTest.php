<?php

use Illuminate\Support\Facades\View;

it('renders debit note classic view without created_at key in payload', function () {
    $html = View::make('pdf.templates.debit-notes.classic', [
        'payload' => [
            'note_number' => 'DN-2026-001',
            'issue_date' => 'July 23, 2026',
            'due_date' => 'August 23, 2026',
            'customer_name' => 'John Doe',
            'customer_address' => '123 Main St',
            'policy_number' => 'POL-100',
            'amount' => '50,000.00',
            'total_amount' => '50,000.00',
            'currency' => 'NGN',
        ],
        'labels' => [],
        'tenant' => null,
    ])->render();

    expect($html)->toContain('DN-2026-001');
    expect($html)->toContain('July 23, 2026');
});

it('renders debit note classic view with created_at key in payload', function () {
    $html = View::make('pdf.templates.debit-notes.classic', [
        'payload' => [
            'note_number' => 'DN-2026-002',
            'created_at' => 'July 20, 2026',
            'issue_date' => 'July 23, 2026',
            'due_date' => 'August 23, 2026',
            'customer_name' => 'Jane Smith',
            'amount' => '100,000.00',
            'total_amount' => '100,000.00',
            'currency' => 'NGN',
        ],
        'labels' => [],
        'tenant' => null,
    ])->render();

    expect($html)->toContain('DN-2026-002');
    expect($html)->toContain('July 20, 2026');
});

it('renders credit note classic view without created_at key in payload', function () {
    $html = View::make('pdf.templates.credit-notes.classic', [
        'payload' => [
            'note_number' => 'CN-2026-001',
            'issue_date' => 'July 23, 2026',
            'due_date' => 'August 23, 2026',
            'customer_name' => 'Acme Corp',
            'amount' => '25,000.00',
            'total_amount' => '25,000.00',
            'currency' => 'NGN',
        ],
        'labels' => [],
        'tenant' => null,
    ])->render();

    expect($html)->toContain('CN-2026-001');
});
