<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'app_notifications';

    protected $fillable = [
        'tenant_id',
        'type',
        'user_id',
        'title',
        'message',
        'data',
        'priority',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }

    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }

    public function markAsRead(): void
    {
        if (! $this->isRead()) {
            $this->update(['read_at' => now()]);
        }
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
            'policy_expiry' => 'Calendar',
            'payment_due' => 'CreditCard',
            'document_ready' => 'FileText',
            'renewal_reminder' => 'RefreshCw',
            'system_alert' => 'AlertTriangle',
            default => 'Bell',
        };
    }

    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    public static function createForUser(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = 'medium'
    ): self {
        return self::create([
            'tenant_id' => $user->tenant_id,
            'type' => $type,
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'priority' => $priority,
        ]);
    }

    public static function createForTenant(
        Tenant $tenant,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = 'medium'
    ): void {
        $users = User::where('tenant_id', $tenant->id)->get();

        foreach ($users as $user) {
            self::createForUser($user, $type, $title, $message, $data, $priority);
        }
    }
}
