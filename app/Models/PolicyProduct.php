<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyProduct extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_type_id',
        'policy_class_id',
        'name',
        'code',
        'description',
        'is_active',
        'form_fields',
        'default_values',
        'base_premium',
        'commission_rate',
        'premium_factors',
        'coverage_details',
        'terms_conditions',
        'exclusions',
        'default_coverage_period',
        'min_sum_assured',
        'max_sum_assured',
        'requires_underwriting',
        'requires_medical_exam',
        'required_documents',
        'currency',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'form_fields' => 'array',
        'default_values' => 'array',
        'base_premium' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'premium_factors' => 'array',
        'coverage_details' => 'array',
        'terms_conditions' => 'array',
        'exclusions' => 'array',
        'min_sum_assured' => 'decimal:2',
        'max_sum_assured' => 'decimal:2',
        'requires_underwriting' => 'boolean',
        'requires_medical_exam' => 'boolean',
        'required_documents' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function policyType(): BelongsTo
    {
        return $this->belongsTo(PolicyType::class);
    }

    public function policyClass(): BelongsTo
    {
        return $this->belongsTo(PolicyClass::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class, 'insurance_product_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'insurance_product_id');
    }

    public function preferredUnderwriters(): BelongsToMany
    {
        return $this->belongsToMany(InsuranceCompany::class, 'policy_product_preferred_underwriter');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function scopeForType($query, $policyTypeId)
    {
        return $query->where('policy_type_id', $policyTypeId);
    }

    public function scopeForClass($query, $policyClassId)
    {
        return $query->where('policy_class_id', $policyClassId);
    }

    public function getMergedFormFieldsAttribute(): array
    {
        $typeFields = $this->policyType->form_fields ?? [];
        $classFields = $this->policyClass->form_fields ?? [];
        $productFields = $this->form_fields ?? [];

        return array_merge($typeFields, $classFields, $productFields);
    }

    public function calculatePremium($sumAssured, $additionalFactors = []): float
    {
        $basePremium = $this->base_premium;

        // Apply class multiplier
        if ($this->policyClass) {
            $basePremium *= $this->policyClass->premium_multiplier;
        }

        // Apply sum assured calculation
        $premiumRate = $basePremium / 100000; // Rate per 100k
        $calculatedPremium = ($sumAssured * $premiumRate);

        // Apply additional factors
        foreach ($this->premium_factors ?? [] as $factor) {
            if (isset($additionalFactors[$factor['name']])) {
                $calculatedPremium *= (1 + ($factor['rate'] / 100));
            }
        }

        return round($calculatedPremium, 2);
    }

    public function isValidSumAssured($sumAssured): bool
    {
        if ($sumAssured < $this->min_sum_assured) {
            return false;
        }

        if ($this->max_sum_assured && $sumAssured > $this->max_sum_assured) {
            return false;
        }

        return true;
    }

    public function getFullHierarchyNameAttribute(): string
    {
        return "{$this->policyType->name} > {$this->policyClass->name} > {$this->name}";
    }
}
