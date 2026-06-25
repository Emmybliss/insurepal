<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use DeletesStorageFiles, SoftDeletes;

    public function storageDisk(): string
    {
        return 'local';
    }

    public function fileAttributes(): array
    {
        return ['original_file_path', 'processed_file_path'];
    }

    protected $fillable = [
        'tenant_id',
        'user_id',
        'name',
        'original_file_path',
        'processed_file_path',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function overlays(): HasMany
    {
        return $this->hasMany(DocumentOverlay::class);
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->name ?? $this->file_name ?? "Document #{$this->id}";
    }
}
