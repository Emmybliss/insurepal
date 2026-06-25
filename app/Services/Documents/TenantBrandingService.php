<?php

namespace App\Services\Documents;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TenantBrandingService
{
    /**
     * Get normalized branding data for a tenant.
     *
     * @param  array{header_image?: string, footer_image?: string, signature?: string, stamp?: string}|null  $templateImageOverrides
     */
    public function getBrandingData(Tenant $tenant, ?array $templateImageOverrides = null): array
    {
        $headerImage = $templateImageOverrides['header_image'] ?? $tenant->header_image;
        $footerImage = $templateImageOverrides['footer_image'] ?? $tenant->footer_image;
        $signature = $templateImageOverrides['signature'] ?? $tenant->signature;
        $stamp = $templateImageOverrides['stamp'] ?? $tenant->stamp;

        return [
            'company_name' => $tenant->name,
            'company_email' => $tenant->email,
            'company_phone' => $tenant->phone,
            'company_address' => $tenant->address,
            'company_website' => $tenant->website ?? '',
            'tax_number' => $tenant->tax_number ?? '',
            'registration_number' => $tenant->reg_number ?? '',

            // Dynamic branding assets as base64 for reliable PDF embedding
            'logo_base64' => $this->imageToBase64($tenant->logo),
            'header_image_base64' => $this->imageToBase64($headerImage),
            'footer_image_base64' => $this->imageToBase64($footerImage),
            'signature_base64' => $this->imageToBase64($signature),
            'stamp_base64' => $this->imageToBase64($stamp),

            // Primary colors from theme settings
            'primary_color' => $tenant->theme_settings['primary_color'] ?? '#1f2937',
            'secondary_color' => $tenant->theme_settings['secondary_color'] ?? '#f3f4f6',

            // CSS Overrides (array or generated string)
            'css_overrides' => $tenant->settings['css_overrides'] ?? [],
            'css_overrides_string' => $this->generateCssString($tenant->settings['css_overrides'] ?? []),
        ];
    }

    /**
     * Generate a CSS string from a nested array of overrides.
     * Format: [ '.selector' => [ 'property' => 'value' ] ]
     */
    public function generateCssString(array $overrides): string
    {
        $css = '';
        foreach ($overrides as $selector => $rules) {
            if (is_array($rules)) {
                $css .= "{$selector} {\n";
                foreach ($rules as $property => $value) {
                    $css .= "    {$property}: {$value};\n";
                }
                $css .= "}\n";
            }
        }

        return $css;
    }

    /**
     * Convert an image from storage to a Base64 string for PDF embedding.
     */
    public function imageToBase64(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $cacheKey = 'branding_base64_'.md5($path);

        return Cache::remember($cacheKey, 3600, function () use ($path) {
            try {
                $disk = Storage::disk('public');

                if ($disk->exists($path)) {
                    $mime = $disk->mimeType($path);
                    $content = $disk->get($path);
                    $base64 = base64_encode($content);

                    return "data:{$mime};base64,{$base64}";
                }

                if (filter_var($path, FILTER_VALIDATE_URL)) {
                    $content = file_get_contents($path);
                    if ($content !== false) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mime = $finfo->buffer($content);
                        $base64 = base64_encode($content);

                        return "data:{$mime};base64,{$base64}";
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Failed to convert image to base64 for PDF: {$path}", [
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }

    /**
     * Clear cached branding images for a tenant.
     */
    public function clearBrandingCache(Tenant $tenant): void
    {
        $keys = [
            'logo' => $tenant->logo,
            'header_image' => $tenant->header_image,
            'footer_image' => $tenant->footer_image,
            'signature' => $tenant->signature,
            'stamp' => $tenant->stamp,
        ];

        foreach ($keys as $key => $path) {
            if (! empty($path)) {
                Cache::forget('branding_base64_'.md5($path));
            }
        }
    }
}
