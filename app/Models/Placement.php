<?php

namespace App\Models;

use App\Enums\PlacementStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Placement extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'placement_number',
        'quote_id',
        'customer_id',
        'insured_id',
        'policy_product_id',
        'currency',
        'proposed_start_date',
        'proposed_end_date',
        'total_sum_insured',
        'status',
        'placement_source',
        'is_system_generated',
        'created_by',
        'approved_by',
        'notes',
        'risk_details',
    ];

    protected $casts = [
        'proposed_start_date' => 'date',
        'proposed_end_date' => 'date',
        'total_sum_insured' => 'decimal:2',
        'risk_details' => 'array',
        'is_system_generated' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function insured(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'insured_id');
    }

    public function policyProduct(): BelongsTo
    {
        return $this->belongsTo(PolicyProduct::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function markets(): HasMany
    {
        return $this->hasMany(PlacementMarket::class);
    }

    public function brokerSlips(): HasMany
    {
        return $this->hasMany(BrokerSlip::class);
    }

    public function policy(): HasOne
    {
        return $this->hasOne(Policy::class);
    }

    public function scopeByStatus($query, PlacementStatus|string $status)
    {
        return $query->where('status', $status instanceof PlacementStatus ? $status->value : $status);
    }

    public function scopeBySource(Builder $query, PlacementSource|string $source): Builder
    {
        return $query->where('placement_source', $source instanceof PlacementSource ? $source->value : $source);
    }

    public function scopeDirect(Builder $query): Builder
    {
        return $query->where('placement_source', PlacementSource::BrokerSlipDirect->value);
    }

    public function scopeSystemGenerated(Builder $query): Builder
    {
        return $query->where('is_system_generated', true);
    }

    public static function generatePlacementNumber(int $tenantId): string
    {
        $prefix = 'PL';
        $year = now()->format('Y');
        $last = static::where('tenant_id', $tenantId)
            ->where('placement_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('placement_number', 'desc')
            ->first();

        if ($last) {
            $lastNumber = intval(substr($last->placement_number, -6));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%06d', $prefix, $year, $nextNumber);
    }

    protected static function booted(): void
    {
        static::creating(function (Placement $placement) {
            if (empty($placement->placement_number)) {
                $placement->placement_number = static::generatePlacementNumber($placement->tenant_id);
            }
            if (empty($placement->created_by)) {
                $placement->created_by = auth()->id();
            }
        });
    }
}
