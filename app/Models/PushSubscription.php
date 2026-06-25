<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'tenant_id',
        'endpoint',
        'public_key',
        'auth_token',
        'content_encoding',
    ];

    protected $hidden = [
        'public_key',
        'auth_token',
    ];

    // ── Relationships ───────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Convert to the format expected by minishlink/web-push.
     *
     * @return array{endpoint: string, publicKey: string, authToken: string, contentEncoding: string}
     */
    public function toWebPushSubscription(): array
    {
        return [
            'endpoint' => $this->endpoint,
            'publicKey' => $this->public_key,
            'authToken' => $this->auth_token,
            'contentEncoding' => $this->content_encoding,
        ];
    }
}
