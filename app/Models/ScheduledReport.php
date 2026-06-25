<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledReport extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',
        'report_type',
        'frequency',
        'recipients',
        'filters',
        'format',
        'is_active',
        'next_run_at',
        'last_run_at',
        'last_successful_run_at',
        'last_error',
        'consecutive_failures',
    ];

    protected $casts = [
        'recipients' => 'array',
        'filters' => 'array',
        'is_active' => 'boolean',
        'next_run_at' => 'datetime',
        'last_run_at' => 'datetime',
        'last_successful_run_at' => 'datetime',
        'consecutive_failures' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDueForExecution($query)
    {
        return $query->where('is_active', true)
            ->where('next_run_at', '<=', now());
    }

    public function markAsExecuted(bool $successful = true, ?string $error = null): void
    {
        $this->update([
            'last_run_at' => now(),
            'last_successful_run_at' => $successful ? now() : $this->last_successful_run_at,
            'last_error' => $error,
            'consecutive_failures' => $successful ? 0 : $this->consecutive_failures + 1,
            'next_run_at' => $this->calculateNextRun(),
        ]);
    }

    protected function calculateNextRun(): \Carbon\Carbon
    {
        return match ($this->frequency) {
            'daily' => now()->addDay(),
            'weekly' => now()->addWeek(),
            'monthly' => now()->addMonth(),
            'quarterly' => now()->addMonths(3),
            default => now()->addDay(),
        };
    }

    public function shouldBeDisabled(): bool
    {
        return $this->consecutive_failures >= 5;
    }
}
