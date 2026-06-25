<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyPayment extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'customer_id',
        'invoice_id',
        'reference',
        'paystack_reference',
        'amount',
        'currency',
        'channel',
        'status',
        'gateway_response',
        'paid_at',
        'receipt_generated',
        'metadata',
        'idempotency_key',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'receipt_generated' => 'boolean',
        'metadata' => 'array',
    ];

    // ── Status Constants ──────────────────────────────────────────────────

    const STATUS_PENDING = 'pending';

    const STATUS_SUCCESS = 'success';

    const STATUS_FAILED = 'failed';

    const STATUS_REVERSED = 'reversed';

    const STATUS_ABANDONED = 'abandoned';

    // ── Relationships ─────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    public function scopeSuccessful($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function getFormattedAmountAttribute(): string
    {
        return '₦'.number_format($this->amount, 2);
    }

    public static function generateReference(string $prefix = 'PP'): string
    {
        return $prefix.'_'.strtoupper(uniqid('', true));
    }
}
