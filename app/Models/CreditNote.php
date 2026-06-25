<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreditNote extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory, SoftDeletes;

    protected $fillable = [
        'note_number',
        'reference_number',
        'sequence_number',
        'status',
        'tenant_id',
        'customer_id',
        'policy_id',
        'amount',
        'tax_amount',
        'total_amount',
        'description',
        'issue_date',
        'due_date',
        'created_by_id',
        'items',
        'metadata',
        'currency_code',
        'exchange_rate',
        'type',
        'file_path',
        'file_name',
        'file_size',
        'file_hash',
        'generated_at',
        'insurer_id',
        'insurer_name',
        'insurer_email',
        'insurer_phone',
        'insurer_address',
        'insurer_source',
        'verification_token',
        'document_hash',
        'snapshot_json',
    ];

    public const STATUS_GENERATED = 'generated';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    protected $casts = [
        'amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'snapshot_json' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (CreditNote $note) {
            if (empty($note->verification_token)) {
                $note->verification_token = app(\App\Services\Documents\DocumentVerificationService::class)->generateToken();
            }
        });
    }

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function insurer(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'insurer_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    // Type Constants
    public const TYPE_STANDARD = 'standard';

    public const TYPE_TAX = 'tax';

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_ISSUED, self::STATUS_PAID]);
    }

    public static function getAvailableTypes(): array
    {
        return [
            self::TYPE_STANDARD => 'Standard',
            self::TYPE_TAX => 'Tax Credit Note',
        ];
    }

    public static function generateCreditNoteNumber(string|int|null $tenantId, string $type = 'CN'): string
    {
        $prefix = strtoupper($type);
        $year = now()->year;

        // Get the next sequence number for this tenant and year
        $query = static::where('note_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('note_number', 'desc');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $lastNote = $query->first();

        if ($lastNote) {
            $lastNumber = (int) substr($lastNote->note_number, -6);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%d-%06d', $prefix, $year, $nextNumber);
    }

    public function getRecycleBinDisplayName(): string
    {
        return $this->note_number ?? "Credit Note #{$this->id}";
    }

    public function getPolicyDisplayNameAttribute(): string
    {
        return $this->policy?->policy_number ?? 'To Be Advised';
    }
}
