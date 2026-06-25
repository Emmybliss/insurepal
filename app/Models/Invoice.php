<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory, SoftDeletes;

    // Invoice Status Constants
    const STATUS_DRAFT = 'draft';

    const STATUS_SENT = 'sent';

    const STATUS_VIEWED = 'viewed';

    const STATUS_OVERDUE = 'overdue';

    const STATUS_PAID = 'paid';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_VOID = 'void';

    // Invoice Payment Status Constants
    const PAYMENT_STATUS_UNPAID = 'unpaid';

    const PAYMENT_STATUS_PARTIALLY_PAID = 'partially_paid';

    const PAYMENT_STATUS_PAID = 'paid';

    const PAYMENT_STATUS_OVERPAID = 'overpaid';

    // Invoice Types
    const TYPE_POLICY = 'policy';

    const TYPE_SERVICE = 'service';

    const TYPE_OTHER = 'other';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'policy_id',
        'invoice_number',
        'type',
        'user_id',
        'total_amount',
        'status',
        'payment_status',
        'due_date',
        'notes',
        'currency',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'billing_address',
        'shipping_address',
        'file_path',
        'verification_token',
        'document_hash',
        'snapshot_json',
    ];

    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice) {
            if (empty($invoice->verification_token)) {
                $invoice->verification_token = app(\App\Services\Documents\DocumentVerificationService::class)->generateToken();
            }
        });
    }

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    protected $casts = [
        'due_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'billing_address' => 'array',
        'shipping_address' => 'array',
        'snapshot_json' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    // Scopes
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    public function scopeUnpaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_STATUS_UNPAID);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereNotIn('payment_status', [self::PAYMENT_STATUS_PAID, self::PAYMENT_STATUS_OVERPAID]);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Helpers
    public function isPaid(): bool
    {
        return in_array($this->payment_status, [self::PAYMENT_STATUS_PAID, self::PAYMENT_STATUS_OVERPAID]);
    }

    public function isOverdue(): bool
    {
        return $this->due_date < now() && ! $this->isPaid();
    }

    public function isPolicyInvoice(): bool
    {
        return $this->type === self::TYPE_POLICY;
    }

    public function markAsPaid(): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'payment_status' => self::PAYMENT_STATUS_PAID,
        ]);
    }

    public function markAsPartiallyPaid(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'payment_status' => self::PAYMENT_STATUS_PARTIALLY_PAID,
        ]);
    }

    public function markAsOverpaid(): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'payment_status' => self::PAYMENT_STATUS_OVERPAID,
        ]);
    }

    public function void(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_VOID,
            'notes' => $reason ? trim($this->notes."\n".$reason) : $this->notes,
        ]);
    }

    public function cancel(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'notes' => $reason ? trim($this->notes."\n".$reason) : $this->notes,
        ]);
    }

    public function recalculateTotal(): void
    {
        $items = $this->items()->get();

        $subtotal = $items->sum('total');
        $tax = $items->sum('tax');
        $discount = $this->discount_amount ?? 0;

        $this->update([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'total_amount' => $subtotal + $tax - $discount,
        ]);
    }
}
