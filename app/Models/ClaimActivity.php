<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClaimActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'claim_id',
        'user_id',
        'action',
        'description',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    // Relationships
    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Query scopes
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Helper methods
    public function getActionLabel(): string
    {
        return ucfirst(str_replace('_', ' ', $this->action));
    }

    public function hasProperties(): bool
    {
        return ! empty($this->properties);
    }

    public function getOldValue(string $key): mixed
    {
        return $this->properties['old'][$key] ?? null;
    }

    public function getNewValue(string $key): mixed
    {
        return $this->properties['new'][$key] ?? null;
    }
}
