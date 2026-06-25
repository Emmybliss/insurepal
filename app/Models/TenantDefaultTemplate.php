<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TenantDefaultTemplate extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'document_type',
        'template_key',
    ];

    public static function getDefaultTemplateKey(int $tenantId, string $documentType): ?string
    {
        return static::where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->value('template_key');
    }
}
