<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClauseLibrary extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'clause_library';

    protected $fillable = [
        'tenant_id',
        'clause_type',
        'title',
        'content',
        'is_system',
        'is_active',
        'policy_class_id',
        'sort_order',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function policyClass(): BelongsTo
    {
        return $this->belongsTo(PolicyClass::class);
    }

    public function scopeByClass($query, ?int $policyClassId)
    {
        if ($policyClassId) {
            return $query->where(function ($q) use ($policyClassId) {
                $q->whereNull('policy_class_id')
                    ->orWhere('policy_class_id', $policyClassId);
            });
        }

        return $query;
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('clause_type', $type);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
