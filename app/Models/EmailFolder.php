<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailFolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'remote_id',
        'type',
        'parent_id',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class, 'account_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'folder_id');
    }
}
