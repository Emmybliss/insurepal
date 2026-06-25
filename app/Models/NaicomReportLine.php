<?php

namespace App\Models;

use App\Enums\FormType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class NaicomReportLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_run_id',
        'form_type',
        'row_number',
        'month',
        'data',
        'source_type',
        'source_id',
        'calculated_amount',
        'adjusted_amount',
        'adjustment_id',
    ];

    protected function casts(): array
    {
        return [
            'form_type' => FormType::class,
            'row_number' => 'integer',
            'month' => 'integer',
            'data' => 'array',
            'calculated_amount' => 'decimal:2',
            'adjusted_amount' => 'decimal:2',
        ];
    }

    public function reportRun(): BelongsTo
    {
        return $this->belongsTo(NaicomReportRun::class, 'report_run_id');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(NaicomAdjustment::class, 'adjustment_id');
    }
}
