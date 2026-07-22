<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentTemplate extends Model
{
    use HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'category',
        'type',
        'mode',
        'html_template_key',
        'css_overrides',
        'label_overrides',
        'document_type',
        'certificate_type',
        'page_size',
        'orientation',
        'include_watermark',
        'watermark_text',
        'include_barcode',
        'include_qr_code',
        'include_seal',
        'include_signatures',
        'design_json',
        'header_config',
        'footer_config',
        'body_html',
        'body_css',
        'overlay_elements',
        'placeholder_definitions',
        'page_settings',
        'thumbnail_path',
        'header_image_path',
        'footer_image_path',
        'description',
        'status',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'css_overrides' => 'array',
        'label_overrides' => 'array',
        'design_json' => 'array',
        'header_config' => 'array',
        'footer_config' => 'array',
        'body_css' => 'array',
        'overlay_elements' => 'array',
        'placeholder_definitions' => 'array',
        'page_settings' => 'array',
        'include_watermark' => 'boolean',
        'include_barcode' => 'boolean',
        'include_qr_code' => 'boolean',
        'include_seal' => 'boolean',
        'include_signatures' => 'boolean',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
