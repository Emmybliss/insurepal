<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\ImageOptimizer\OptimizerChainFactory;

class DocumentToolkitService
{
    /**
     * Optimizes an uploaded image using Spatie Image Optimizer.
     * Copies to a writable temp location, optimizes, then returns the path.
     */
    public function optimizeImage(UploadedFile $file): string
    {
        $ext = $file->getClientOriginalExtension();
        $storePath = 'toolkit/optimized/'.uniqid('img_', true).'.'.$ext;
        $absPath = Storage::disk('local')->path($storePath);

        // Ensure directory exists
        $dir = dirname($absPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Copy uploaded file to our own path (so we can write back to it)
        copy($file->getRealPath(), $absPath);

        // Now optimize IN PLACE at that path
        try {
            $optimizerChain = OptimizerChainFactory::create();
            $optimizerChain->optimize($absPath);
        } catch (\Exception $e) {
            // If optimizer binaries aren't installed, just return the copy
        }

        return $absPath;
    }

    /**
     * Execute a command with a timeout (seconds). Returns ['code' => int, 'output' => string].
     */
    private function execWithTimeout(string $command, int $timeoutSeconds = 60): array
    {
        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open($command, $descriptorSpec, $pipes);

        if (! $process) {
            return ['code' => -1, 'output' => 'Failed to start process'];
        }

        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $output = '';
        $start = microtime(true);

        while (true) {
            $status = proc_get_status($process);

            $read = [$pipes[1], $pipes[2]];
            $write = null;
            $except = null;
            $changed = @stream_select($read, $write, $except, 0, 200000);

            if ($changed !== false && $changed > 0) {
                foreach ($read as $pipe) {
                    $chunk = fread($pipe, 8192);
                    if ($chunk !== false && $chunk !== '') {
                        $output .= $chunk;
                    }
                }
            }

            if (! $status['running']) {
                $remaining = fread($pipes[1], 8192);
                if ($remaining !== false) {
                    $output .= $remaining;
                }
                $err = fread($pipes[2], 8192);
                if ($err !== false) {
                    $output .= $err;
                }
                break;
            }

            if ((microtime(true) - $start) >= $timeoutSeconds) {
                proc_terminate($process, SIGTERM);
                fclose($pipes[0]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($process);

                return ['code' => -1, 'output' => "Command timed out after {$timeoutSeconds}s"];
            }

            usleep(50000);
        }

        foreach ($pipes as $p) {
            @fclose($p);
        }

        $exitCode = proc_close($process);

        return ['code' => $exitCode, 'output' => trim($output)];
    }

    /**
     * Compresses a PDF using Ghostscript.
     * Falls back with a clear error if gs is not available.
     */
    public function compressPdf(UploadedFile $file, string $level = 'Medium'): string
    {
        $settings = [
            'Low' => '/prepress',
            'Medium' => '/ebook',
            'High' => '/screen',
        ];
        $gsSetting = $settings[$level] ?? '/ebook';

        $inputPath = $file->getRealPath();
        $outputDir = storage_path('app/toolkit/compressed');

        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $outputPath = $outputDir.'/compressed_'.uniqid().'.pdf';

        $gsBinary = $this->findBinary(['gs', 'gswin64c', 'gswin32c']);

        if (! $gsBinary) {
            throw new \RuntimeException(
                'Ghostscript is not installed or not in PATH. Please install Ghostscript on the server.'
            );
        }

        $command = sprintf(
            '%s -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=%s -dNOPAUSE -dQUIET -dBATCH -sOutputFile=%s %s 2>&1',
            escapeshellarg($gsBinary),
            $gsSetting,
            escapeshellarg($outputPath),
            escapeshellarg($inputPath)
        );

        $result = $this->execWithTimeout($command, 120);

        if ($result['code'] !== 0 || ! file_exists($outputPath) || filesize($outputPath) < 100) {
            $msg = $result['code'] === -1
                ? $result['output']
                : 'PDF compression failed: '.$result['output'];
            throw new \RuntimeException($msg);
        }

        return $outputPath;
    }

    /**
     * Merges multiple PDF files into one using Ghostscript.
     * This approach handles more PDF formats than libmergepdf (which uses FPDI).
     */
    public function mergeDocuments(array $files): string
    {
        $gsBinary = $this->findBinary(['gs', 'gswin64c', 'gswin32c']);

        if (! $gsBinary) {
            throw new \RuntimeException(
                'Ghostscript is not installed or not in PATH. Please install Ghostscript on the server.'
            );
        }

        $outputDir = storage_path('app/toolkit/merged');
        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $outputPath = $outputDir.'/merged_'.uniqid().'.pdf';

        $inputFiles = [];
        foreach ($files as $file) {
            $inputFiles[] = $file->getRealPath();
        }

        $inputFilesList = implode(' ', array_map('escapeshellarg', $inputFiles));

        $command = sprintf(
            '%s -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile=%s %s 2>&1',
            escapeshellarg($gsBinary),
            escapeshellarg($outputPath),
            $inputFilesList
        );

        $result = $this->execWithTimeout($command, 120);

        if ($result['code'] !== 0 || ! file_exists($outputPath) || filesize($outputPath) < 100) {
            $msg = $result['code'] === -1
                ? $result['output']
                : 'PDF merge failed: '.$result['output'];
            throw new \RuntimeException($msg);
        }

        return $outputPath;
    }

    /**
     * Converts a document (Word, Excel, image) to PDF using LibreOffice.
     */
    public function convertToPdf(UploadedFile $file): string
    {
        $soBinary = $this->findBinary(['libreoffice', 'soffice']);

        if (! $soBinary) {
            throw new \RuntimeException(
                'LibreOffice is not installed or not in PATH. Please install LibreOffice on the server.'
            );
        }

        $outputDir = storage_path('app/toolkit/converted');
        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        // Copy to a stable named path (LibreOffice needs a real extension)
        $tmpPath = $outputDir.'/'.uniqid('upload_').'.'.$file->getClientOriginalExtension();
        copy($file->getRealPath(), $tmpPath);

        $command = sprintf(
            '%s --headless --convert-to pdf --outdir %s %s 2>&1',
            escapeshellarg($soBinary),
            escapeshellarg($outputDir),
            escapeshellarg($tmpPath)
        );

        $result = $this->execWithTimeout($command, 120);

        @unlink($tmpPath);

        $outputPath = $outputDir.'/'.pathinfo($tmpPath, PATHINFO_FILENAME).'.pdf';

        if (! file_exists($outputPath) || filesize($outputPath) < 100) {
            $msg = $result['code'] === -1 ? $result['output'] : 'Conversion failed: '.$result['output'];
            throw new \RuntimeException($msg);
        }

        return $outputPath;
    }

    /**
     * Converts multiple images to a single PDF using ImageMagick.
     */
    public function convertImagesToPdf(array $images, ?string $title = null): string
    {
        $imBinary = $this->findBinary(['magick', 'convert']);

        if (! $imBinary) {
            throw new \RuntimeException(
                'ImageMagick is not installed or not in PATH. Please install ImageMagick on the server.'
            );
        }

        $outputDir = storage_path('app/toolkit/converted');
        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $outputPath = $outputDir.'/images_'.uniqid().'.pdf';

        $imagePaths = [];
        foreach ($images as $image) {
            $imagePaths[] = $image->getRealPath();
        }

        $imageList = implode(' ', array_map('escapeshellarg', $imagePaths));

        $titleArg = $title ? '-title '.escapeshellarg($title) : '';

        $command = sprintf(
            '%s %s %s -gravity center -resize 595x842 -extent 595x842 -quality 85 -alpha remove -background white +page PDF:%s 2>&1',
            escapeshellarg($imBinary),
            $imageList,
            $titleArg,
            escapeshellarg($outputPath)
        );

        $result = $this->execWithTimeout($command, 180);

        if (! file_exists($outputPath) || filesize($outputPath) < 100) {
            $msg = $result['code'] === -1 ? $result['output'] : 'Image to PDF conversion failed: '.$result['output'];
            throw new \RuntimeException($msg);
        }

        return $outputPath;
    }

    /**
     * Get available capabilities for dynamic UI.
     */
    public function getCapabilities(): array
    {
        return [
            'convert' => [
                'document' => ! is_null($this->findBinary(['libreoffice', 'soffice'])),
                'image' => ! is_null($this->findBinary(['magick', 'convert'])),
            ],
            'compress' => [
                'pdf' => ! is_null($this->findBinary(['gs', 'gswin64c', 'gswin32c'])),
                'image' => class_exists(OptimizerChainFactory::class),
            ],
        ];
    }

    /**
     * Find an executable binary from a list of candidates using 'where' on Windows / 'which' on Unix.
     */
    private function findBinary(array $names): ?string
    {
        foreach ($names as $name) {
            if (PHP_OS_FAMILY === 'Windows') {
                $result = shell_exec("where {$name} 2>NUL");
                if ($result && trim($result)) {
                    return trim(explode("\n", $result)[0]);
                }

                $potentialPaths = [];

                // Version-agnostic scanning for LibreOffice
                if (in_array($name, ['libreoffice', 'soffice'])) {
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files\LibreOffice*\program\soffice.exe'));
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files (x86)\LibreOffice*\program\soffice.exe'));
                }

                // Version-agnostic scanning for Ghostscript
                if (in_array($name, ['gs', 'gswin64c', 'gswin32c'])) {
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files\gs\gs*\bin\gswin64c.exe'));
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files (x86)\gs\gs*\bin\gswin64c.exe'));
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files\gs\gs*\bin\gswin32c.exe'));
                    $potentialPaths = array_merge($potentialPaths, glob('C:\Program Files (x86)\gs\gs*\bin\gswin32c.exe'));
                }

                foreach ($potentialPaths as $path) {
                    if (file_exists($path)) {
                        return $path;
                    }
                }
            } else {
                $result = shell_exec("which {$name} 2>/dev/null");
                if ($result && trim($result)) {
                    return trim(explode("\n", $result)[0]);
                }
            }
        }

        return null;
    }
}
