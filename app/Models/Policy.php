<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Policy extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'quote_id',
        'policy_product_id',
        'policy_class_id',
        'policy_type_id',
        'policy_number',
        'source_type',
        'status',
        'approval_status',
        'effective_date',
        'expiry_date',
        'placement_id',
        'coverage_details',
        'premium_amount',
        'commission_amount',
        'total_amount',
        'payment_frequency',
        'form_data',
        'terms_conditions',
        'notes',
        'internal_notes',
        'created_by',
        'approved_by',
        'approved_at',
        'issued_at',
        'renewed_at',
        'auto_renewal_notification',
        'insurer_id',
        'insurer_name',
        'insurer_email',
        'insurer_phone',
        'insurer_address',
        'insurer_source',
        'sum_insured',
        'net_premium',
        'issued_by_id',
        'broker_id',
        'broker_slip_number',
        'placement_date',
        'is_policy_issued',
        'schedule_file_path',
        'broker_slip_file_path',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiry_date' => 'date',
        'placement_date' => 'date',
        'coverage_details' => 'array',
        'premium_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'sum_insured' => 'decimal:2',
        'net_premium' => 'decimal:2',
        'form_data' => 'array',
        'approved_at' => 'datetime',
        'issued_at' => 'datetime',
        'renewed_at' => 'datetime',
        'auto_renewal_notification' => 'boolean',
        'is_policy_issued' => 'boolean',
    ];

    protected $appends = [
        'financial_notes',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';

    const STATUS_PENDING_APPROVAL = 'pending_approval';

    const STATUS_APPROVED = 'approved';

    const STATUS_ACTIVE = 'active';

    const STATUS_EXPIRED = 'expired';

    const STATUS_CANCELLED = 'cancelled';

    const STATUS_SUSPENDED = 'suspended';

    const STATUS_REJECTED = 'rejected';

    const STATUS_RECORDED = 'recorded';

    // Source type constants
    const SOURCE_DIRECT_ISSUANCE = 'DIRECT_ISSUANCE';

    const SOURCE_BROKER_RECORDED = 'BROKER_RECORDED';

    const SOURCE_IMPORTED = 'IMPORTED';

    const SOURCE_API = 'API';

    // Approval status constants
    const APPROVAL_NOT_REQUIRED = 'not_required';

    const APPROVAL_PENDING = 'pending';

    const APPROVAL_APPROVED = 'approved';

    const APPROVAL_REJECTED = 'rejected';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function insurer(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'insurer_id');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by_id');
    }

    public function brokerTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'broker_id');
    }

    public function policyProduct(): BelongsTo
    {
        return $this->belongsTo(PolicyProduct::class);
    }

    public function policyType(): BelongsTo
    {
        return $this->belongsTo(PolicyType::class);
    }

    public function policyClass(): BelongsTo
    {
        return $this->belongsTo(PolicyClass::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function debitNotes(): HasMany
    {
        return $this->hasMany(DebitNote::class);
    }

    public function creditNotes(): HasMany
    {
        return $this->hasMany(CreditNote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    // Note: The payments table doesn't have a policy_id column.
    // Policy payments are currently tracked through financial notes.
    // If policy-specific payments are needed, a new table or relationship should be created.

    public function approvals(): HasMany
    {
        return $this->hasMany(PolicyApproval::class);
    }

    public function receiptAllocations(): HasMany
    {
        return $this->hasMany(ReceiptAllocation::class, 'policy_id');
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(PolicyAmendment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PolicyDocument::class);
    }

    public function getFinancialNotesAttribute()
    {
        if (! $this->relationLoaded('creditNotes') || ! $this->relationLoaded('debitNotes')) {
            $this->load('creditNotes', 'debitNotes');
        }

        return $this->creditNotes->merge($this->debitNotes);
    }

    public function notificationLogs(): HasMany
    {
        return $this->hasMany(PolicyNotificationLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where(function ($q) {
                $q->whereNull('expiry_date')
                    ->orWhere('expiry_date', '>=', now()->toDateString());
            });
    }

    public function scopeExpired($query)
    {
        return $query->where(function ($q) {
            $q->where('status', self::STATUS_EXPIRED)
                ->orWhere(function ($q2) {
                    $q2->where('status', self::STATUS_ACTIVE)
                        ->whereNotNull('expiry_date')
                        ->where('expiry_date', '<', now()->toDateString());
                });
        });
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', self::STATUS_PENDING_APPROVAL);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function scopeAwaitingApproval($query)
    {
        return $query->whereIn('approval_status', [self::APPROVAL_PENDING]);
    }

    public function scopeDirectIssuance($query)
    {
        return $query->where('source_type', self::SOURCE_DIRECT_ISSUANCE);
    }

    public function scopeBrokerRecorded($query)
    {
        return $query->where('source_type', self::SOURCE_BROKER_RECORDED);
    }

    public function scopeExpiring($query, $days = 30)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('expiry_date', '<=', now()->addDays($days)->toDateString());
    }

    public function scopeForCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForType($query, $policyTypeId)
    {
        return $query->where('policy_type_id', $policyTypeId);
    }

    public function scopeForClass($query, $policyClassId)
    {
        return $query->where('policy_class_id', $policyClassId);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE && (! $this->expiry_date || $this->expiry_date >= now()->startOfDay());
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED ||
               ($this->status === self::STATUS_ACTIVE && $this->expiry_date && $this->expiry_date < now()->startOfDay());
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPendingApproval(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isBrokerRecorded(): bool
    {
        return $this->source_type === self::SOURCE_BROKER_RECORDED;
    }

    public function isDirectIssuance(): bool
    {
        return $this->source_type === self::SOURCE_DIRECT_ISSUANCE;
    }

    public function requiresApproval(): bool
    {
        return $this->approval_status === self::APPROVAL_PENDING;
    }

    public function canBeIssued(): bool
    {
        if ($this->isBrokerRecorded()) {
            return false;
        }

        return in_array($this->status, [self::STATUS_APPROVED]) &&
               in_array($this->approval_status, [self::APPROVAL_APPROVED, self::APPROVAL_NOT_REQUIRED]);
    }

    public function getSourceTypeLabelAttribute(): string
    {
        return match ($this->source_type) {
            self::SOURCE_DIRECT_ISSUANCE => 'Direct Issuance',
            self::SOURCE_BROKER_RECORDED => 'Broker Recorded',
            self::SOURCE_IMPORTED => 'Imported',
            self::SOURCE_API => 'API',
            default => ucfirst(str_replace('_', ' ', $this->source_type ?? '')),
        };
    }

    public function canBeAmended(): bool
    {
        return in_array($this->status, [self::STATUS_ACTIVE]);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_APPROVAL, self::STATUS_APPROVED, self::STATUS_ACTIVE]);
    }

    public function canBeRenewed(): bool
    {
        return $this->status === self::STATUS_ACTIVE && $this->expiry_date <= now()->addDays(90);
    }

    public function isExpiring($days = 30): bool
    {
        return $this->isActive() && $this->expiry_date <= now()->addDays($days);
    }

    public function getDaysUntilExpiryAttribute(): int
    {
        return now()->diffInDays($this->expiry_date, false);
    }

    public function getPolicyDisplayNameAttribute(): string
    {
        return $this->policy_number.' - '.($this->policyProduct->name ?? 'Unknown Product');
    }

    /**
     * Business logic methods for policy issuance workflow
     */
    public function submitForApproval(User $submitter): void
    {
        if (! in_array($this->status, [self::STATUS_DRAFT])) {
            throw new \Exception('Policy cannot be submitted for approval in current status');
        }

        $this->update([
            'status' => self::STATUS_PENDING_APPROVAL,
            'approval_status' => self::APPROVAL_PENDING,
        ]);
    }

    public function approve(User $approver, ?string $notes = null): void
    {
        if (! $this->isPendingApproval()) {
            throw new \Exception('Policy cannot be approved in current status');
        }

        $this->update([
            'status' => self::STATUS_APPROVED,
            'approval_status' => self::APPROVAL_APPROVED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'internal_notes' => $notes,
        ]);
    }

    public function reject(User $approver, string $reason): void
    {
        if (! $this->isPendingApproval()) {
            throw new \Exception('Policy cannot be rejected in current status');
        }

        $this->update([
            'status' => self::STATUS_REJECTED,
            'approval_status' => self::APPROVAL_REJECTED,
            'approved_by' => $approver->id,
            'internal_notes' => $reason,
        ]);
    }

    public function issue(): void
    {
        if (! $this->canBeIssued()) {
            throw new \Exception('Policy cannot be issued in current status');
        }

        $this->update([
            'status' => self::STATUS_ACTIVE,
            'issued_at' => now(),
        ]);
    }

    public function cancel(?string $reason = null): void
    {
        if (! $this->canBeCancelled()) {
            throw new \Exception('Policy cannot be cancelled in current status');
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'internal_notes' => $reason,
        ]);
    }

    public function suspend(?string $reason = null): void
    {
        if (! $this->isActive()) {
            throw new \Exception('Only active policies can be suspended');
        }

        $this->update([
            'status' => self::STATUS_SUSPENDED,
            'internal_notes' => $reason,
        ]);
    }

    public function reinstate(): void
    {
        if (! $this->isSuspended()) {
            throw new \Exception('Only suspended policies can be reinstated');
        }

        $this->update(['status' => self::STATUS_ACTIVE]);
    }

    /**
     * Get formatted status for display
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->isExpired()) {
            return 'Expired';
        }

        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_EXPIRED => 'Expired',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_SUSPENDED => 'Suspended',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_RECORDED => 'Recorded',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get formatted approval status for display
     */
    public function getApprovalStatusLabelAttribute(): string
    {
        return match ($this->approval_status) {
            self::APPROVAL_NOT_REQUIRED => 'Not Required',
            self::APPROVAL_PENDING => 'Pending',
            self::APPROVAL_APPROVED => 'Approved',
            self::APPROVAL_REJECTED => 'Rejected',
            default => ucfirst(str_replace('_', ' ', $this->approval_status ?? '')),
        };
    }

    /**
     * Generate policy number
     */
    public static function generatePolicyNumber(int $tenantId, string $productCode = 'POL'): string
    {
        $year = now()->year;
        $prefix = strtoupper($productCode);

        // Get the next sequence number for this tenant and year
        $lastPolicy = static::where('tenant_id', $tenantId)
            ->where('policy_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('policy_number', 'desc')
            ->first();

        if ($lastPolicy) {
            $lastNumber = intval(substr($lastPolicy->policy_number, -8));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%08d', $prefix, $year, $nextNumber);
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->policy_number ?? "Policy #{$this->id}";
    }
}
