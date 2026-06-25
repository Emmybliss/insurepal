<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'email',
        'phone',
        'address',
        'logo',
        'settings',
        'theme_settings',
        'status',
        'trial_ends_at',
        'default_locale',
        'parent_tenant_id',
        'company_name',
        'contact_email',
        'contact_phone',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_id',
        'description',
        'registration_number',
        'naicom_reg_number',
        'ncrib_reg_number',
        'rc_number',
        'website',
        'onboarding_completed',
        'onboarding_steps',
        'onboarding_completed_at',
        'subscription_plan_id',
        'paystack_customer_code',
        'paystack_subscription_code',
        'subscription_started_at',
        'subscription_expires_at',
        'api_key',
        'public_key',
        'paystack_public_key',
        'paystack_secret_key',
        'paystack_webhook_secret',
        'signature',
        'stamp',
        'header_image',
        'footer_image',
        'slogan',
        'known_company_id',
        'known_company_source',
        'smtp_settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'theme_settings' => 'array',
        'smtp_settings' => 'array',
        'onboarding_steps' => 'array',
        'trial_ends_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
        'subscription_started_at' => 'datetime',
        'subscription_expires_at' => 'datetime',
        'onboarding_completed' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function (Tenant $tenant) {
            if (empty($tenant->slug)) {
                $tenant->slug = Str::slug($tenant->name);
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(TenantKyc::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(PolicyProduct::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(TenantApiKey::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->where('status', 'active');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function fileAttributes(): array
    {
        return ['logo', 'signature', 'stamp', 'header_image', 'footer_image'];
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function knownCompany(): BelongsTo
    {
        return $this->belongsTo(InsuranceCompany::class, 'known_company_id');
    }

    public function parentTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'parent_tenant_id');
    }

    public function childTenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'parent_tenant_id');
    }

    public function brokers(): HasMany
    {
        return $this->hasMany(Broker::class);
    }

    public function insuranceCompanies(): BelongsToMany
    {
        return $this->belongsToMany(InsuranceCompany::class, 'insurance_company_tenant')
            ->withPivot(['insurance_company_branch_id', 'branch', 'reference_code', 'is_preferred'])
            ->withTimestamps();
    }

    public function savedInsuranceCompanies(): BelongsToMany
    {
        return $this->belongsToMany(InsuranceCompany::class, 'insurance_company_tenant')
            ->withPivot(['id', 'insurance_company_branch_id', 'reference_code', 'is_preferred'])
            ->withTimestamps()
            ->join('insurance_company_branches', 'insurance_company_tenant.insurance_company_branch_id', '=', 'insurance_company_branches.id')
            ->select([
                'insurance_companies.*',
                'insurance_company_branches.name as branch_name',
                'insurance_company_branches.id as branch_id',
            ]);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(Permission::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function hasActiveSubscription(): bool
    {
        return $this->subscription()->exists();
    }

    public function isActiveSubscriber(): bool
    {
        return $this->isActive() && ($this->hasActiveSubscription() || $this->isOnTrial());
    }

    /**
     * Get theme settings with default fallback
     */
    public function getTheme(): array
    {
        return $this->theme_settings ?? self::getDefaultTheme();
    }

    /**
     * Get default theme configuration
     */
    public static function getDefaultTheme(): array
    {
        return [
            'primary_color' => '#3b82f6', // blue-500
            'secondary_color' => '#8b5cf6', // violet-500
            'accent_color' => '#10b981', // emerald-500
            'gradient' => [
                'from' => '#3b82f6',
                'via' => '#8b5cf6',
                'to' => '#ec4899',
            ],
            'sidebar_style' => 'gradient', // 'solid' or 'gradient'
            'header_style' => 'solid', // 'solid' or 'gradient'
            'body_style' => 'gradient', // 'solid', 'gradient', or 'none'
        ];
    }

    /**
     * Get available theme presets
     */
    public static function getThemePresets(): array
    {
        return [
            'ocean' => [
                'name' => 'Ocean',
                'primary_color' => '#0ea5e9',
                'secondary_color' => '#06b6d4',
                'accent_color' => '#14b8a6',
                'gradient' => ['from' => '#0ea5e9', 'via' => '#06b6d4', 'to' => '#14b8a6'],
            ],
            'sunset' => [
                'name' => 'Sunset',
                'primary_color' => '#f97316',
                'secondary_color' => '#ec4899',
                'accent_color' => '#8b5cf6',
                'gradient' => ['from' => '#f97316', 'via' => '#ec4899', 'to' => '#8b5cf6'],
            ],
            'forest' => [
                'name' => 'Forest',
                'primary_color' => '#10b981',
                'secondary_color' => '#059669',
                'accent_color' => '#14532d',
                'gradient' => ['from' => '#10b981', 'via' => '#059669', 'to' => '#14532d'],
            ],
            'royal' => [
                'name' => 'Royal',
                'primary_color' => '#6366f1',
                'secondary_color' => '#8b5cf6',
                'accent_color' => '#a855f7',
                'gradient' => ['from' => '#6366f1', 'via' => '#8b5cf6', 'to' => '#a855f7'],
            ],
            'ember' => [
                'name' => 'Ember',
                'primary_color' => '#ef4444',
                'secondary_color' => '#f97316',
                'accent_color' => '#fbbf24',
                'gradient' => ['from' => '#ef4444', 'via' => '#f97316', 'to' => '#fbbf24'],
            ],
            'professional' => [
                'name' => 'Professional',
                'primary_color' => '#1e40af',
                'secondary_color' => '#1e3a8a',
                'accent_color' => '#075985',
                'gradient' => ['from' => '#1e40af', 'via' => '#1e3a8a', 'to' => '#075985'],
            ],
        ];
    }

    /**
     * Tenant Relationships
     */
    public function relationshipsAsRequester(): HasMany
    {
        return $this->hasMany(TenantRelationship::class, 'requester_id');
    }

    public function relationshipsAsRequested(): HasMany
    {
        return $this->hasMany(TenantRelationship::class, 'requested_id');
    }

    public function allRelationships(): HasMany
    {
        return $this->hasMany(TenantRelationship::class, 'requester_id')
            ->orWhere('requested_id', $this->id);
    }

    public function acceptedRelationships()
    {
        return TenantRelationship::query()
            ->where(function ($query) {
                $query->where('requester_id', $this->id)
                    ->orWhere('requested_id', $this->id);
            })
            ->where('status', TenantRelationship::STATUS_ACCEPTED);
    }

    public function hasRelationshipWith(int $tenantId): bool
    {
        return TenantRelationship::getActiveBetween($this->id, $tenantId) !== null;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
