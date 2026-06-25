<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Claim extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'customer_id',
        'claim_reference',
        'claim_type',
        'incident_date',
        'incident_description',
        'incident_location',
        'claim_amount',
        'approved_amount',
        'status',
        'decision_notes',
        'internal_notes',
        'submitted_by',
        'reviewer_id',
        'metadata',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'settled_at',
        'closed_at',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'claim_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'metadata' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'settled_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';

    const STATUS_SUBMITTED = 'submitted';

    const STATUS_UNDER_REVIEW = 'under_review';

    const STATUS_INFO_REQUESTED = 'info_requested';

    const STATUS_APPROVED = 'approved';

    const STATUS_REJECTED = 'rejected';

    const STATUS_SETTLED = 'settled';

    const STATUS_CLOSED = 'closed';

    // Claim type constants
    const TYPE_ACCIDENT = 'accident';

    const TYPE_THEFT = 'theft';

    const TYPE_DAMAGE = 'damage';

    const TYPE_FIRE = 'fire';

    const TYPE_FLOOD = 'flood';

    const TYPE_MEDICAL = 'medical';

    const TYPE_DEATH = 'death';

    const TYPE_DISABILITY = 'disability';

    const TYPE_LIABILITY = 'liability';

    const TYPE_OTHER = 'other';

    // Relationships
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

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ClaimDocument::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ClaimComment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ClaimActivity::class);
    }

    // Query scopes
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    public function scopeUnderReview($query)
    {
        return $query->where('status', self::STATUS_UNDER_REVIEW);
    }

    public function scopeInfoRequested($query)
    {
        return $query->where('status', self::STATUS_INFO_REQUESTED);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeSettled($query)
    {
        return $query->where('status', self::STATUS_SETTLED);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [
            self::STATUS_SUBMITTED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_INFO_REQUESTED,
        ]);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('claim_type', $type);
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    // Status check methods
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isSubmitted(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }

    public function isUnderReview(): bool
    {
        return $this->status === self::STATUS_UNDER_REVIEW;
    }

    public function isInfoRequested(): bool
    {
        return $this->status === self::STATUS_INFO_REQUESTED;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function isPending(): bool
    {
        return in_array($this->status, [
            self::STATUS_SUBMITTED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_INFO_REQUESTED,
        ]);
    }

    // Business logic methods
    public function canSubmit(): bool
    {
        return $this->isDraft();
    }

    public function canReview(): bool
    {
        return in_array($this->status, [
            self::STATUS_SUBMITTED,
            self::STATUS_INFO_REQUESTED,
        ]);
    }

    public function canApprove(): bool
    {
        return $this->isUnderReview();
    }

    public function canReject(): bool
    {
        return $this->isUnderReview();
    }

    public function canRequestInfo(): bool
    {
        return $this->isUnderReview();
    }

    public function canSettle(): bool
    {
        return $this->isApproved();
    }

    public function canClose(): bool
    {
        return in_array($this->status, [
            self::STATUS_SETTLED,
            self::STATUS_REJECTED,
        ]);
    }

    public function canEdit(): bool
    {
        return in_array($this->status, [
            self::STATUS_DRAFT,
            self::STATUS_INFO_REQUESTED,
        ]);
    }

    public function canAddDocuments(): bool
    {
        return ! in_array($this->status, [
            self::STATUS_CLOSED,
        ]);
    }

    // Workflow methods
    public function submit(User $user): void
    {
        if (! $this->canSubmit()) {
            throw new \Exception('Claim cannot be submitted in current status');
        }

        $this->update([
            'status' => self::STATUS_SUBMITTED,
            'submitted_by' => $user->id,
            'submitted_at' => now(),
        ]);

        $this->logActivity($user, 'submitted', 'Claim submitted for review');
    }

    public function startReview(User $reviewer): void
    {
        if (! $this->canReview()) {
            throw new \Exception('Claim cannot be reviewed in current status');
        }

        $this->update([
            'status' => self::STATUS_UNDER_REVIEW,
            'reviewer_id' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        $this->logActivity($reviewer, 'review_started', 'Claim review started');
    }

    public function approve(User $reviewer, float $approvedAmount, ?string $notes = null): void
    {
        if (! $this->canApprove()) {
            throw new \Exception('Claim cannot be approved in current status');
        }

        $this->update([
            'status' => self::STATUS_APPROVED,
            'reviewer_id' => $reviewer->id,
            'approved_amount' => $approvedAmount,
            'decision_notes' => $notes,
            'approved_at' => now(),
        ]);

        $this->logActivity($reviewer, 'approved', "Claim approved for amount: {$approvedAmount}");
    }

    public function reject(User $reviewer, string $reason): void
    {
        if (! $this->canReject()) {
            throw new \Exception('Claim cannot be rejected in current status');
        }

        $this->update([
            'status' => self::STATUS_REJECTED,
            'reviewer_id' => $reviewer->id,
            'decision_notes' => $reason,
            'rejected_at' => now(),
        ]);

        $this->logActivity($reviewer, 'rejected', "Claim rejected: {$reason}");
    }

    public function requestAdditionalInfo(User $reviewer, string $message): void
    {
        if (! $this->canRequestInfo()) {
            throw new \Exception('Cannot request additional information in current status');
        }

        $this->update([
            'status' => self::STATUS_INFO_REQUESTED,
            'reviewer_id' => $reviewer->id,
            'internal_notes' => $message,
        ]);

        $this->logActivity($reviewer, 'info_requested', 'Additional information requested');
    }

    public function settle(User $user, ?string $notes = null): void
    {
        if (! $this->canSettle()) {
            throw new \Exception('Claim cannot be settled in current status');
        }

        $this->update([
            'status' => self::STATUS_SETTLED,
            'internal_notes' => $notes,
            'settled_at' => now(),
        ]);

        $this->logActivity($user, 'settled', 'Claim settled');
    }

    public function close(User $user, ?string $notes = null): void
    {
        if (! $this->canClose()) {
            throw new \Exception('Claim cannot be closed in current status');
        }

        $this->update([
            'status' => self::STATUS_CLOSED,
            'internal_notes' => $notes,
            'closed_at' => now(),
        ]);

        $this->logActivity($user, 'closed', 'Claim closed');
    }

    // Helper methods
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_SUBMITTED => 'Submitted',
            self::STATUS_UNDER_REVIEW => 'Under Review',
            self::STATUS_INFO_REQUESTED => 'Info Requested',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_SETTLED => 'Settled',
            self::STATUS_CLOSED => 'Closed',
            default => ucfirst(str_replace('_', ' ', $this->status)),
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'gray',
            self::STATUS_SUBMITTED => 'blue',
            self::STATUS_UNDER_REVIEW => 'yellow',
            self::STATUS_INFO_REQUESTED => 'orange',
            self::STATUS_APPROVED => 'green',
            self::STATUS_REJECTED => 'red',
            self::STATUS_SETTLED => 'purple',
            self::STATUS_CLOSED => 'gray',
            default => 'gray',
        };
    }

    public function getTypeLabel(): string
    {
        return ucfirst(str_replace('_', ' ', $this->claim_type));
    }

    public function getDaysOpenAttribute(): int
    {
        $startDate = $this->submitted_at ?? $this->created_at;

        return $startDate->diffInDays(now());
    }

    public static function generateClaimReference(int $tenantId): string
    {
        $year = now()->year;
        $prefix = 'CLM';

        $lastClaim = static::where('tenant_id', $tenantId)
            ->where('claim_reference', 'like', "{$prefix}-{$year}-%")
            ->orderBy('claim_reference', 'desc')
            ->first();

        if ($lastClaim) {
            $lastNumber = intval(substr($lastClaim->claim_reference, -7));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%07d', $prefix, $year, $nextNumber);
    }

    public function logActivity(User $user, string $action, string $description, ?array $properties = null): void
    {
        $this->activities()->create([
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
            'properties' => $properties,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->claim_reference ?? "Claim #{$this->id}";
    }
}
