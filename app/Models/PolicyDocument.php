<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PolicyDocument extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'policy_amendment_id',
        'document_type',
        'document_name',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'status',
        'generation_data',
        'generation_error',
        'is_customer_facing',
        'requires_signature',
        'generated_at',
        'sent_at',
        'downloaded_at',
        'generated_by',
    ];

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    protected $casts = [
        'generation_data' => 'array',
        'is_customer_facing' => 'boolean',
        'requires_signature' => 'boolean',
        'generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'downloaded_at' => 'datetime',
    ];

    // Status constants
    const STATUS_GENERATING = 'generating';

    const STATUS_GENERATED = 'generated';

    const STATUS_SENT = 'sent';

    const STATUS_FAILED = 'failed';

    const STATUS_ARCHIVED = 'archived';

    // Document type constants
    const TYPE_POLICY_CERTIFICATE = 'policy_certificate';

    const TYPE_POLICY_SCHEDULE = 'policy_schedule';

    const TYPE_AMENDMENT_CERTIFICATE = 'amendment_certificate';

    const TYPE_RENEWAL_NOTICE = 'renewal_notice';

    const TYPE_CANCELLATION_NOTICE = 'cancellation_notice';

    const TYPE_ENDORSEMENT = 'endorsement';

    const TYPE_CLAIM_FORM = 'claim_form';

    const TYPE_TERMS_CONDITIONS = 'terms_conditions';

    const TYPE_COVERAGE_SUMMARY = 'coverage_summary';

    const TYPE_PAYMENT_RECEIPT = 'payment_receipt';

    /**
     * Relationships
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function policyAmendment(): BelongsTo
    {
        return $this->belongsTo(PolicyAmendment::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Scopes
     */
    public function scopeGenerated($query)
    {
        return $query->where('status', self::STATUS_GENERATED);
    }

    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeCustomerFacing($query)
    {
        return $query->where('is_customer_facing', true);
    }

    public function scopeInternal($query)
    {
        return $query->where('is_customer_facing', false);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId);
    }

    public function scopeRequiringSignature($query)
    {
        return $query->where('requires_signature', true);
    }

    /**
     * Helper methods
     */
    public function isGenerating(): bool
    {
        return $this->status === self::STATUS_GENERATING;
    }

    public function isGenerated(): bool
    {
        return $this->status === self::STATUS_GENERATED;
    }

    public function isSent(): bool
    {
        return $this->status === self::STATUS_SENT;
    }

    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    public function canBeDownloaded(): bool
    {
        return in_array($this->status, [self::STATUS_GENERATED, self::STATUS_SENT]);
    }

    public function canBeResent(): bool
    {
        return $this->status === self::STATUS_GENERATED;
    }

    public function canBeRegenerated(): bool
    {
        return in_array($this->status, [self::STATUS_FAILED, self::STATUS_GENERATED]);
    }

    /**
     * Business logic methods
     */
    public function markAsGenerated(string $filePath): void
    {
        $this->update([
            'status' => self::STATUS_GENERATED,
            'file_path' => $filePath,
            'file_size' => $this->getFileSize($filePath),
            'generated_at' => now(),
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'generation_error' => $error,
        ]);
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
        ]);
    }

    public function markAsDownloaded(): void
    {
        $this->update(['downloaded_at' => now()]);
    }

    public function archive(): void
    {
        $this->update(['status' => self::STATUS_ARCHIVED]);
    }

    /**
     * File operations
     */
    public function getFileSize(string $filePath): int
    {
        return Storage::exists($filePath) ? Storage::size($filePath) : 0;
    }

    public function getDownloadUrl(): string
    {
        return route('policies.documents.download', [
            'policy' => $this->policy_id,
            'document' => $this->id,
        ]);
    }

    public function exists(): bool
    {
        return Storage::disk('public')->exists($this->file_path);
    }

    /**
     * Get formatted status for display
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_GENERATING => 'Generating',
            self::STATUS_GENERATED => 'Generated',
            self::STATUS_SENT => 'Sent',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_ARCHIVED => 'Archived',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get formatted document type for display
     */
    public function getDocumentTypeLabelAttribute(): string
    {
        return match ($this->document_type) {
            self::TYPE_POLICY_CERTIFICATE => 'Policy Certificate',
            self::TYPE_POLICY_SCHEDULE => 'Policy Schedule',
            self::TYPE_AMENDMENT_CERTIFICATE => 'Amendment Certificate',
            self::TYPE_RENEWAL_NOTICE => 'Renewal Notice',
            self::TYPE_CANCELLATION_NOTICE => 'Cancellation Notice',
            self::TYPE_ENDORSEMENT => 'Endorsement',
            self::TYPE_CLAIM_FORM => 'Claim Form',
            self::TYPE_TERMS_CONDITIONS => 'Terms & Conditions',
            self::TYPE_COVERAGE_SUMMARY => 'Coverage Summary',
            self::TYPE_PAYMENT_RECEIPT => 'Payment Receipt',
            default => ucwords(str_replace('_', ' ', $this->document_type)),
        };
    }

    /**
     * Get formatted file size for display
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        } elseif ($bytes > 1) {
            return $bytes.' bytes';
        } elseif ($bytes == 1) {
            return $bytes.' byte';
        } else {
            return '0 bytes';
        }
    }
}
