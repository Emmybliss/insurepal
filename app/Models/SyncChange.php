<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncChange extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $primaryKey = 'cursor';

    protected $fillable = [
        'tenant_id',
        'entity_type',
        'entity_id',
        'client_uuid',
        'action',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
