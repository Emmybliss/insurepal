<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentOverlay extends Model
{
    protected $fillable = [
        'document_id',
        'type',
        'page_number',
        'position_x',
        'position_y',
        'width',
        'height',
        'rotation',
        'content',
        'settings',
    ];

    protected $casts = [
        'position_x' => 'float',
        'position_y' => 'float',
        'width' => 'float',
        'height' => 'float',
        'rotation' => 'float',
        'settings' => 'array',
        'page_number' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
