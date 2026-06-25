<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClaimComment extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'claim_id',
        'author_id',
        'body',
        'attachments',
        'is_internal',
        'parent_id',
    ];

    public function fileAttributes(): array
    {
        return ['attachments'];
    }

    protected $casts = [
        'attachments' => 'array',
        'is_internal' => 'boolean',
    ];

    // Relationships
    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ClaimComment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ClaimComment::class, 'parent_id');
    }

    // Query scopes
    public function scopePublic($query)
    {
        return $query->where('is_internal', false);
    }

    public function scopeInternal($query)
    {
        return $query->where('is_internal', true);
    }

    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    // Helper methods
    public function hasAttachments(): bool
    {
        return ! empty($this->attachments);
    }

    public function hasReplies(): bool
    {
        return $this->replies()->exists();
    }

    public function isReply(): bool
    {
        return ! is_null($this->parent_id);
    }
}
