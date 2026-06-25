<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'title',
        'content',
        'type',
        'priority',
        'expires_at',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            'high' => 'text-red-600',
            'medium' => 'text-yellow-600',
            'low' => 'text-green-600',
            default => 'text-gray-600',
        };
    }

    public function getPriorityBadgeColorAttribute(): string
    {
        return match ($this->priority) {
            'high' => 'bg-red-100 text-red-800',
            'medium' => 'bg-yellow-100 text-yellow-800',
            'low' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getTypeIconAttribute(): string
    {
        return match ($this->type) {
            'maintenance' => 'Wrench',
            'update' => 'RefreshCw',
            'security' => 'Shield',
            'feature' => 'Star',
            'general' => 'Megaphone',
            default => 'Bell',
        };
    }

    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    public static function createForTenant(
        Tenant $tenant,
        string $title,
        string $content,
        string $type = 'general',
        string $priority = 'medium',
        ?\DateTime $expiresAt = null,
        ?User $createdBy = null
    ): self {
        return self::create([
            'tenant_id' => $tenant->id,
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'priority' => $priority,
            'expires_at' => $expiresAt,
            'is_active' => true,
            'created_by' => $createdBy?->id,
        ]);
    }
}
