<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ClaimDocument extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'claim_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'document_type',
        'description',
        'metadata',
    ];

    public function fileAttributes(): array
    {
        return ['file_path'];
    }

    protected $casts = [
        'file_size' => 'integer',
    ];

    // Document type constants
    const TYPE_INCIDENT_PHOTO = 'incident_photo';

    const TYPE_POLICE_REPORT = 'police_report';

    const TYPE_MEDICAL_REPORT = 'medical_report';

    const TYPE_REPAIR_ESTIMATE = 'repair_estimate';

    const TYPE_INVOICE = 'invoice';

    const TYPE_RECEIPT = 'receipt';

    const TYPE_WITNESS_STATEMENT = 'witness_statement';

    const TYPE_CORRESPONDENCE = 'correspondence';

    const TYPE_OTHER = 'other';

    // Relationships
    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Helper methods
    public function getDocumentTypeLabel(): string
    {
        return ucfirst(str_replace('_', ' ', $this->document_type));
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    public function getFileUrl(): string
    {
        return Storage::url($this->file_path);
    }

    public function getSignedUrl(int $expirationMinutes = 60): string
    {
        return Storage::temporaryUrl($this->file_path, now()->addMinutes($expirationMinutes));
    }

    public function isImage(): bool
    {
        return in_array(strtolower($this->file_type), ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    public function isPdf(): bool
    {
        return strtolower($this->file_type) === 'pdf';
    }

    public function isDocument(): bool
    {
        return in_array(strtolower($this->file_type), ['doc', 'docx', 'txt', 'rtf']);
    }
}
