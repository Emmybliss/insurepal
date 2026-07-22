<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'filename',
        'mime_type',
        'size_bytes',
        'storage_path',
        'content_id',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(EmailMessage::class, 'message_id');
    }
}
