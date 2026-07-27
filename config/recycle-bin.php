<?php

return [
    'retention_days' => (int) env('RECYCLE_BIN_RETENTION_DAYS', 30),

    'models' => [
        'customers' => App\Models\Customer::class,
        'policies' => App\Models\Policy::class,
        'quotes' => App\Models\Quote::class,
        'claims' => App\Models\Claim::class,
        'debit-notes' => App\Models\DebitNote::class,
        'credit-notes' => App\Models\CreditNote::class,
        'invoices' => App\Models\Invoice::class,
        'receipts' => App\Models\Receipt::class,
        'documents' => App\Models\Document::class,
    ],
];
