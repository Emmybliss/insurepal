<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BankReconciliationLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'reconciliation_id',
        'source_type',
        'source_id',
        'type',
        'amount',
        'matched',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'matched' => 'boolean',
        ];
    }

    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(BankReconciliation::class, 'reconciliation_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
