<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Safely download a file and delete it immediately from disk to avoid locks/timeouts.
     */
    protected function safeDownloadAndDelete(string $filePath, ?string $name = null, array $headers = []): \Symfony\Component\HttpFoundation\Response
    {
        if (! file_exists($filePath)) {
            abort(404);
        }

        $name = $name ?: basename($filePath);
        $mime = 'application/octet-stream';
        if (file_exists($filePath)) {
            $mime = mime_content_type($filePath) ?: 'application/octet-stream';
        }

        // Guess mime for excel / csv / pdf if needed
        if (str_ends_with($name, '.xlsx')) {
            $mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } elseif (str_ends_with($name, '.csv')) {
            $mime = 'text/csv';
        } elseif (str_ends_with($name, '.pdf')) {
            $mime = 'application/pdf';
        }

        $content = file_get_contents($filePath);
        @unlink($filePath);

        $defaultHeaders = [
            'Content-Type' => $mime,
            'Content-Disposition' => 'attachment; filename="'.$name.'"',
            'Content-Length' => strlen($content),
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        return response($content, 200, array_merge($defaultHeaders, $headers));
    }
}
