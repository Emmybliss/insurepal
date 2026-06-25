<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantRelationship extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id',
        'requested_id',
        'status',
        'relationship_type',
        'request_message',
        'decline_reason',
        'accepted_at',
        'declined_at',
        'removed_at',
        'actioned_by',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'accepted_at' => 'datetime',
            'declined_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    // Status constants
    const STATUS_PENDING = 'pending';

    const STATUS_ACCEPTED = 'accepted';

    const STATUS_DECLINED = 'declined';

    const STATUS_REMOVED = 'removed';

    // Relationship type constants
    const TYPE_UNDERWRITER_BROKER = 'underwriter_broker';

    const TYPE_BROKER_UNDERWRITER = 'broker_underwriter';

    /**
     * The tenant who initiated the request
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'requester_id');
    }

    /**
     * The tenant who received the request
     */
    public function requested(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'requested_id');
    }

    /**
     * The user who performed the last action
     */
    public function actionedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', self::STATUS_ACCEPTED);
    }

    public function scopeDeclined($query)
    {
        return $query->where('status', self::STATUS_DECLINED);
    }

    public function scopeRemoved($query)
    {
        return $query->where('status', self::STATUS_REMOVED);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where(function ($q) use ($tenantId) {
            $q->where('requester_id', $tenantId)
                ->orWhere('requested_id', $tenantId);
        });
    }

    public function scopeSentBy($query, int $tenantId)
    {
        return $query->where('requester_id', $tenantId);
    }

    public function scopeReceivedBy($query, int $tenantId)
    {
        return $query->where('requested_id', $tenantId);
    }

    /**
     * Helper methods
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isAccepted(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    public function isDeclined(): bool
    {
        return $this->status === self::STATUS_DECLINED;
    }

    public function isRemoved(): bool
    {
        return $this->status === self::STATUS_REMOVED;
    }

    public function canBeAccepted(): bool
    {
        return $this->isPending();
    }

    public function canBeDeclined(): bool
    {
        return $this->isPending();
    }

    public function canBeRemoved(): bool
    {
        return $this->isAccepted();
    }

    public function canBeCancelled(): bool
    {
        return $this->isPending();
    }

    /**
     * Business logic methods
     */
    public function accept(User $user): void
    {
        if (! $this->canBeAccepted()) {
            throw new \Exception('This relationship request cannot be accepted in its current state.');
        }

        // Verify both tenants are active subscribers
        if (! $this->requester->isActiveSubscriber() || ! $this->requested->isActiveSubscriber()) {
            throw new \Exception('Both tenants must be active subscribers to establish a relationship.');
        }

        $this->update([
            'status' => self::STATUS_ACCEPTED,
            'accepted_at' => now(),
            'actioned_by' => $user->id,
        ]);
    }

    public function decline(User $user, ?string $reason = null): void
    {
        if (! $this->canBeDeclined()) {
            throw new \Exception('This relationship request cannot be declined in its current state.');
        }

        $this->update([
            'status' => self::STATUS_DECLINED,
            'declined_at' => now(),
            'decline_reason' => $reason,
            'actioned_by' => $user->id,
        ]);
    }

    public function remove(User $user): void
    {
        if (! $this->canBeRemoved()) {
            throw new \Exception('This relationship cannot be removed in its current state.');
        }

        $this->update([
            'status' => self::STATUS_REMOVED,
            'removed_at' => now(),
            'actioned_by' => $user->id,
        ]);
    }

    public function cancel(User $user): void
    {
        if (! $this->canBeCancelled()) {
            throw new \Exception('This relationship request cannot be cancelled in its current state.');
        }

        $this->delete();
    }

    /**
     * Check if a tenant is involved in this relationship
     */
    public function involvesTenant(int $tenantId): bool
    {
        return $this->requester_id === $tenantId || $this->requested_id === $tenantId;
    }

    /**
     * Get the other tenant in the relationship
     */
    public function getOtherTenant(int $tenantId): ?Tenant
    {
        if ($this->requester_id === $tenantId) {
            return $this->requested;
        }

        if ($this->requested_id === $tenantId) {
            return $this->requester;
        }

        return null;
    }

    /**
     * Check if relationship type is valid based on tenant types
     */
    public static function validateRelationshipType(Tenant $requester, Tenant $requested): string
    {
        if ($requester->type === 'underwriter' && $requested->type === 'broker') {
            return self::TYPE_UNDERWRITER_BROKER;
        }

        if ($requester->type === 'broker' && $requested->type === 'underwriter') {
            return self::TYPE_BROKER_UNDERWRITER;
        }

        throw new \Exception('Invalid relationship type. Only Underwriter-Broker relationships are allowed.');
    }

    /**
     * Check if a relationship exists between two tenants
     */
    public static function existsBetween(int $tenantId1, int $tenantId2): bool
    {
        return static::where(function ($query) use ($tenantId1, $tenantId2) {
            $query->where('requester_id', $tenantId1)
                ->where('requested_id', $tenantId2);
        })->orWhere(function ($query) use ($tenantId1, $tenantId2) {
            $query->where('requester_id', $tenantId2)
                ->where('requested_id', $tenantId1);
        })->exists();
    }

    /**
     * Get active relationship between two tenants
     */
    public static function getActiveBetween(int $tenantId1, int $tenantId2): ?self
    {
        return static::where(function ($query) use ($tenantId1, $tenantId2) {
            $query->where('requester_id', $tenantId1)
                ->where('requested_id', $tenantId2);
        })->orWhere(function ($query) use ($tenantId1, $tenantId2) {
            $query->where('requester_id', $tenantId2)
                ->where('requested_id', $tenantId1);
        })->where('status', self::STATUS_ACCEPTED)
            ->first();
    }
}
