<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentAsset extends Model
{
    use DeletesStorageFiles;

    protected $fillable = [
        'tenant_id',
        'type',
        'name',
        'file_path',
    ];

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
