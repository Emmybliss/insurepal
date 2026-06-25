<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PolicyCertificate extends Model
{
    use DeletesStorageFiles, HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'certificate_number',
        'type',
        'status',
        'certificate_data',
        'generation_metadata',
        'file_path',
        'file_name',
        'file_size',
        'file_hash',
        'certificate_image_path',
        'certificate_image_name',
        'certificate_image_size',
        'barcode_data',
        'qr_code_data',
        'generated_at',
        'issued_at',
        'expires_at',
        'generated_by',
        'issued_by',
        'notes',
        'audit_trail',
    ];

    public function fileAttributes(): array
    {
        return ['file_path', 'certificate_image_path'];
    }

    protected $casts = [
        'certificate_data' => 'array',
        'generation_metadata' => 'array',
        'audit_trail' => 'array',
        'generated_at' => 'datetime',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'file_size' => 'integer',
        'certificate_image_size' => 'integer',
    ];

    // Certificate statuses
    public const STATUS_DRAFT = 'draft';

    public const STATUS_GENERATED = 'generated';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_CANCELLED = 'cancelled';

    // Certificate types
    public const TYPE_POLICY_CERTIFICATE = 'policy_certificate';

    public const TYPE_POLICY_SCHEDULE = 'policy_schedule';

    public const TYPE_ENDORSEMENT = 'endorsement';

    public const TYPE_COVERAGE_NOTE = 'coverage_note';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    // Scopes
    public function scopeOfStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeGenerated($query)
    {
        return $query->whereNotNull('generated_at');
    }

    public function scopeIssued($query)
    {
        return $query->whereNotNull('issued_at');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_GENERATED, self::STATUS_ISSUED]);
    }

    // Helper methods
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isGenerated(): bool
    {
        return $this->status === self::STATUS_GENERATED;
    }

    public function isIssued(): bool
    {
        return $this->status === self::STATUS_ISSUED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function canBeGenerated(): bool
    {
        return $this->isDraft();
    }

    public function canBeIssued(): bool
    {
        return $this->isGenerated();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_GENERATED, self::STATUS_ISSUED]);
    }

    public function getFileUrl(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return Storage::url($this->file_path);
    }

    public function getDownloadUrl(): string
    {
        return route('certificates.download', $this);
    }

    public function getPreviewUrl(): string
    {
        return route('certificates.preview', $this);
    }

    public function getCertificateImageUrl(): ?string
    {
        if (! $this->certificate_image_path) {
            return null;
        }

        return Storage::url($this->certificate_image_path);
    }

    public function hasCertificateImage(): bool
    {
        return ! empty($this->certificate_image_path) && Storage::disk('public')->exists($this->certificate_image_path);
    }

    public function deleteCertificateImage(): bool
    {
        if (! $this->certificate_image_path || ! Storage::disk('public')->exists($this->certificate_image_path)) {
            return false;
        }

        $deleted = Storage::disk('public')->delete($this->certificate_image_path);

        if ($deleted) {
            $this->update([
                'certificate_image_path' => null,
                'certificate_image_name' => null,
                'certificate_image_size' => null,
            ]);
        }

        return $deleted;
    }

    public function markAsGenerated(?string $filePath = null, ?array $metadata = null, ?string $imagePath = null): void
    {
        $updateData = [
            'status' => self::STATUS_GENERATED,
            'generated_at' => now(),
            'generated_by' => Auth::id() ?? 1,
        ];

        if ($filePath) {
            $updateData['file_path'] = $filePath;
            $updateData['file_name'] = basename($filePath);

            // Get file size if file exists on public disk
            if (Storage::disk('public')->exists($filePath)) {
                $updateData['file_size'] = Storage::disk('public')->size($filePath);
                $updateData['file_hash'] = hash_file('sha256', Storage::disk('public')->path($filePath));
            }
        }

        // Legacy image path support (deprecated)
        if ($imagePath) {
            $updateData['certificate_image_path'] = $imagePath;
            $updateData['certificate_image_name'] = basename($imagePath);

            // Get image size if file exists on public disk
            if (Storage::disk('public')->exists($imagePath)) {
                $updateData['certificate_image_size'] = Storage::disk('public')->size($imagePath);
            }
        }

        if ($metadata) {
            $updateData['generation_metadata'] = $metadata;
        }

        $this->update($updateData);
        $this->addToAuditTrail('generated', 'Certificate generated successfully');
    }

    public function markAsIssued(?string $notes = null): void
    {
        $this->update([
            'status' => self::STATUS_ISSUED,
            'issued_at' => now(),
            'issued_by' => Auth::id() ?? 1,
            'notes' => $notes,
        ]);

        $this->addToAuditTrail('issued', 'Certificate issued to customer', $notes);
    }

    public function markAsCancelled(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
        ]);

        $this->addToAuditTrail('cancelled', 'Certificate cancelled', $reason);
    }

    public function addToAuditTrail(string $action, string $description, ?string $notes = null): void
    {
        $trail = $this->audit_trail ?? [];

        $trail[] = [
            'action' => $action,
            'description' => $description,
            'notes' => $notes,
            'user_id' => Auth::id() ?? 1,
            'user_name' => Auth::user()?->name ?? 'System',
            'timestamp' => now()->toISOString(),
            'ip_address' => request()->ip(),
        ];

        $this->update(['audit_trail' => $trail]);
    }

    public static function generateCertificateNumber(int $tenantId, string $type = 'CERT'): string
    {
        $prefix = strtoupper($type);
        $year = now()->year;

        // Get the next sequence number for this tenant and year
        $lastCertificate = static::where('tenant_id', $tenantId)
            ->where('certificate_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('certificate_number', 'desc')
            ->first();

        if ($lastCertificate) {
            $lastNumber = (int) substr($lastCertificate->certificate_number, -8);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%d-%08d', $prefix, $year, $nextNumber);
    }

    public static function getAvailableStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_GENERATED => 'Generated',
            self::STATUS_ISSUED => 'Issued',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    public static function getAvailableTypes(): array
    {
        return [
            self::TYPE_POLICY_CERTIFICATE => 'Policy Certificate',
            self::TYPE_POLICY_SCHEDULE => 'Policy Schedule',
            self::TYPE_ENDORSEMENT => 'Endorsement',
            self::TYPE_COVERAGE_NOTE => 'Coverage Note',
        ];
    }
}
