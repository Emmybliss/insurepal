<?php

namespace App\Models;

use App\Enums\ReportHalf;
use App\Enums\ReportStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NaicomReportRun extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'reporting_year',
        'reporting_half',
        'status',
        'commission_recognition_date',
        'generated_by',
        'reviewed_by',
        'approved_by',
        'approved_at',
        'locked_at',
        'submitted_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'reporting_year' => 'integer',
            'reporting_half' => ReportHalf::class,
            'status' => ReportStatus::class,
            'commission_recognition_date' => 'date',
            'approved_at' => 'datetime',
            'locked_at' => 'datetime',
            'submitted_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(NaicomReportLine::class, 'report_run_id');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(NaicomAdjustment::class, 'report_run_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isLocked(): bool
    {
        return in_array($this->status->value, ['locked', 'approved', 'exported', 'submitted'], true);
    }

    public function isMutable(): bool
    {
        return ! $this->isLocked() && $this->status->value !== 'restated';
    }
}
