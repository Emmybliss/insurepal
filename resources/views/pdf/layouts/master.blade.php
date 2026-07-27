<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document')</title>
    <style>
        /* 1. Global Reset */
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: auto;
            background: #ffffff;
        }

        *, *::before, *::after {
            box-sizing: border-box;
        }

        :root {
            --primary-color: {{ $branding['primary_color'] ?? '#0f172a' }};
            --secondary-color: {{ $branding['secondary_color'] ?? '#475569' }};
            --text-color: #1e293b;
            --border-color: #e2e8f0;
            --bg-light: #f8fafc;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1;
            color: var(--text-color);
            -webkit-font-smoothing: antialiased;
        }

        /* ── Page Margins (Microsoft Word Model) ── */
        @page {
            size: A4 portrait;
            margin: 0; /* Set margins to 0 to align fixed elements relative to physical page boundaries */
        }

        /* Fixed elements repeat on every page without negative position drift */
        header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 140px;
            z-index: 1000;
        }

        footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70px;
            z-index: 1000;
        }

        /* Centered Watermark */
        .watermark-container {
            position: fixed;
            top: 50vh;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            z-index: -1000;
            pointer-events: none;
            width: 100%;
            text-align: center;
        }

        .watermark-container img {
            max-width: 45%;
            max-height: 220px;
            object-fit: contain;
        }

        /* Main printable content area */
        .document-body {
            width: 100%;
        }

        /* ── Modern CSS Utilities ── */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .justify-center { justify-content: center; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .items-end { align-items: flex-end; }
        .flex-1 { flex: 1; }
        .gap-1 { gap: 4px; }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .gap-8 { gap: 32px; }

        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

        .w-full { width: 100%; }
        .h-full { height: 100%; }
        .w-20 { width: 80px; }
        .h-20 { height: 80px; }
        .w-24 { width: 96px; }
        .h-24 { height: 96px; }
        .w-64 { width: 256px; }
        .object-contain { object-fit: contain; }
        .object-cover { object-fit: cover; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-normal { font-weight: 400; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        /* Font Sizes */
        .text-xs { font-size: 9px; }
        .text-sm { font-size: 10px; }
        .text-base { font-size: 11px; }
        .text-lg { font-size: 13px; }
        .text-xl { font-size: 16px; }
        .text-2xl { font-size: 20px; }
        .text-3xl { font-size: 26px; }
        .uppercase { text-transform: uppercase; }

        /* Colors & Borders */
        .text-primary { color: var(--primary-color); }
        .text-secondary { color: var(--secondary-color); }
        .text-muted { color: #64748b; }
        .bg-light { background-color: var(--bg-light); }
        .border-b { border-bottom: 1px solid var(--border-color); }
        .border-t { border-top: 1px solid var(--border-color); }
        .border-l-4 { border-left-width: 4px; border-left-style: solid; }
        .border-primary { border-left-color: var(--primary-color); }
        .border-secondary { border-left-color: var(--secondary-color); }

        /* Spacing */
        .p-2 { padding: 8px; }
        .p-3 { padding: 12px; }
        .p-4 { padding: 16px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .py-2 { padding-top: 8px; padding-bottom: 8px; }
        .pb-2 { padding-bottom: 8px; }
        .pb-4 { padding-bottom: 16px; }
        .pb-6 { padding-bottom: 24px; }
        .my-4 { margin-top: 16px; margin-bottom: 16px; }
        .my-6 { margin-top: 24px; margin-bottom: 24px; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
        .mt-8 { margin-top: 32px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mr-auto { margin-right: auto; }
        .ml-auto { margin-left: auto; }

        /* Tables */
        table.modern-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
        }

        table.modern-table th {
            background-color: var(--bg-light);
            color: #000;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.05em;
            padding: 8px 12px;
            border-bottom: 2px solid var(--border-color);
            text-align: left;
        }

        table.modern-table td {
            padding: 8px 12px;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
        }

        /* ── Pagination / Page Break Rules ── */
        .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }

        .page-break-before {
            page-break-before: always;
            break-before: page;
        }

        .page-break-after {
            page-break-after: always;
            break-after: page;
        }

        tr {
            page-break-inside: avoid;
            break-inside: avoid;
        }

        thead {
            display: table-header-group;
        }

        /* Custom / Tenant CSS overrides */
        {!! $branding['css_overrides_string'] ?? '' !!}
    </style>
</head>
<body>

    @if($elementToggles['header'] ?? true)
        <header>
            @include('pdf.partials.header')
            @if($elementToggles['watermark_logo'] ?? true)
                @include('pdf.partials.watermark')
            @endif
        </header>
    @else
        @if($elementToggles['watermark_logo'] ?? true)
            <div style="position: fixed; top: 0; left: 0; right: 0; height: 1px; z-index: -1000;">
                @include('pdf.partials.watermark')
            </div>
        @endif
    @endif

    @if($elementToggles['footer'] ?? true)
        <footer>
            @include('pdf.partials.footer')
        </footer>
    @endif

    <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed; margin: 0; padding: 0;">
        <thead>
            <tr style="border: none;">
                <td style="height: 140px; border: none; padding: 0;"></td>
            </tr>
        </thead>
        <tbody>
            <tr style="border: none;">
                <td style="border: none; padding: 0 50px; vertical-align: top;">
                    <div class="document-body">
                        @yield('content')
                    </div>
                </td>
            </tr>
        </tbody>
        <tfoot>
            <tr style="border: none;">
                <td style="height: 70px; border: none; padding: 0;"></td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
