<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class PlatformSetting extends Model
{
    protected $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'description',
        'is_encrypted',
        'updated_by',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getValueAttribute(): mixed
    {
        $value = $this->setting_value;

        if ($this->is_encrypted && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value;
            }
        }

        return $value;
    }

    public function setValueAttribute(mixed $value): void
    {
        if ($this->is_encrypted && $value !== null) {
            $this->attributes['setting_value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['setting_value'] = $value;
        }
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('setting_type', $type);
    }

    public function scopeOfKey($query, string $key)
    {
        return $query->where('setting_key', $key);
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('setting_key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, mixed $value, string $type = 'general', bool $encrypted = false, ?string $description = null): self
    {
        if ($value === null) {
            static::where('setting_key', $key)->delete();

            return new static;
        }

        return static::updateOrCreate(
            ['setting_key' => $key],
            [
                'setting_value' => $value,
                'setting_type' => $type,
                'description' => $description,
                'is_encrypted' => $encrypted,
                'updated_by' => auth()->id(),
            ]
        );
    }

    public static function getAllGrouped(): array
    {
        return static::all()->keyBy('setting_key')->toArray();
    }

    public static function getKeysByType(string $type): array
    {
        return static::ofType($type)->pluck('setting_value', 'setting_key')->toArray();
    }
}
