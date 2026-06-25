<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'insurance_product_id',
        'quote_number',
        'status',
        'coverage_details',
        'premium_amount',
        'commission_amount',
        'total_amount',
        'valid_until',
        'form_data',
        'notes',
        'internal_notes',
        'created_by',
        'sent_at',
        'accepted_at',
        'rejected_at',
        'expired_at',
    ];

    protected $casts = [
        'coverage_details' => 'array',
        'form_data' => 'array',
        'premium_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'valid_until' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'expired_at' => 'datetime',
    ];

    protected $appends = [
        'formatted_premium_amount',
        'formatted_total_amount',
        'is_expired',
        'status_color',
        'customer_name',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';

    const STATUS_SENT = 'sent';

    const STATUS_ACCEPTED = 'accepted';

    const STATUS_REJECTED = 'rejected';

    const STATUS_EXPIRED = 'expired';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_SENT => 'Sent',
            self::STATUS_ACCEPTED => 'Accepted',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_EXPIRED => 'Expired',
        ];
    }

    // Relationships
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function insuranceProduct(): BelongsTo
    {
        return $this->belongsTo(InsuranceProduct::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function policy(): HasOne
    {
        return $this->hasOne(Policy::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(QuoteActivity::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_SENT, self::STATUS_ACCEPTED]);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED)
            ->orWhere('valid_until', '<', now());
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeByProduct($query, int $productId)
    {
        return $query->where('insurance_product_id', $productId);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('quote_number', 'like', "%{$search}%")
                ->orWhereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
        });
    }

    public function scopeValidUntil($query, string $date)
    {
        return $query->whereDate('valid_until', $date);
    }

    public function scopeExpiringWithin($query, int $days = 7)
    {
        return $query->whereBetween('valid_until', [now(), now()->addDays($days)])
            ->whereNotIn('status', [self::STATUS_ACCEPTED, self::STATUS_REJECTED, self::STATUS_EXPIRED]);
    }

    // Accessor methods
    public function getFormattedPremiumAmountAttribute(): string
    {
        return '₦'.number_format($this->premium_amount, 2);
    }

    public function getFormattedTotalAmountAttribute(): string
    {
        return '₦'.number_format($this->total_amount, 2);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->valid_until->isPast() && $this->status !== self::STATUS_ACCEPTED;
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_SENT => 'blue',
            self::STATUS_ACCEPTED => 'green',
            self::STATUS_REJECTED => 'red',
            self::STATUS_EXPIRED => 'orange',
            default => 'gray',
        };
    }

    public function getCustomerNameAttribute(): string
    {
        if (! $this->customer) {
            return 'N/A';
        }

        return $this->customer->type === 'corporate'
            ? $this->customer->company_name
            : trim($this->customer->first_name.' '.$this->customer->last_name);
    }

    // Business logic methods
    public function generateQuoteNumber(): string
    {
        $prefix = 'QT';
        $year = now()->format('Y');
        $sequence = static::forTenant(auth()->user()->tenant_id)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return $prefix.$year.str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }

    public function isExpired(): bool
    {
        return $this->valid_until->isPast() && $this->status !== self::STATUS_ACCEPTED;
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SENT]);
    }

    public function canSend(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canAccept(): bool
    {
        return $this->status === self::STATUS_SENT && ! $this->isExpired();
    }

    public function canReject(): bool
    {
        return $this->status === self::STATUS_SENT && ! $this->isExpired();
    }

    public function canConvertToPolicy(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
        ]);

        $this->logActivity('sent', 'Quote sent to customer');
    }

    public function markAsAccepted(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_ACCEPTED,
            'accepted_at' => now(),
        ]);

        $this->logActivity('accepted', $reason ?? 'Quote accepted by customer');
    }

    public function markAsRejected(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejected_at' => now(),
        ]);

        $this->logActivity('rejected', $reason ?? 'Quote rejected by customer');
    }

    public function markAsExpired(): void
    {
        $this->update([
            'status' => self::STATUS_EXPIRED,
            'expired_at' => now(),
        ]);

        $this->logActivity('expired', 'Quote expired');
    }

    public function recalculatePremium(): void
    {
        $product = $this->insuranceProduct;
        $premiumAmount = $product->calculatePremium($this->form_data ?? []);
        $commissionAmount = $premiumAmount * ($this->commission_rate ?? 0.10);

        $this->update([
            'premium_amount' => $premiumAmount,
            'commission_amount' => $commissionAmount,
            'total_amount' => $premiumAmount + $commissionAmount,
        ]);
    }

    public function extendValidity(int $days = 30): void
    {
        $this->update([
            'valid_until' => $this->valid_until->addDays($days),
        ]);

        $this->logActivity('validity_extended', "Quote validity extended by {$days} days");
    }

    public function duplicate(): self
    {
        $newQuote = $this->replicate();
        $newQuote->quote_number = $this->generateQuoteNumber();
        $newQuote->status = self::STATUS_DRAFT;
        $newQuote->sent_at = null;
        $newQuote->accepted_at = null;
        $newQuote->rejected_at = null;
        $newQuote->expired_at = null;
        $newQuote->valid_until = now()->addDays(30);
        $newQuote->created_by = auth()->id();
        $newQuote->save();

        $newQuote->logActivity('duplicated', "Duplicated from quote #{$this->quote_number}");

        return $newQuote;
    }

    private function logActivity(string $action, string $description): void
    {
        // This would require a QuoteActivity model - we'll create it later
        // $this->activities()->create([
        //     'action' => $action,
        //     'description' => $description,
        //     'user_id' => auth()->id(),
        //     'created_at' => now(),
        // ]);
    }

    // Boot method for model events
    protected static function booted()
    {
        static::creating(function (Quote $quote) {
            if (empty($quote->quote_number)) {
                $quote->quote_number = $quote->generateQuoteNumber();
            }
            if (empty($quote->valid_until)) {
                $quote->valid_until = now()->addDays(30);
            }
            if (empty($quote->created_by)) {
                $quote->created_by = auth()->id();
            }
        });

        static::updating(function (Quote $quote) {
            // Auto-expire quotes that have passed their validity date
            if ($quote->valid_until->isPast() &&
                $quote->status === self::STATUS_SENT &&
                ! $quote->isDirty('status')) {
                $quote->status = self::STATUS_EXPIRED;
                $quote->expired_at = now();
            }
        });
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->quote_number ?? "Quote #{$this->id}";
    }
}
