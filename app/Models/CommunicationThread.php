<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CommunicationThread extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'created_by',
        'mode',
        'type',
        'subject',
        'priority',
        'status',
        'assigned_to',
        'related_type',
        'related_id',
        'last_message_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_message_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CommunicationMessage::class, 'thread_id')->orderBy('created_at');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(CommunicationMessage::class, 'thread_id')->latestOfMany();
    }

    public function participants(): HasMany
    {
        return $this->hasMany(CommunicationParticipant::class, 'communication_thread_id');
    }

    public function typedMessages(): HasMany
    {
        return $this->hasMany(CommunicationMessage::class, 'thread_id')->where('is_draft', false);
    }

    public function scopeEmailMode($query)
    {
        return $query->where('mode', 'email');
    }

    public function scopeChatMode($query)
    {
        return $query->where('mode', 'chat');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->whereHas('participants', fn ($q) => $q->where('user_id', $userId)->whereNull('deleted_at'));
    }

    public function scopeUnreadForUser($query, int $userId)
    {
        return $query->whereHas('participants', fn ($q) => $q->where('user_id', $userId)->whereNull('last_read_at'));
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeRelatedTo($query, string $relatedType, int $relatedId)
    {
        return $query->where('related_type', $relatedType)->where('related_id', $relatedId);
    }

    public function isParticipant(int $userId): bool
    {
        return \DB::table('communication_participants')
            ->where('communication_thread_id', $this->id)
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->exists();
    }

    public function hasValidParticipantRole(int $userId): bool
    {
        return \DB::table('communication_participants')
            ->where('communication_thread_id', $this->id)
            ->where('user_id', $userId)
            ->whereIn('role', ['sender', 'recipient', 'cc', 'bcc'])
            ->whereNull('deleted_at')
            ->exists();
    }

    public function getUnreadCountForUser(int $userId): int
    {
        return $this->typedMessages()
            ->where('sender_id', '!=', $userId)
            ->whereDoesntHave('readReceipts', fn ($q) => $q->where('user_id', $userId))
            ->count();
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'open' => 'text-green-600',
            'assigned' => 'text-blue-600',
            'resolved' => 'text-gray-600',
            'closed' => 'text-red-600',
            'archived' => 'text-gray-400',
            default => 'text-gray-600',
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            'urgent' => 'text-red-600',
            'high' => 'text-orange-600',
            'normal' => 'text-blue-600',
            'low' => 'text-gray-600',
            default => 'text-gray-600',
        };
    }

    public function getPriorityBadgeColorAttribute(): string
    {
        return match ($this->priority) {
            'urgent' => 'bg-red-100 text-red-800',
            'high' => 'bg-orange-100 text-orange-800',
            'normal' => 'bg-blue-100 text-blue-800',
            'low' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
