<?php

namespace App\Models;

use App\Enums\ReconciliationStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankReconciliation extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'client_bank_account_id',
        'reconciliation_date',
        'closing_balance',
        'calculated_balance',
        'difference',
        'status',
        'reconciled_at',
        'reconciled_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'reconciliation_date' => 'date',
            'closing_balance' => 'decimal:2',
            'calculated_balance' => 'decimal:2',
            'difference' => 'decimal:2',
            'status' => ReconciliationStatus::class,
            'reconciled_at' => 'datetime',
        ];
    }

    public function clientBankAccount(): BelongsTo
    {
        return $this->belongsTo(ClientBankAccount::class, 'client_bank_account_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BankReconciliationLine::class, 'reconciliation_id');
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }
}
