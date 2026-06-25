<?php

namespace App\Models;

use App\Traits\DeletesStorageFiles;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class CertificateSetting extends Model
{
    use DeletesStorageFiles, HasTenant;

    protected $fillable = [
        'tenant_id',
        'setting_key',
        'setting_value',
        'setting_type',
        'description',
        'is_encrypted',
        'updated_by',
    ];

    public function fileAttributes(): array
    {
        return ['setting_value'];
    }

    protected $casts = [
        'setting_value' => 'array',
        'is_encrypted' => 'boolean',
    ];

    // Setting types
    public const TYPE_GENERAL = 'general';

    public const TYPE_SIGNATURE = 'signature';

    public const TYPE_SEAL = 'seal';

    public const TYPE_BARCODE = 'barcode';

    public const TYPE_LAYOUT = 'layout';

    // Common setting keys
    public const KEY_COMPANY_LOGO = 'company_logo';

    public const KEY_COMPANY_SEAL = 'company_seal';

    public const KEY_SIGNATURE_PATHS = 'signature_paths';

    public const KEY_DEFAULT_FONTS = 'default_fonts';

    public const KEY_BARCODE_SETTINGS = 'barcode_settings';

    public const KEY_QR_CODE_SETTINGS = 'qr_code_settings';

    public const KEY_WATERMARK_SETTINGS = 'watermark_settings';

    public const KEY_CERTIFICATE_COLORS = 'certificate_colors';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Accessor for setting_value with encryption support
    public function getValueAttribute()
    {
        if ($this->is_encrypted && $this->setting_value) {
            try {
                return Crypt::decrypt($this->setting_value);
            } catch (\Exception $e) {
                return $this->setting_value;
            }
        }

        return $this->setting_value;
    }

    // Mutator for setting_value with encryption support
    public function setValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            $this->attributes['setting_value'] = Crypt::encrypt($value);
        } else {
            $this->attributes['setting_value'] = json_encode($value);
        }
    }

    // Scopes
    public function scopeOfType($query, string $type)
    {
        return $query->where('setting_type', $type);
    }

    public function scopeOfKey($query, string $key)
    {
        return $query->where('setting_key', $key);
    }

    // Static helper methods
    public static function getSetting(string $key, $default = null, ?int $tenantId = null)
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;

        if (! $tenantId) {
            return $default;
        }

        $setting = static::where('tenant_id', $tenantId)
            ->where('setting_key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    public static function setSetting(string $key, $value, string $type = self::TYPE_GENERAL, bool $encrypted = false, ?int $tenantId = null)
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;

        if (! $tenantId) {
            throw new \Exception('Tenant ID is required');
        }

        // If value is null, delete the setting instead of storing null
        if ($value === null) {
            return static::where('tenant_id', $tenantId)
                ->where('setting_key', $key)
                ->delete();
        }

        return static::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'setting_key' => $key,
            ],
            [
                'setting_value' => $value,
                'setting_type' => $type,
                'is_encrypted' => $encrypted,
                'updated_by' => auth()->id(),
            ]
        );
    }

    public static function getCompanyLogo(?int $tenantId = null): ?string
    {
        return static::getSetting(self::KEY_COMPANY_LOGO, null, $tenantId);
    }

    public static function getCompanySeal(?int $tenantId = null): ?string
    {
        return static::getSetting(self::KEY_COMPANY_SEAL, null, $tenantId);
    }

    public static function getSignaturePaths(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_SIGNATURE_PATHS, [], $tenantId);
    }

    public static function getDefaultFonts(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_DEFAULT_FONTS, [
            'primary' => 'Arial',
            'secondary' => 'Times New Roman',
            'monospace' => 'Courier New',
        ], $tenantId);
    }

    public static function getBarcodeSettings(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_BARCODE_SETTINGS, [
            'type' => 'CODE128',
            'width' => 2,
            'height' => 30,
            'include_text' => true,
            'position' => 'bottom_right',
        ], $tenantId);
    }

    public static function getQrCodeSettings(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_QR_CODE_SETTINGS, [
            'size' => 80,
            'margin' => 2,
            'error_correction' => 'M',
            'position' => 'top_right',
        ], $tenantId);
    }

    public static function getWatermarkSettings(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_WATERMARK_SETTINGS, [
            'enabled' => false,
            'text' => 'CONFIDENTIAL',
            'opacity' => 0.1,
            'angle' => 45,
            'font_size' => 48,
            'color' => '#cccccc',
        ], $tenantId);
    }

    public static function getCertificateColors(?int $tenantId = null): array
    {
        return static::getSetting(self::KEY_CERTIFICATE_COLORS, [
            'primary' => '#1f2937',
            'secondary' => '#6b7280',
            'accent' => '#3b82f6',
            'success' => '#10b981',
            'warning' => '#f59e0b',
            'danger' => '#ef4444',
        ], $tenantId);
    }

    public static function getAvailableTypes(): array
    {
        return [
            self::TYPE_GENERAL => 'General',
            self::TYPE_SIGNATURE => 'Signature',
            self::TYPE_SEAL => 'Seal',
            self::TYPE_BARCODE => 'Barcode',
            self::TYPE_LAYOUT => 'Layout',
        ];
    }

    public static function getDefaultSettings(): array
    {
        return [
            self::KEY_COMPANY_LOGO => [
                'type' => self::TYPE_GENERAL,
                'description' => 'Company logo for certificates',
                'encrypted' => false,
            ],
            self::KEY_COMPANY_SEAL => [
                'type' => self::TYPE_SEAL,
                'description' => 'Company official seal',
                'encrypted' => false,
            ],
            self::KEY_SIGNATURE_PATHS => [
                'type' => self::TYPE_SIGNATURE,
                'description' => 'Digital signature file paths',
                'encrypted' => true,
            ],
            self::KEY_DEFAULT_FONTS => [
                'type' => self::TYPE_LAYOUT,
                'description' => 'Default fonts for certificates',
                'encrypted' => false,
            ],
            self::KEY_BARCODE_SETTINGS => [
                'type' => self::TYPE_BARCODE,
                'description' => 'Barcode generation settings',
                'encrypted' => false,
            ],
            self::KEY_QR_CODE_SETTINGS => [
                'type' => self::TYPE_BARCODE,
                'description' => 'QR code generation settings',
                'encrypted' => false,
            ],
            self::KEY_WATERMARK_SETTINGS => [
                'type' => self::TYPE_LAYOUT,
                'description' => 'Watermark settings',
                'encrypted' => false,
            ],
            self::KEY_CERTIFICATE_COLORS => [
                'type' => self::TYPE_LAYOUT,
                'description' => 'Certificate color scheme',
                'encrypted' => false,
            ],
        ];
    }
}
