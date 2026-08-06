<?php

namespace App\Models;

use App\Enums\QuoteStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteApproval extends Model
{
    use BelongsToTenant, HasFactory;

    const STATUS_PENDING = 'pending';

    const STATUS_UNDER_REVIEW = 'under_review';

    const STATUS_APPROVED = 'approved';

    const STATUS_REJECTED = 'rejected';

    const STATUS_CHANGES_REQUESTED = 'changes_requested';

    protected $fillable = [
        'tenant_id',
        'quote_id',
        'requested_by',
        'approved_by',
        'status',
        'request_notes',
        'review_notes',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approve(?string $notes = null): void
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'review_notes' => $notes,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        $this->quote->update([
            'status' => QuoteStatus::Approved->value,
            'approved_by' => auth()->id(),
        ]);
    }

    public function requestChanges(string $changes): void
    {
        $this->update([
            'status' => self::STATUS_CHANGES_REQUESTED,
            'review_notes' => $changes,
        ]);

        $this->quote->update(['status' => QuoteStatus::ChangesRequested->value]);
    }
}
