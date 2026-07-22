<?php

namespace App\Services\Pdf;

interface PdfService
{
    /**
     * Render a View template to PDF.
     *
     * @return string Raw PDF bytes
     */
    public function renderView(string $view, array $data = [], array $options = []): string;

    /**
     * Render an HTML string to PDF.
     *
     * @return string Raw PDF bytes
     */
    public function renderHtml(string $html, array $options = []): string;
}
