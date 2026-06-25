<?php

namespace App\Models;

use App\Enums\BrokerSlipStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BrokerSlip extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'placement_id',
        'placement_market_id',
        'slip_number',
        'version',
        'currency',
        'sum_insured',
        'rate',
        'rate_basis',
        'gross_premium',
        'commission_rate',
        'commission_amount',
        'co_broker_commission',
        'reporting_broker_commission',
        'fees',
        'taxes',
        'discount',
        'net_premium',
        'period_start',
        'period_end',
        'claim_payment_condition',
        'status',
        'issued_at',
        'issued_by',
        'reviewed_by',
        'approved_by',
        'signed_by',
        'pdf_path',
        'checksum',
        'snapshot_json',
        'created_by',
    ];

    protected $casts = [
        'sum_insured' => 'decimal:2',
        'rate' => 'decimal:4',
        'gross_premium' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'co_broker_commission' => 'decimal:2',
        'reporting_broker_commission' => 'decimal:2',
        'fees' => 'decimal:2',
        'taxes' => 'decimal:2',
        'discount' => 'decimal:2',
        'net_premium' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'snapshot_json' => 'array',
        'issued_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function placementMarket(): BelongsTo
    {
        return $this->belongsTo(PlacementMarket::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BrokerSlipItem::class);
    }

    public function clauses(): HasMany
    {
        return $this->hasMany(BrokerSlipClause::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(BrokerSlipVersion::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(BrokerSlipEmailLog::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(BrokerSlipApproval::class);
    }

    public function scopeByStatus($query, BrokerSlipStatus|string $status)
    {
        return $query->where('status', $status instanceof BrokerSlipStatus ? $status->value : $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', BrokerSlipStatus::Draft->value);
    }

    public function scopeIssued($query)
    {
        return $query->where('status', BrokerSlipStatus::Issued->value);
    }

    public function isIssued(): bool
    {
        return $this->status === BrokerSlipStatus::Issued->value;
    }

    public function isDraft(): bool
    {
        return $this->status === BrokerSlipStatus::Draft->value;
    }

    public static function generateSlipNumber(int $tenantId, ?string $format = null): string
    {
        $format = $format ?: 'BS/{YEAR}/{SEQUENCE}';

        $year = now()->format('Y');

        $last = static::where('tenant_id', $tenantId)
            ->where('slip_number', 'like', "%{$year}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($last) {
            $parts = explode('/', $last->slip_number);
            $lastNumber = intval(end($parts));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        $replacements = [
            '{YEAR}' => $year,
            '{SEQUENCE}' => str_pad($nextNumber, 6, '0', STR_PAD_LEFT),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $format);
    }

    protected static function booted(): void
    {
        static::creating(function (BrokerSlip $slip) {
            if (empty($slip->slip_number)) {
                $slip->slip_number = static::generateSlipNumber($slip->tenant_id);
            }
            if (empty($slip->created_by)) {
                $slip->created_by = auth()->id();
            }
        });
    }
}
