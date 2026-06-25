<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receipt extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';

    const STATUS_COMPLETED = 'completed';

    const STATUS_FAILED = 'failed';

    const STATUS_REFUNDED = 'refunded';

    const STATUS_VOIDED = 'voided';

    const PAYMENT_METHOD_CASH = 'cash';

    const PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer';

    const PAYMENT_METHOD_CHEQUE = 'cheque';

    const PAYMENT_METHOD_CREDIT_CARD = 'credit_card';

    const PAYMENT_METHOD_DEBIT_CARD = 'debit_card';

    const PAYMENT_METHOD_MOBILE_MONEY = 'mobile_money';

    const PAYMENT_METHOD_OTHER = 'other';

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'policy_id',
        'invoice_id',
        'receipt_number',
        'payment_date',
        'payment_method',
        'payment_reference',
        'amount_paid',
        'transaction_id',
        'notes',
        'payment_status',
        'currency',
        'file_path',
        'client_bank_account_id',
        'cleared_at',
        'is_cleared',
        'verification_token',
        'document_hash',
        'snapshot_json',
    ];

    protected static function booted(): void
    {
        static::creating(function (Receipt $receipt) {
            if (empty($receipt->verification_token)) {
                $receipt->verification_token = app(\App\Services\Documents\DocumentVerificationService::class)->generateToken();
            }
        });
    }

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    protected $casts = [
        'payment_date' => 'datetime',
        'amount_paid' => 'decimal:2',
        'cleared_at' => 'datetime',
        'is_cleared' => 'boolean',
        'snapshot_json' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receiptAllocations(): HasMany
    {
        return $this->hasMany(ReceiptAllocation::class, 'receipt_id');
    }

    public function clientBankAccount(): BelongsTo
    {
        return $this->belongsTo(ClientBankAccount::class, 'client_bank_account_id');
    }

    // Scopes
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('payment_status', self::STATUS_COMPLETED);
    }

    public function scopeByPaymentMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    // Helpers
    public function isCompleted(): bool
    {
        return $this->payment_status === self::STATUS_COMPLETED;
    }

    public function isPending(): bool
    {
        return $this->payment_status === self::STATUS_PENDING;
    }

    public function markAsCompleted(): void
    {
        $this->update(['payment_status' => self::STATUS_COMPLETED]);

        if ($this->invoice) {
            $totalPaid = $this->invoice->receipts()
                ->where('payment_status', self::STATUS_COMPLETED)
                ->sum('amount_paid');

            if ($totalPaid >= $this->invoice->total_amount) {
                $this->invoice->markAsPaid();
            } elseif ($totalPaid > 0) {
                $this->invoice->markAsPartiallyPaid();
            }
        }
    }

    public function markAsRefunded(): void
    {
        $this->update(['payment_status' => self::STATUS_REFUNDED]);
    }

    public function void(?string $reason = null): void
    {
        $this->update([
            'payment_status' => self::STATUS_VOIDED,
            'notes' => $reason ? trim($this->notes."\n".$reason) : $this->notes,
        ]);
    }

    public static function generateReceiptNumber(int $tenantId): string
    {
        $prefix = 'RCP';
        $year = now()->year;

        $lastReceipt = static::where('tenant_id', $tenantId)
            ->where('receipt_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('receipt_number', 'desc')
            ->first();

        if ($lastReceipt) {
            $lastNumber = intval(substr($lastReceipt->receipt_number, -8));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%08d', $prefix, $year, $nextNumber);
    }
}
