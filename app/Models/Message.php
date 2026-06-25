<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'tenant_id',
        'subject',
        'body',
        'priority',
        'sender_id',
        'sender_type',
        'recipients',
        'attachments',
        'sent_at',
    ];

    public function fileAttributes(): array
    {
        return ['attachments'];
    }

    protected $casts = [
        'recipients' => 'array',
        'attachments' => 'array',
        'sent_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function messageRecipients(): HasMany
    {
        return $this->hasMany(MessageRecipient::class);
    }

    public function recipients()
    {
        return $this->belongsToMany(User::class, 'message_recipients', 'message_id', 'recipient_id')
            ->withPivot('recipient_type', 'read_at', 'deleted_at')
            ->withTimestamps();
    }

    public function scopeSent($query)
    {
        return $query->whereNotNull('sent_at');
    }

    public function scopeDraft($query)
    {
        return $query->whereNull('sent_at');
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeUnread($query)
    {
        return $query->whereHas('messageRecipients', function ($q) {
            $q->whereNull('read_at');
        });
    }

    public function isSent(): bool
    {
        return ! is_null($this->sent_at);
    }

    public function isDraft(): bool
    {
        return is_null($this->sent_at);
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

    public function getRecipientNamesAttribute(): string
    {
        $names = $this->recipients->pluck('name')->toArray();

        if (count($names) <= 2) {
            return implode(', ', $names);
        }

        return $names[0].' and '.(count($names) - 1).' others';
    }

    public function markAsRead(User $user): void
    {
        $this->messageRecipients()
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function isReadBy(User $user): bool
    {
        return $this->messageRecipients()
            ->where('recipient_id', $user->id)
            ->whereNotNull('read_at')
            ->exists();
    }

    public function hasAttachments(): bool
    {
        return ! empty($this->attachments);
    }
}
