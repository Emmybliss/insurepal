<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerKyc extends Model
{
    use DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'customer_id',
        'status',
        'identity_type',
        'identity_number',
        'nin',
        'bvn',
        'identity_document_path',
        'address_document_path',
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function fileAttributes(): array
    {
        return ['identity_document_path', 'address_document_path'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
