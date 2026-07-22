<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionEntryAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'commission_entry_id',
        'action',
        'original_amount',
        'new_amount',
        'original_transaction_type',
        'new_transaction_type',
        'changed_by',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'new_amount' => 'decimal:2',
        ];
    }

    public function commissionEntry(): BelongsTo
    {
        return $this->belongsTo(CommissionEntry::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
