<?php

namespace App\Models;

use App\Enums\RemittanceStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Remittance extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'remittance_number',
        'client_bank_account_id',
        'insurer_id',
        'remittance_date',
        'total_amount',
        'currency',
        'payment_method',
        'reference',
        'status',
        'reversal_reason',
        'reversed_at',
        'reversed_by',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'remittance_date' => 'date',
            'total_amount' => 'decimal:2',
            'status' => RemittanceStatus::class,
            'reversed_at' => 'datetime',
        ];
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(RemittanceAllocation::class, 'remittance_id');
    }

    public function clientBankAccount(): BelongsTo
    {
        return $this->belongsTo(ClientBankAccount::class, 'client_bank_account_id');
    }

    public function insurer(): BelongsTo
    {
        return $this->belongsTo(InsuranceCompany::class, 'insurer_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }
}
