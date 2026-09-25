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
        'email_thread_id',
        'message_id_remote',
        'message_id_header',
        'uid',
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
        'references',
        'raw_headers',
        'customer_id',
        'policy_id',
        'claim_id',
        'quote_id',
        'invoice_id',
    ];

    protected function casts(): array
    {
        return [
            'to_recipients' => 'array',
            'cc_recipients' => 'array',
            'bcc_recipients' => 'array',
            'references' => 'array',
            'raw_headers' => 'array',
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

    public function thread(): BelongsTo
    {
        return $this->belongsTo(EmailThread::class, 'email_thread_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class, 'claim_id');
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
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
