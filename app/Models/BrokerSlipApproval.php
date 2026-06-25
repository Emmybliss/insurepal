<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokerSlipApproval extends Model
{
    use BelongsToTenant, HasFactory;

    const STATUS_PENDING = 'pending';

    const STATUS_UNDER_REVIEW = 'under_review';

    const STATUS_APPROVED = 'approved';

    const STATUS_REJECTED = 'rejected';

    const STATUS_CHANGES_REQUESTED = 'changes_requested';

    protected $fillable = [
        'tenant_id',
        'broker_slip_id',
        'requested_by',
        'reviewed_by',
        'status',
        'request_notes',
        'approval_notes',
        'rejection_reason',
        'changes_requested',
        'requested_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function brokerSlip(): BelongsTo
    {
        return $this->belongsTo(BrokerSlip::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function markAsUnderReview(User $reviewer): void
    {
        $this->update([
            'status' => self::STATUS_UNDER_REVIEW,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);
    }

    public function approve(?string $notes = null): void
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'approval_notes' => $notes,
            'approved_at' => now(),
        ]);

        $this->brokerSlip->update(['status' => BrokerSlipStatus::Approved->value]);
    }

    public function reject(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'rejection_reason' => $reason,
            'rejected_at' => now(),
        ]);

        $this->brokerSlip->update(['status' => BrokerSlipStatus::Draft->value]);
    }

    public function requestChanges(string $changes): void
    {
        $this->update([
            'status' => self::STATUS_CHANGES_REQUESTED,
            'changes_requested' => $changes,
            'rejected_at' => now(),
        ]);

        $this->brokerSlip->update(['status' => BrokerSlipStatus::ChangesRequested->value]);
    }
}
