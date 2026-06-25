<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantKyc extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'tenant_id',
        'status',
        'rc_number',
        'naicom_reg_number',
        'tin',
        'incorporation_cert_path',
        'naicom_license_path',
        'prof_indemnity_path',
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function fileAttributes(): array
    {
        return ['incorporation_cert_path', 'naicom_license_path', 'prof_indemnity_path'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
