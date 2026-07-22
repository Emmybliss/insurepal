<?php

namespace App\Models\Traits;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasAuditTrail
{
    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'subject');
    }

    public function logActivity(
        string $action,
        ?string $description = null,
        ?array $metadata = null,
        ?User $user = null,
    ): AuditLog {
        $user ??= auth()->user();

        return $this->auditLogs()->create([
            'user_id' => $user?->id,
            'action' => $action,
            'description' => $description ?? $action,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
