<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Traits\HasAuditTrail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use BelongsToTenant, HasAuditTrail, HasFactory, SoftDeletes;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'title',
        'context_type',
        'context_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class, 'conversation_id');
    }

    public function toolExecutions(): HasMany
    {
        return $this->hasMany(ToolExecution::class, 'conversation_id');
    }
}
