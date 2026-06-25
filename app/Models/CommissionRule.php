<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRule extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'scope',
        'scope_id',
        'insurer_percent',
        'broker_percent',
        'platform_percent',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'insurer_percent' => 'decimal:2',
        'broker_percent' => 'decimal:2',
        'platform_percent' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeGlobal($query)
    {
        return $query->where('scope', 'global');
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /**
     * Validate that splits sum to 100%.
     */
    public function isValid(): bool
    {
        $total = (float) $this->insurer_percent
               + (float) $this->broker_percent
               + (float) $this->platform_percent;

        return abs($total - 100.00) < 0.01;
    }

    /**
     * Calculate the split for a given amount.
     * Returns: ['insurer' => X, 'broker' => Y, 'platform' => Z]
     */
    public function splitAmount(float $amount): array
    {
        $broker = round($amount * ($this->broker_percent / 100), 2);
        $platform = round($amount * ($this->platform_percent / 100), 2);
        $insurer = round($amount - $broker - $platform, 2); // remainder to avoid rounding drift

        return compact('insurer', 'broker', 'platform');
    }

    /**
     * Find the best matching rule for a given context.
     * Priority: product-specific > class-specific > global
     */
    public static function findForPolicy(Policy $policy): ?self
    {
        $tenantId = $policy->tenant_id;

        // Product-specific rule
        if ($policy->policy_product_id) {
            $rule = static::where('tenant_id', $tenantId)
                ->where('scope', 'product')
                ->where('scope_id', $policy->policy_product_id)
                ->active()
                ->first();

            if ($rule) {
                return $rule;
            }
        }

        // Class-specific rule
        if ($policy->policy_class_id) {
            $rule = static::where('tenant_id', $tenantId)
                ->where('scope', 'policy_class')
                ->where('scope_id', $policy->policy_class_id)
                ->active()
                ->first();

            if ($rule) {
                return $rule;
            }
        }

        // Global fallback
        return static::where('tenant_id', $tenantId)
            ->where('scope', 'global')
            ->active()
            ->first();
    }
}
