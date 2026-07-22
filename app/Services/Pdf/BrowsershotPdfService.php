<?php

namespace App\Services\Pdf;

use Spatie\Browsershot\Browsershot;

class BrowsershotPdfService implements PdfService
{
    /**
     * Render a View template to PDF.
     *
     * @return string Raw PDF bytes
     */
    public function renderView(string $view, array $data = [], array $options = []): string
    {
        $html = view($view, $data)->render();

        return $this->renderHtml($html, $options);
    }

    /**
     * Render an HTML string to PDF.
     *
     * Writes HTML to a temporary file and loads it via a file:// URL to avoid
     * passing large base64-encoded image strings through Windows named-pipe buffers,
     * which exhausts the PHP memory limit (WindowsPipes.php buffer allocation).
     *
     * @return string Raw PDF bytes
     */
    public function renderHtml(string $html, array $options = []): string
    {
        $tmpPdf = tempnam(sys_get_temp_dir(), 'browsershot_').'.pdf';
        $tempHtmlPath = tempnam(sys_get_temp_dir(), 'pdf_html_').'.html';
        file_put_contents($tempHtmlPath, $html);

        try {
            $browsershot = Browsershot::htmlFromFilePath($tempHtmlPath)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitUntilNetworkIdle()
                ->addChromiumArguments([
                    'no-sandbox',
                    'disable-setuid-sandbox',
                    'disable-dev-shm-usage',
                    'disable-gpu',
                    'allow-file-access-from-files',
                    'disable-web-security',
                ]);

            unset($html); // Free the large string from PHP memory immediately

            if (config('pdf.browsershot.no_sandbox', true)) {
                $browsershot->noSandbox();
            }

            if ($nodeBinary = config('pdf.browsershot.node_binary')) {
                $browsershot->setNodeBinary($nodeBinary);
            }

            if ($npmBinary = config('pdf.browsershot.npm_binary')) {
                $browsershot->setNpmBinary($npmBinary);
            }

            if ($chromeBinary = config('pdf.browsershot.chrome_binary')) {
                $browsershot->setChromePath($chromeBinary);
            }

            if ($nodeModules = config('pdf.browsershot.node_modules')) {
                $browsershot->setNodeModulePath($nodeModules);
            }

            if ($timeout = config('pdf.browsershot.timeout', 120)) {
                $browsershot->timeout((int) $timeout);
            }

            // Overlay dynamic page numbers inside the bottom margins using Puppeteer's native header/footer layout
            if ($options['show_page_numbers'] ?? true) {
                $browsershot->showBrowserHeaderAndFooter()
                    ->headerHtml('<div></div>') // empty header
                    ->footerHtml('<div style="font-size: 8px; font-family: Arial, sans-serif; color: #94a3b8; width: 100%; text-align: right; padding-right: 50px; box-sizing: border-box;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>');
            }

            // Save to a temp file instead of returning via stdout pipes.
            // On Windows, buffering large PDFs through Symfony named pipes
            // exhausts PHP memory (WindowsPipes.php buffer allocation).
            $browsershot->savePdf($tmpPdf);

            return file_get_contents($tmpPdf);
        } finally {
            if (file_exists($tmpPdf)) {
                @unlink($tmpPdf);
            }
            if (file_exists($tempHtmlPath)) {
                @unlink($tempHtmlPath);
            }
        }
    }
}
