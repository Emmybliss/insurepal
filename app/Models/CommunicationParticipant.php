<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'communication_thread_id',
        'user_id',
        'role',
        'joined_at',
        'last_read_at',
        'muted_at',
        'archived_at',
        'deleted_at',
    ];

    protected $hidden = [
        'communication_thread_id',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'last_read_at' => 'datetime',
        'muted_at' => 'datetime',
        'archived_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(CommunicationThread::class, 'communication_thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeParticipant($query)
    {
        return $query->where('role', 'participant');
    }

    public function scopeRecipient($query)
    {
        return $query->whereIn('role', ['recipient', 'cc', 'bcc']);
    }

    public function scopeSender($query)
    {
        return $query->where('role', 'sender');
    }

    public function scopeNotDeleted($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('last_read_at');
    }

    public function isDeleted(): bool
    {
        return ! is_null($this->deleted_at);
    }

    public function markAsRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    public function markAsDeleted(): void
    {
        $this->update(['deleted_at' => now()]);
    }

    public function toggleMute(): void
    {
        $this->update(['muted_at' => $this->muted_at ? null : now()]);
    }

    public function isMuted(): bool
    {
        return ! is_null($this->muted_at);
    }
}
