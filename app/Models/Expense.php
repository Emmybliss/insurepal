<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Traits\DeletesStorageFiles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use BelongsToTenant, DeletesStorageFiles, HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'category',
        'amount',
        'currency',
        'description',
        'expense_date',
        'receipt_path',
        'status',
    ];

    public function fileAttributes(): array
    {
        return ['receipt_path'];
    }

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
