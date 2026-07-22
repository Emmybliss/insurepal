<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'folder_id',
        'message_id_remote',
        'thread_id',
        'subject',
        'body_html',
        'body_text',
        'from_address',
        'from_name',
        'to_recipients',
        'cc_recipients',
        'bcc_recipients',
        'received_at',
        'is_read',
        'is_flagged',
        'is_draft',
        'size',
        'in_reply_to',
    ];

    protected function casts(): array
    {
        return [
            'to_recipients' => 'array',
            'cc_recipients' => 'array',
            'bcc_recipients' => 'array',
            'received_at' => 'datetime',
            'is_read' => 'boolean',
            'is_flagged' => 'boolean',
            'is_draft' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class, 'account_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(EmailFolder::class, 'folder_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(EmailAttachment::class, 'message_id');
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeInFolder($query, string $folderType)
    {
        return $query->whereHas('folder', fn ($q) => $q->where('type', $folderType));
    }
}
