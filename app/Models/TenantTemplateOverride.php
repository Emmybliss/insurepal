<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class TenantTemplateOverride extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'template_key',
        'css_overrides',
        'label_overrides',
        'color_overrides',
        'font_overrides',
        'custom_content',
        'header_image',
        'footer_image',
        'signature',
        'stamp',
        'element_toggles',
    ];

    protected function casts(): array
    {
        return [
            'css_overrides' => 'array',
            'label_overrides' => 'array',
            'color_overrides' => 'array',
            'font_overrides' => 'array',
            'element_toggles' => 'array',
        ];
    }

    public function fileAttributes(): array
    {
        return ['header_image', 'footer_image', 'signature', 'stamp'];
    }
}
