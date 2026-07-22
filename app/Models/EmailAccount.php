<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailAccount extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'provider',
        'email',
        'account_name',
        'credentials_encrypted',
        'oauth_token_encrypted',
        'refresh_token_encrypted',
        'token_expires_at',
        'imap_host',
        'imap_port',
        'smtp_host',
        'smtp_port',
        'is_active',
        'is_system_default',
        'last_sync_at',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'last_sync_at' => 'datetime',
            'is_active' => 'boolean',
            'is_system_default' => 'boolean',
        ];
    }

    public function folders(): HasMany
    {
        return $this->hasMany(EmailFolder::class, 'account_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'account_id');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(EmailSignature::class, 'account_id');
    }

    public function inbox(): ?EmailFolder
    {
        return $this->folders()->where('type', 'inbox')->first();
    }

    public function sent(): ?EmailFolder
    {
        return $this->folders()->where('type', 'sent')->first();
    }

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }
}
