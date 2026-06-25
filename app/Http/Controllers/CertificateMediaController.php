<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateMediaController extends Controller
{
    protected $barcode = null;

    public function __construct()
    {
        // Initialize barcode only if the package is available
        if (class_exists('Milon\\Barcode\\DNS1D')) {
            $this->barcode = new \Milon\Barcode\DNS1D;
        }
    }

    /**
     * Generate QR code as PNG response
     */
    public function generateQrCode(Request $request, string $data): Response
    {
        try {
            // Decode URL-encoded data
            $decodedData = urldecode($data);

            // Generate QR code
            $qrCode = QrCode::format('png')
                ->size(200)
                ->margin(1)
                ->generate($decodedData);

            // Set response headers
            $headers = [
                'Content-Type' => 'image/png',
                'Content-Length' => strlen($qrCode),
                'Cache-Control' => 'public, max-age=3600', // Cache for 1 hour
                'Expires' => gmdate('D, d M Y H:i:s', time() + 3600).' GMT',
                'Last-Modified' => gmdate('D, d M Y H:i:s').' GMT',
            ];

            return response($qrCode, 200, $headers);
        } catch (Exception $e) {
            Log::warning('QR code generation failed', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            // Return a 1x1 transparent PNG as fallback
            $transparentPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

            return response($transparentPng, 200, [
                'Content-Type' => 'image/png',
                'Content-Length' => strlen($transparentPng),
            ]);
        }
    }

    /**
     * Generate barcode as PNG response
     */
    public function generateBarcode(Request $request, string $data): Response
    {
        try {
            // Decode URL-encoded data
            $decodedData = urldecode($data);

            if (! $this->barcode) {
                Log::warning('Barcode package not available. Install milon/barcode package to enable barcode generation.');

                // Return a 1x1 transparent PNG as fallback
                $transparentPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

                return response($transparentPng, 200, [
                    'Content-Type' => 'image/png',
                    'Content-Length' => strlen($transparentPng),
                ]);
            }

            // Generate barcode
            $barcodeImage = $this->barcode->getBarcodePNG($decodedData, 'C128', 2, 30);

            // Set response headers
            $headers = [
                'Content-Type' => 'image/png',
                'Content-Length' => strlen($barcodeImage),
                'Cache-Control' => 'public, max-age=3600', // Cache for 1 hour
                'Expires' => gmdate('D, d M Y H:i:s', time() + 3600).' GMT',
                'Last-Modified' => gmdate('D, d M Y H:i:s').' GMT',
            ];

            return response($barcodeImage, 200, $headers);
        } catch (Exception $e) {
            Log::warning('Barcode generation failed', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            // Return a 1x1 transparent PNG as fallback
            $transparentPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

            return response($transparentPng, 200, [
                'Content-Type' => 'image/png',
                'Content-Length' => strlen($transparentPng),
            ]);
        }
    }
}
