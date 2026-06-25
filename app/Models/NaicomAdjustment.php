<?php

namespace App\Models;

use App\Enums\AdjustmentStatus;
use App\Enums\FormType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NaicomAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_run_id',
        'report_line_id',
        'form_type',
        'field',
        'calculated_value',
        'adjusted_value',
        'reason',
        'supporting_document',
        'created_by',
        'reviewed_by',
        'approved_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'form_type' => FormType::class,
            'status' => AdjustmentStatus::class,
            'calculated_value' => 'decimal:2',
            'adjusted_value' => 'decimal:2',
        ];
    }

    public function reportRun(): BelongsTo
    {
        return $this->belongsTo(NaicomReportRun::class, 'report_run_id');
    }

    public function reportLine(): BelongsTo
    {
        return $this->belongsTo(NaicomReportLine::class, 'report_line_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
