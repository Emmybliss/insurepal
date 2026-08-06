<?php

namespace App\Models;

use App\Enums\QuoteStatus;
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

    // Status constants for backward compatibility
    const STATUS_DRAFT = 'draft';

    const STATUS_PENDING_REVIEW = 'pending_review';

    const STATUS_CHANGES_REQUESTED = 'changes_requested';

    const STATUS_APPROVED = 'approved';

    const STATUS_SENT = 'sent';

    const STATUS_ACCEPTED = 'accepted';

    const STATUS_REJECTED = 'rejected';

    const STATUS_EXPIRED = 'expired';

    const STATUS_CONVERTED = 'converted';

    const STATUS_SUPERSEDED = 'superseded';

    const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'insurance_product_id',
        'policy_class_id',
        'policy_type_id',
        'placement_id',
        'quote_number',
        'version',
        'currency',
        'sum_insured',
        'rate',
        'rate_basis',
        'gross_premium',
        'premium_amount',
        'commission_rate',
        'commission_amount',
        'tax_rate',
        'taxes',
        'fees',
        'discount',
        'net_premium',
        'total_amount',
        'period_start',
        'period_end',
        'valid_until',
        'claim_payment_condition',
        'coverage_details',
        'form_data',
        'notes',
        'internal_notes',
        'status',
        'issued_at',
        'issued_by',
        'reviewed_by',
        'approved_by',
        'signed_by',
        'pdf_path',
        'checksum',
        'snapshot_json',
        'created_by',
        'sent_at',
        'accepted_at',
        'rejected_at',
        'expired_at',
    ];

    protected $casts = [
        'coverage_details' => 'array',
        'form_data' => 'array',
        'snapshot_json' => 'array',
        'sum_insured' => 'decimal:2',
        'rate' => 'decimal:4',
        'gross_premium' => 'decimal:2',
        'premium_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'taxes' => 'decimal:2',
        'fees' => 'decimal:2',
        'discount' => 'decimal:2',
        'net_premium' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'valid_until' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'expired_at' => 'datetime',
        'issued_at' => 'datetime',
    ];

    protected $appends = [
        'formatted_premium_amount',
        'formatted_total_amount',
        'is_expired',
        'status_color',
        'customer_name',
    ];

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_REVIEW => 'Pending Review',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_SENT => 'Sent to Customer',
            self::STATUS_ACCEPTED => 'Accepted',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_CONVERTED => 'Converted to Policy',
            self::STATUS_SUPERSEDED => 'Superseded',
            self::STATUS_WITHDRAWN => 'Withdrawn',
            self::STATUS_EXPIRED => 'Expired',
        ];
    }

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function insuranceProduct(): BelongsTo
    {
        return $this->belongsTo(InsuranceProduct::class);
    }

    public function policyClass(): BelongsTo
    {
        return $this->belongsTo(PolicyClass::class);
    }

    public function policyType(): BelongsTo
    {
        return $this->belongsTo(PolicyType::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    public function policy(): HasOne
    {
        return $this->hasOne(Policy::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(Placement::class);
    }

    public function risks(): HasMany
    {
        return $this->hasMany(QuoteRisk::class);
    }

    public function items(): HasMany
    {
        return $this->risks();
    }

    public function clauses(): HasMany
    {
        return $this->hasMany(QuoteClause::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(QuoteVersion::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(QuoteEmailLog::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(QuoteApproval::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_SENT, self::STATUS_ACCEPTED, self::STATUS_APPROVED]);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED)
            ->orWhere(function ($q) {
                $q->whereNotNull('valid_until')->where('valid_until', '<', now());
            });
    }

    public function scopeByStatus($query, QuoteStatus|string $status)
    {
        return $query->where('status', $status instanceof QuoteStatus ? $status->value : $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
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
            ->whereNotIn('status', [self::STATUS_ACCEPTED, self::STATUS_REJECTED, self::STATUS_EXPIRED, self::STATUS_CONVERTED]);
    }

    // Accessor methods
    public function getSumInsuredAttribute(): float
    {
        return (float) ($this->attributes['sum_insured'] ?? 0);
    }

    public function getGrossPremiumAttribute(): float
    {
        return (float) ($this->attributes['gross_premium'] ?? $this->attributes['premium_amount'] ?? 0);
    }

    public function getNetPremiumAttribute(): float
    {
        return (float) ($this->attributes['net_premium'] ?? $this->attributes['total_amount'] ?? 0);
    }

    public function getFormattedPremiumAmountAttribute(): string
    {
        $currency = $this->currency ?? 'NGN';
        $symbol = $currency === 'NGN' ? '₦' : ($currency === 'USD' ? '$' : $currency.' ');

        return $symbol.number_format($this->gross_premium, 2);
    }

    public function getFormattedTotalAmountAttribute(): string
    {
        $currency = $this->currency ?? 'NGN';
        $symbol = $currency === 'NGN' ? '₦' : ($currency === 'USD' ? '$' : $currency.' ');

        return $symbol.number_format($this->net_premium > 0 ? $this->net_premium : $this->total_amount, 2);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->valid_until && $this->valid_until->isPast() && ! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_CONVERTED]);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_PENDING_REVIEW => 'yellow',
            self::STATUS_CHANGES_REQUESTED => 'orange',
            self::STATUS_APPROVED => 'emerald',
            self::STATUS_SENT => 'blue',
            self::STATUS_ACCEPTED => 'green',
            self::STATUS_REJECTED => 'red',
            self::STATUS_CONVERTED => 'purple',
            self::STATUS_SUPERSEDED => 'slate',
            self::STATUS_WITHDRAWN => 'zinc',
            self::STATUS_EXPIRED => 'amber',
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

    public function getRateAttribute(): mixed
    {
        if ($this->relationLoaded('risks') && $this->risks->isNotEmpty()) {
            return $this->risks->avg('rate');
        }

        return $this->attributes['rate'] ?? 0;
    }

    public function getRateBasisAttribute(): string
    {
        if ($this->relationLoaded('risks') && $this->risks->count() === 1) {
            return $this->risks->first()->rate_basis ?? 'percentage';
        }

        return $this->attributes['rate_basis'] ?? 'percentage';
    }

    // Business logic methods
    public static function generateQuoteNumber(?int $tenantId = null, ?string $format = null): string
    {
        $format = $format ?: 'QT/{YEAR}/{SEQUENCE}';
        $year = now()->format('Y');

        $last = static::withoutGlobalScopes()
            ->withTrashed()
            ->where('quote_number', 'like', "%{$year}%")
            ->orderByRaw('LENGTH(quote_number) DESC')
            ->orderBy('quote_number', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($last) {
            $parts = explode('/', $last->quote_number);
            $lastStr = end($parts);
            if (preg_match('/(\d+)$/', $lastStr, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            }
        }

        do {
            $replacements = [
                '{YEAR}' => $year,
                '{SEQUENCE}' => str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT),
            ];
            $candidate = str_replace(array_keys($replacements), array_values($replacements), $format);

            $exists = static::withoutGlobalScopes()
                ->withTrashed()
                ->where('quote_number', $candidate)
                ->exists();
            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $candidate;
    }

    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast() && ! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_CONVERTED]);
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_REVIEW, self::STATUS_CHANGES_REQUESTED]);
    }

    public function canSend(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_APPROVED]);
    }

    public function canAccept(): bool
    {
        return in_array($this->status, [self::STATUS_SENT, self::STATUS_APPROVED]) && ! $this->isExpired();
    }

    public function canReject(): bool
    {
        return in_array($this->status, [self::STATUS_SENT, self::STATUS_APPROVED]) && ! $this->isExpired();
    }

    public function canConvertToPolicy(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    public function isIssued(): bool
    {
        return in_array($this->status, [self::STATUS_SENT, self::STATUS_ACCEPTED, self::STATUS_CONVERTED]);
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
        ]);
    }

    public function markAsAccepted(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_ACCEPTED,
            'accepted_at' => now(),
        ]);
    }

    public function markAsRejected(?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejected_at' => now(),
        ]);
    }

    public function markAsExpired(): void
    {
        $this->update([
            'status' => self::STATUS_EXPIRED,
            'expired_at' => now(),
        ]);
    }

    public function duplicate(): self
    {
        $replica = $this->replicate([
            'quote_number',
            'status',
            'sent_at',
            'accepted_at',
            'rejected_at',
            'expired_at',
            'issued_at',
            'issued_by',
            'reviewed_by',
            'approved_by',
            'signed_by',
            'pdf_path',
            'checksum',
            'snapshot_json',
        ]);

        $replica->status = self::STATUS_DRAFT;
        $replica->version = 1;
        $replica->quote_number = static::generateQuoteNumber($this->tenant_id);
        $replica->valid_until = now()->addDays(30);
        $replica->save();

        foreach ($this->risks as $risk) {
            $newRisk = $risk->replicate();
            $newRisk->quote_id = $replica->id;
            $newRisk->save();
        }

        foreach ($this->clauses as $clause) {
            $newClause = $clause->replicate();
            $newClause->quote_id = $replica->id;
            $newClause->save();
        }

        return $replica;
    }

    public function extendValidity(int $days = 30): bool
    {
        $baseDate = ($this->valid_until && $this->valid_until->isFuture()) ? $this->valid_until : now();

        return $this->update([
            'valid_until' => $baseDate->addDays($days),
        ]);
    }

    protected static function booted()
    {
        static::creating(function (Quote $quote) {
            if (empty($quote->quote_number)) {
                $quote->quote_number = static::generateQuoteNumber($quote->tenant_id);
            }
            if (empty($quote->valid_until)) {
                $quote->valid_until = now()->addDays(30);
            }
            if (empty($quote->created_by)) {
                $quote->created_by = auth()->id();
            }
        });

        static::updating(function (Quote $quote) {
            if ($quote->valid_until && $quote->valid_until->isPast() &&
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
