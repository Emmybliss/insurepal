<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class InsuranceProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'form_fields',
        'premium_rules',
        'base_premium',
        'is_active',
    ];

    protected $casts = [
        'form_fields' => 'array',
        'premium_rules' => 'array',
        'base_premium' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function (InsuranceProduct $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function calculatePremium(array $formData): float
    {
        $basePremium = $this->base_premium;

        if (! $this->premium_rules) {
            return $basePremium;
        }

        $premium = $basePremium;

        foreach ($this->premium_rules as $rule) {
            $premium = $this->applyPremiumRule($premium, $rule, $formData);
        }

        return max($premium, 0);
    }

    private function applyPremiumRule(float $premium, array $rule, array $formData): float
    {
        $field = $rule['field'] ?? null;
        $operator = $rule['operator'] ?? 'multiply';
        $factor = $rule['factor'] ?? 1;

        if (! $field || ! isset($formData[$field])) {
            return $premium;
        }

        $value = $formData[$field];

        return match ($operator) {
            'multiply' => $premium * $factor,
            'add' => $premium + $factor,
            'percentage' => $premium * (1 + ($factor / 100)),
            default => $premium,
        };
    }
}
