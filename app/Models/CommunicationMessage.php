<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunicationMessage extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'thread_id',
        'sender_id',
        'body',
        'body_type',
        'is_draft',
        'sent_at',
        'edited_at',
        'metadata',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'edited_at' => 'datetime',
        'metadata' => 'array',
        'is_draft' => 'boolean',
    ];

    public function fileAttributes(): array
    {
        return ['attachments'];
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(CommunicationThread::class, 'thread_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(CommunicationAttachment::class, 'message_id');
    }

    public function readReceipts(): HasMany
    {
        return $this->hasMany(CommunicationReadReceipt::class, 'message_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CommunicationMessage::class, 'parent_message_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(CommunicationMessage::class, 'parent_message_id');
    }

    public function scopeSent($query)
    {
        return $query->whereNotNull('sent_at')->where('is_draft', false);
    }

    public function scopeDraft($query)
    {
        return $query->where('is_draft', true);
    }

    public function scopeNotDeleted($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function isSent(): bool
    {
        return ! is_null($this->sent_at) && ! $this->is_draft;
    }

    public function isDraft(): bool
    {
        return $this->is_draft;
    }

    public function hasAttachments(): bool
    {
        return $this->attachments()->exists();
    }

    public function isReadBy(int $userId): bool
    {
        return $this->readReceipts()->where('user_id', $userId)->whereNotNull('read_at')->exists();
    }

    public function markAsReadBy(int $userId): void
    {
        CommunicationReadReceipt::updateOrCreate(
            ['message_id' => $this->id, 'user_id' => $userId],
            ['read_at' => now(), 'delivered_at' => $this->created_at]
        );
    }
}
