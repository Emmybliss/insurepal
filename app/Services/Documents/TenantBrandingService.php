<?php

namespace App\Services\Documents;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;

class TenantBrandingService
{
    /**
     * Maximum raw image size (in bytes) allowed for base64 embedding fallback.
     */
    public const MAX_BASE64_BYTES = 2_097_152; // 2 MB

    /**
     * Target dimensions and formats for optimized PDF assets.
     */
    protected const ASSET_TARGETS = [
        'logo' => ['width' => 300, 'height' => 300, 'format' => 'png'],
        'stamp' => ['width' => 140, 'height' => 140, 'format' => 'png'],
        'signature' => ['width' => 320, 'height' => 100, 'format' => 'png'],
        'header_image' => ['width' => 1200, 'height' => 240, 'format' => 'jpg'],
        'footer_image' => ['width' => 1200, 'height' => 140, 'format' => 'jpg'],
    ];

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

        // Get optimized storage relative paths
        $logoStoragePath = $this->getOptimizedImageStoragePath($tenant->logo, 'logo');
        $headerImageStoragePath = $this->getOptimizedImageStoragePath($headerImage, 'header_image');
        $footerImageStoragePath = $this->getOptimizedImageStoragePath($footerImage, 'footer_image');
        $signatureStoragePath = $this->getOptimizedImageStoragePath($signature, 'signature');
        $stampStoragePath = $this->getOptimizedImageStoragePath($stamp, 'stamp');

        // Resolve local file:/// paths for PDF generation
        $logoPath = $this->imageToLocalPath($logoStoragePath);
        $headerImagePath = $this->imageToLocalPath($headerImageStoragePath);
        $footerImagePath = $this->imageToLocalPath($footerImageStoragePath);
        $signaturePath = $this->imageToLocalPath($signatureStoragePath);
        $stampPath = $this->imageToLocalPath($stampStoragePath);

        // Resolve public HTTP URLs for browser iframe preview rendering
        $logoUrl = $this->imageToPublicUrl($logoStoragePath);
        $headerImageUrl = $this->imageToPublicUrl($headerImageStoragePath);
        $footerImageUrl = $this->imageToPublicUrl($footerImageStoragePath);
        $signatureUrl = $this->imageToPublicUrl($signatureStoragePath);
        $stampUrl = $this->imageToPublicUrl($stampStoragePath);

        return [
            'company_name' => $tenant->name,
            'company_email' => $tenant->email,
            'company_phone' => $tenant->phone,
            'company_address' => $tenant->address,
            'company_website' => $tenant->website ?? '',
            'tax_number' => $tenant->tax_number ?? '',
            'registration_number' => $tenant->reg_number ?? '',

            // Local paths for high-performance PDF embedding
            'logo_path' => $logoPath,
            'header_image_path' => $headerImagePath,
            'footer_image_path' => $footerImagePath,
            'signature_path' => $signaturePath,
            'stamp_path' => $stampPath,

            // Public browser-accessible URLs
            'logo_url' => $logoUrl,
            'header_image_url' => $headerImageUrl,
            'footer_image_url' => $footerImageUrl,
            'signature_url' => $signatureUrl,
            'stamp_url' => $stampUrl,

            // Optimized base64 fallbacks
            'logo_base64' => $this->localPathToBase64($logoPath),
            'header_image_base64' => $this->localPathToBase64($headerImagePath),
            'footer_image_base64' => $this->localPathToBase64($footerImagePath),
            'signature_base64' => $this->localPathToBase64($signaturePath),
            'stamp_base64' => $this->localPathToBase64($stampPath),

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
     * Get or create optimized storage path for an image.
     */
    public function getOptimizedImageStoragePath(?string $path, string $type): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            $disk = Storage::disk('public');

            // Handle external URL images
            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }

            if (! $disk->exists($path)) {
                return null;
            }

            $lastModified = $disk->lastModified($path);
            $target = self::ASSET_TARGETS[$type] ?? ['width' => 800, 'height' => 800, 'format' => 'png'];
            $format = $target['format'];

            // Generate cache filename
            $optimizedFilename = 'optimized/'.$type.'_'.md5($path.'_'.$lastModified).'.'.$format;

            if ($disk->exists($optimizedFilename)) {
                return $optimizedFilename;
            }

            // Create optimized version
            $rawContent = $disk->get($path);
            if (empty($rawContent)) {
                return $path;
            }

            // Initialize Intervention Image
            $manager = new ImageManager(new GdDriver);
            $image = $manager->read($rawContent);

            // Scale down if it exceeds maximum dimensions
            $image->scaleDown($target['width'], $target['height']);

            // Encode with target format
            if ($format === 'jpg') {
                $encoded = $image->toJpeg(80);
            } else {
                $encoded = $image->toPng();
            }

            // Ensure optimized folder exists
            if (! $disk->exists('optimized')) {
                $disk->makeDirectory('optimized');
            }

            $disk->put($optimizedFilename, (string) $encoded);

            return $optimizedFilename;
        } catch (\Exception $e) {
            Log::warning("Failed to optimize image {$path} of type {$type}", [
                'error' => $e->getMessage(),
            ]);

            // Fall back to original file relative path
            return $path;
        }
    }

    /**
     * Get public browser-accessible URL for an image.
     */
    public function imageToPublicUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            $disk = Storage::disk('public');

            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }

            if ($disk->exists($path)) {
                return $disk->url($path);
            }
        } catch (\Exception $e) {
            Log::warning("Failed to resolve public URL for image: {$path}", [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Get local absolute file URL for an image path.
     */
    public function imageToLocalPath(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            $disk = Storage::disk('public');

            if ($disk->exists($path)) {
                $absPath = $disk->path($path);
                $normalizedPath = str_replace('\\', '/', $absPath);
                $urlPath = str_replace(' ', '%20', $normalizedPath);

                return 'file:///'.ltrim($urlPath, '/');
            }

            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }
        } catch (\Exception $e) {
            Log::warning("Failed to resolve local path for image: {$path}", [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Get or create optimized local path/URL for an image.
     */
    public function getOptimizedImageLocalPath(?string $path, string $type): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            $disk = Storage::disk('public');

            // Handle external URL images
            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }

            if (! $disk->exists($path)) {
                return null;
            }

            $lastModified = $disk->lastModified($path);
            $target = self::ASSET_TARGETS[$type] ?? ['width' => 800, 'height' => 800, 'format' => 'png'];
            $format = $target['format'];

            // Generate cache filename
            $optimizedFilename = 'optimized/'.$type.'_'.md5($path.'_'.$lastModified).'.'.$format;

            if ($disk->exists($optimizedFilename)) {
                return $this->imageToLocalPath($optimizedFilename);
            }

            // Create optimized version
            $rawContent = $disk->get($path);
            if (empty($rawContent)) {
                return $this->imageToLocalPath($path);
            }

            // Initialize Intervention Image
            $manager = new ImageManager(new GdDriver);
            $image = $manager->read($rawContent);

            // Scale down if it exceeds maximum dimensions
            $image->scaleDown($target['width'], $target['height']);

            // Encode with target format
            if ($format === 'jpg') {
                $encoded = $image->toJpeg(80);
            } else {
                $encoded = $image->toPng();
            }

            // Ensure optimized folder exists
            if (! $disk->exists('optimized')) {
                $disk->makeDirectory('optimized');
            }

            $disk->put($optimizedFilename, (string) $encoded);

            return $this->imageToLocalPath($optimizedFilename);
        } catch (\Exception $e) {
            Log::warning("Failed to optimize image {$path} of type {$type}", [
                'error' => $e->getMessage(),
            ]);

            // Fall back to original file local path
            return $this->imageToLocalPath($path);
        }
    }

    /**
     * Convert a local file path/URL to base64.
     */
    public function localPathToBase64(?string $fileUrl): ?string
    {
        if (empty($fileUrl)) {
            return null;
        }

        try {
            // Strip file:/// prefix to get raw file path
            $filePath = $fileUrl;
            if (str_starts_with($fileUrl, 'file:///')) {
                $filePath = substr($fileUrl, 8);
            }

            $filePath = urldecode($filePath);

            if (file_exists($filePath)) {
                $content = file_get_contents($filePath);
                if ($content !== false) {
                    $finfo = new \finfo(FILEINFO_MIME_TYPE);
                    $mime = $finfo->file($filePath);
                    $base64 = base64_encode($content);

                    return "data:{$mime};base64,{$base64}";
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to convert local path to base64: {$fileUrl}", [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Convert an image from storage to a Base64 string for PDF embedding.
     */
    public function imageToBase64(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        // Guess type from path to apply optimization first
        $type = 'logo';
        if (str_contains($path, 'signature')) {
            $type = 'signature';
        } elseif (str_contains($path, 'stamp')) {
            $type = 'stamp';
        } elseif (str_contains($path, 'header')) {
            $type = 'header_image';
        } elseif (str_contains($path, 'footer')) {
            $type = 'footer_image';
        }

        $localPath = $this->getOptimizedImageLocalPath($path, $type);

        return $this->localPathToBase64($localPath);
    }

    /**
     * Clear cached branding images for a tenant.
     */
    public function clearBrandingCache(Tenant $tenant): void
    {
        $disk = Storage::disk('public');
        $keys = [
            $tenant->logo,
            $tenant->header_image,
            $tenant->footer_image,
            $tenant->signature,
            $tenant->stamp,
        ];

        foreach ($keys as $path) {
            if (empty($path)) {
                continue;
            }

            // Find all matching optimized cached files and delete them
            foreach (['logo', 'stamp', 'signature', 'header_image', 'footer_image'] as $type) {
                try {
                    $lastModified = $disk->exists($path) ? $disk->lastModified($path) : 0;
                    foreach (['png', 'jpg'] as $format) {
                        $optimizedFilename = 'optimized/'.$type.'_'.md5($path.'_'.$lastModified).'.'.$format;
                        if ($disk->exists($optimizedFilename)) {
                            $disk->delete($optimizedFilename);
                        }
                    }
                } catch (\Exception $e) {
                    // Ignore cache clearance errors
                }
            }
        }
    }
}
