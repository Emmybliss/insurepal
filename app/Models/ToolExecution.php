<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolExecution extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'ai_tool_executions';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'conversation_id',
        'tool_name',
        'parameters',
        'status',
        'result',
        'error_message',
        'approved_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'parameters' => 'array',
            'result' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }
}
