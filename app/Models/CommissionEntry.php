<?php

namespace App\Models;

use App\Enums\CommissionTransactionType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CommissionEntry extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'transaction_type',
        'reference_type',
        'reference_id',
        'amount',
        'posting_date',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_type' => CommissionTransactionType::class,
            'amount' => 'decimal:2',
            'posting_date' => 'date',
        ];
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function audits(): HasMany
    {
        return $this->hasMany(CommissionEntryAudit::class);
    }

    public function scopeByPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    public function scopeByTransactionType($query, CommissionTransactionType|string $type)
    {
        return $query->where('transaction_type', $type instanceof CommissionTransactionType ? $type->value : $type);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('posting_date', [$from, $to]);
    }
}
