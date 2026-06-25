<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Customer extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'type',
        'first_name',
        'last_name',
        'company_name',
        'logo',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'occupation',
        'annual_income',
        'address',
        'city',
        'state',
        'country',
        'is_active',
        'known_company_id',
        'known_company_source',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    public function fileAttributes(): array
    {
        return ['logo'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(CustomerKyc::class);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->type === 'corporate'
            ? $this->company_name
            : trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }

    public function hasLoginAccess(): bool
    {
        return ! is_null($this->user_id);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeIndividual($query)
    {
        return $query->where('type', 'individual');
    }

    public function scopeCorporate($query)
    {
        return $query->where('type', 'corporate');
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->getDisplayNameAttribute();
    }

    public function routeNotificationForMail(object|string $notification): array
    {
        return array_filter([$this->email]);
    }

    public function routeNotificationForTermii(object|string $notification): array
    {
        return array_filter([$this->phone]);
    }

    public function routeNotificationForSms(object|string $notification): array
    {
        return array_filter([$this->phone]);
    }

    public function routeNotificationForVoice(object|string $notification): ?string
    {
        return $this->phone;
    }
}
