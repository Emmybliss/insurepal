<?php

namespace App\Models;

use App\Enums\PlacementMarketStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlacementMarket extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'placement_id',
        'insurance_company_id',
        'insurer_branch',
        'contact_person',
        'contact_email',
        'is_lead',
        'participation_percentage',
        'offered_rate',
        'rate_basis',
        'gross_premium',
        'commission_rate',
        'commission_amount',
        'co_broker_commission',
        'reporting_broker_commission',
        'fees',
        'taxes',
        'net_premium',
        'status',
        'response_date',
        'response_notes',
        'insurer_reference',
        'sent_at',
    ];

    protected $casts = [
        'is_lead' => 'boolean',
        'participation_percentage' => 'decimal:2',
        'offered_rate' => 'decimal:4',
        'gross_premium' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'co_broker_commission' => 'decimal:2',
        'reporting_broker_commission' => 'decimal:2',
        'fees' => 'decimal:2',
        'taxes' => 'decimal:2',
        'net_premium' => 'decimal:2',
        'sent_at' => 'datetime',
        'response_date' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }

    public function insuranceCompany(): BelongsTo
    {
        return $this->belongsTo(InsuranceCompany::class);
    }

    public function brokerSlips(): HasMany
    {
        return $this->hasMany(BrokerSlip::class);
    }

    public function scopeByStatus($query, PlacementMarketStatus|string $status)
    {
        return $query->where('status', $status instanceof PlacementMarketStatus ? $status->value : $status);
    }

    public function scopeLead($query)
    {
        return $query->where('is_lead', true);
    }
}
