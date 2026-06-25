<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokerSlipClause extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'broker_slip_id',
        'clause_type',
        'title',
        'content',
        'is_standard',
        'sort_order',
    ];

    protected $casts = [
        'is_standard' => 'boolean',
    ];

    public function brokerSlip(): BelongsTo
    {
        return $this->belongsTo(BrokerSlip::class);
    }
}
