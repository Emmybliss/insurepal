<?php

namespace App\Services;

use App\Models\PlatformSetting;

class PlatformSettingsService
{
    private const SETTINGS_MAP = [
        // AI Provider
        'ai_provider' => ['config_path' => 'ai.gateway.default', 'encrypted' => false],
        'openai_api_key' => ['config_path' => 'ai.gateway.providers.openai.api_key', 'encrypted' => true],
        'openai_base_url' => ['config_path' => 'ai.gateway.providers.openai.base_url', 'encrypted' => false],
        'openai_model' => ['config_path' => 'ai.gateway.providers.openai.model', 'encrypted' => false],
        'anthropic_api_key' => ['config_path' => 'ai.gateway.providers.anthropic.api_key', 'encrypted' => true],
        'anthropic_base_url' => ['config_path' => 'ai.gateway.providers.anthropic.base_url', 'encrypted' => false],
        'anthropic_model' => ['config_path' => 'ai.gateway.providers.anthropic.model', 'encrypted' => false],

        // Email OAuth - Gmail
        'gmail_client_id' => ['config_path' => 'email.oauth.gmail.client_id', 'encrypted' => false],
        'gmail_client_secret' => ['config_path' => 'email.oauth.gmail.client_secret', 'encrypted' => true],
        'gmail_redirect_uri' => ['config_path' => 'email.oauth.gmail.redirect_uri', 'encrypted' => false],

        // Email OAuth - Microsoft
        'microsoft_client_id' => ['config_path' => 'email.oauth.microsoft365.client_id', 'encrypted' => false],
        'microsoft_client_secret' => ['config_path' => 'email.oauth.microsoft365.client_secret', 'encrypted' => true],
        'microsoft_redirect_uri' => ['config_path' => 'email.oauth.microsoft365.redirect_uri', 'encrypted' => false],

        // Paystack (global)
        'paystack_public_key' => ['config_path' => 'services.paystack.public_key', 'encrypted' => false],
        'paystack_secret_key' => ['config_path' => 'services.paystack.secret_key', 'encrypted' => true],

        // SMTP Settings (global mail config)
        'mail_driver' => ['config_path' => 'mail.default', 'encrypted' => false],
        'mail_host' => ['config_path' => 'mail.mailers.smtp.host', 'encrypted' => false],
        'mail_port' => ['config_path' => 'mail.mailers.smtp.port', 'encrypted' => false],
        'mail_username' => ['config_path' => 'mail.mailers.smtp.username', 'encrypted' => false],
        'mail_password' => ['config_path' => 'mail.mailers.smtp.password', 'encrypted' => true],
        'mail_encryption' => ['config_path' => 'mail.mailers.smtp.encryption', 'encrypted' => false],
        'mail_from_address' => ['config_path' => 'mail.from.address', 'encrypted' => false],
        'mail_from_name' => ['config_path' => 'mail.from.name', 'encrypted' => false],
    ];

    public function injectIntoConfig(): void
    {
        if (! app()->runningInConsole() && ! \Illuminate\Support\Facades\Schema::hasTable('platform_settings')) {
            return;
        }

        try {
            $settings = PlatformSetting::all()->keyBy('setting_key');
        } catch (\Exception $e) {
            return;
        }

        foreach (self::SETTINGS_MAP as $key => $mapping) {
            $setting = $settings->get($key);

            if (! $setting || blank($setting->setting_value)) {
                continue;
            }

            $value = $setting->is_encrypted
                ? $setting->value
                : $setting->setting_value;

            data_set(config(), $mapping['config_path'], $value);
        }
    }

    public static function getSetting(string $key, mixed $default = null): mixed
    {
        return PlatformSetting::get($key, $default);
    }

    public static function setSetting(string $key, mixed $value, string $type = 'general', bool $encrypted = false, ?string $description = null): void
    {
        PlatformSetting::set($key, $value, $type, $encrypted, $description);
    }

    public static function getAllSettings(): array
    {
        return PlatformSetting::all()->keyBy('setting_key')->map(function ($setting) {
            return [
                'value' => $setting->is_encrypted ? $setting->value : $setting->setting_value,
                'setting_type' => $setting->setting_type,
                'is_encrypted' => $setting->is_encrypted,
                'description' => $setting->description,
            ];
        })->toArray();
    }

    public static function getSettingsBySection(string $section): array
    {
        $sectionMap = [
            'general' => ['platform_name', 'platform_description', 'support_email', 'support_phone', 'timezone', 'date_format', 'currency', 'language', 'maintenance_mode'],
            'ai' => ['ai_provider', 'openai_api_key', 'openai_base_url', 'openai_model', 'anthropic_api_key', 'anthropic_base_url', 'anthropic_model'],
            'email_oauth' => ['gmail_client_id', 'gmail_client_secret', 'gmail_redirect_uri', 'microsoft_client_id', 'microsoft_client_secret', 'microsoft_redirect_uri'],
            'billing' => ['paystack_public_key', 'paystack_secret_key'],
        ];

        $keys = $sectionMap[$section] ?? [];
        $settings = PlatformSetting::whereIn('setting_key', $keys)->get()->keyBy('setting_key');

        $result = [];
        foreach ($keys as $key) {
            $setting = $settings->get($key);
            $result[$key] = $setting
                ? ($setting->is_encrypted ? $setting->value : $setting->setting_value)
                : null;
        }

        return $result;
    }
}
