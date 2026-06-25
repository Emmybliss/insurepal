<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use \App\Traits\DeletesStorageFiles, HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'phone',
        'is_active',
        'login_access',
        'last_login_at',
        'last_active_at',
        'settings',
        'locale',
        'provider_id',
        'provider_name',
        'avatar',
        'signature',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'avatar_url',
        'signature_url',
        'is_online',
    ];

    public function fileAttributes(): array
    {
        return ['avatar', 'signature'];
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'last_active_at' => 'datetime',
            'is_active' => 'boolean',
            'login_access' => 'boolean',
            'settings' => 'array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Check whether 2FA has been enabled and confirmed.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }

    /**
     * Check if this user's account was created via an OAuth provider.
     */
    public function isOAuthUser(): bool
    {
        return ! is_null($this->provider_id);
    }

    public function getIsOnlineAttribute(): bool
    {
        return $this->last_active_at && $this->last_active_at->gt(now()->subMinutes(5));
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin') && is_null($this->tenant_id);
    }

    public function isUnderwriter(): bool
    {
        return $this->hasRole('underwriter') || $this->tenant?->type === 'underwriter';
    }

    public function isBroker(): bool
    {
        return $this->hasRole('broker') || $this->tenant?->type === 'broker';
    }

    public function isStaff(): bool
    {
        return $this->hasRole(['underwriter_staff', 'broker_staff']);
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('customer');
    }

    /**
     * Get the user's primary role name
     */
    public function getPrimaryRoleName(): string
    {
        return $this->roles->first()?->name ?? 'customer';
    }

    /**
     * Get all user permissions (direct + via roles)
     */
    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        return $this->getPermissionsViaRoles()->merge($this->getDirectPermissions());
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return collect($permissions)->some(fn ($permission) => $this->can($permission));
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeSuperAdmins($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('name', 'super_admin');
        })->whereNull('tenant_id');
    }

    public function scopeTenantUsers($query)
    {
        return $query->whereNotNull('tenant_id');
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'user_id');
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class, 'created_by');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'created_by');
    }

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new \App\Notifications\VerifyEmailNotification);
    }

    /**
     * Get the URL to the user's avatar.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? asset('storage/'.$this->avatar) : null;
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'assignee_id');
    }

    public function requestedTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'requester_id');
    }

    /**
     * Get the URL to the user's signature.
     */
    public function getSignatureUrlAttribute(): ?string
    {
        return $this->signature ? asset('storage/'.$this->signature) : null;
    }
}
