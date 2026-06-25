<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyAmendment extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'amendment_number',
        'amendment_type',
        'status',
        'original_data',
        'amended_data',
        'changes_summary',
        'premium_adjustment',
        'new_premium_amount',
        'effective_date',
        'amendment_reason',
        'internal_notes',
        'customer_notes',
        'created_by',
        'approved_by',
        'approved_at',
        'activated_at',
    ];

    protected $casts = [
        'original_data' => 'array',
        'amended_data' => 'array',
        'changes_summary' => 'array',
        'premium_adjustment' => 'decimal:2',
        'new_premium_amount' => 'decimal:2',
        'effective_date' => 'date',
        'approved_at' => 'datetime',
        'activated_at' => 'datetime',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';

    const STATUS_PENDING_APPROVAL = 'pending_approval';

    const STATUS_APPROVED = 'approved';

    const STATUS_REJECTED = 'rejected';

    const STATUS_ACTIVE = 'active';

    const STATUS_CANCELLED = 'cancelled';

    // Amendment type constants
    const TYPE_COVERAGE_CHANGE = 'coverage_change';

    const TYPE_PREMIUM_ADJUSTMENT = 'premium_adjustment';

    const TYPE_BENEFICIARY_CHANGE = 'beneficiary_change';

    const TYPE_POLICY_DETAILS_UPDATE = 'policy_details_update';

    const TYPE_TERM_EXTENSION = 'term_extension';

    const TYPE_ENDORSEMENT = 'endorsement';

    const TYPE_CORRECTION = 'correction';

    /**
     * Boot method to auto-generate amendment number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($amendment) {
            if (! $amendment->amendment_number) {
                $amendment->amendment_number = static::generateAmendmentNumber($amendment->tenant_id);
            }
        });
    }

    /**
     * Generate unique amendment number
     */
    public static function generateAmendmentNumber(int $tenantId): string
    {
        $prefix = 'AMD';
        $year = now()->year;

        // Get the next sequence number for this tenant and year
        $lastAmendment = static::where('tenant_id', $tenantId)
            ->where('amendment_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('amendment_number', 'desc')
            ->first();

        if ($lastAmendment) {
            $lastNumber = intval(substr($lastAmendment->amendment_number, -6));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%06d', $prefix, $year, $nextNumber);
    }

    /**
     * Relationships
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
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

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('amendment_type', $type);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    public function scopeEffectiveAfter($query, $date)
    {
        return $query->where('effective_date', '>', $date);
    }

    public function scopeEffectiveBefore($query, $date)
    {
        return $query->where('effective_date', '<', $date);
    }

    /**
     * Helper methods
     */
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

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    public function canBeActivated(): bool
    {
        return $this->status === self::STATUS_APPROVED && $this->effective_date <= now();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING_APPROVAL, self::STATUS_APPROVED]);
    }

    /**
     * Business logic methods
     */
    public function submitForApproval(): void
    {
        if (! $this->canBeSubmitted()) {
            throw new \Exception('Amendment cannot be submitted for approval in current status');
        }

        $this->update(['status' => self::STATUS_PENDING_APPROVAL]);
    }

    public function approve(User $approver, ?string $notes = null): void
    {
        if (! $this->canBeApproved()) {
            throw new \Exception('Amendment cannot be approved in current status');
        }

        $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'internal_notes' => $notes,
        ]);
    }

    public function reject(User $approver, string $reason): void
    {
        if (! $this->canBeApproved()) {
            throw new \Exception('Amendment cannot be rejected in current status');
        }

        $this->update([
            'status' => self::STATUS_REJECTED,
            'approved_by' => $approver->id,
            'internal_notes' => $reason,
        ]);
    }

    public function activate(): void
    {
        if (! $this->canBeActivated()) {
            throw new \Exception('Amendment cannot be activated in current status');
        }

        // Apply the amendment changes to the policy
        $this->policy->update($this->amended_data);

        $this->update([
            'status' => self::STATUS_ACTIVE,
            'activated_at' => now(),
        ]);
    }

    public function cancel(): void
    {
        if (! $this->canBeCancelled()) {
            throw new \Exception('Amendment cannot be cancelled in current status');
        }

        $this->update(['status' => self::STATUS_CANCELLED]);
    }

    /**
     * Get formatted status for display
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get formatted amendment type for display
     */
    public function getAmendmentTypeLabelAttribute(): string
    {
        return match ($this->amendment_type) {
            self::TYPE_COVERAGE_CHANGE => 'Coverage Change',
            self::TYPE_PREMIUM_ADJUSTMENT => 'Premium Adjustment',
            self::TYPE_BENEFICIARY_CHANGE => 'Beneficiary Change',
            self::TYPE_POLICY_DETAILS_UPDATE => 'Policy Details Update',
            self::TYPE_TERM_EXTENSION => 'Term Extension',
            self::TYPE_ENDORSEMENT => 'Endorsement',
            self::TYPE_CORRECTION => 'Correction',
            default => ucwords(str_replace('_', ' ', $this->amendment_type)),
        };
    }

    /**
     * Get summary of changes for display
     */
    public function getChangesSummaryTextAttribute(): string
    {
        $summary = [];

        if (is_array($this->changes_summary)) {
            foreach ($this->changes_summary as $change) {
                $summary[] = $change['field'].': '.$change['from'].' → '.$change['to'];
            }
        }

        return implode(', ', $summary);
    }
}
