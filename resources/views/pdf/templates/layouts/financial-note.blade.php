<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document')</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        *, *:before, *:after {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: {{ $branding['primary_color'] ?? '#333' }};
            -webkit-font-smoothing: antialiased;
        }

        /* Page Configuration */
        @page {
            margin: 0;
            size: A4 portrait;
        }

        @if($isPreview ?? false)
        /* ── PREVIEW MODE (inside iframe) ───────────────────────────── */
        /* Use a flex-column layout so header/footer sit above/below    */
        /* the content naturally without any absolute/fixed tricks.     */
        body {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        .page-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            width: 100%;
            min-height: 100vh;
        }

        header, footer {
            width: 100%;
            position: static;
            flex-shrink: 0;
        }
        footer{
            margin-top:auto;
        }

         .content {
            margin-top: 10x;
            margin-bottom: 10px;
            padding-left: 50px;
            padding-right: 50px;
        }
        @else
        /* ── PRINT / PDF MODE ────────────────────────────────────────── */
        .page-container {
            width: 100%;
            position: relative;
        }

        header, footer {
            width: 100%;
            position: fixed;
            left: 0;
            right: 0;
        }

        header {
            top: 0;
            z-index: 1000;
            height: auto;
            line-height: 0;
            overflow: hidden;
        }

        footer {
            bottom: 0;
            z-index: 1000;
            height: auto;
            overflow: hidden;
        }

        .content {
            margin-top: 125px;
            margin-bottom: 10px;
            padding-left: 50px;
            padding-right: 50px;
        }
        @endif

        .branding-image {
            width: 100%;
            height: auto;
            display: block;
            margin: 0;
            padding: 0;
        }

        .signature-area {
            padding: 10px 50px 5px;
        }

        /* Utilities */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-xl { font-size: 24px; }
        .text-lg { font-size: 18px; }
        .text-sm { font-size: 12px; }
        .text-gray { color: #666; }
        .mt-4 { margin-top: 20px; }
        .mb-4 { margin-bottom: 20px; }
        .border-bottom { border-bottom: 1px solid #ddd; }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }

        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }

        .summary-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            display: inline-block;
            min-width: 250px;
        }

        .flex-between {
            display: table;
            width: 100%;
        }

        .flex-between > div {
            display: table-cell;
            vertical-align: top;
        }

        .col-left { width: 50%; }
        .col-right { width: 50%; text-align: right; }

        /* Tenant-wide CSS Overrides */
        {!! $branding['css_overrides_string'] ?? '' !!}

        /* Dynamic Custom CSS from Template Overrides */
        @if(!empty($template) && !empty($template->css_overrides))
            @foreach($template->css_overrides as $selector => $rules)
                @if(is_array($rules))
                    {{ $selector }} {
                        @foreach($rules as $property => $value)
                            {{ $property }}: {{ $value }};
                        @endforeach
                    }
                @endif
            @endforeach
        @endif
    </style>
</head>
<body>

<div class="page-container">
    @if($elementToggles['header'] ?? true)
        <header>
            @if(!empty($branding['header_image_base64']))
                <img src="{{ $branding['header_image_base64'] }}" alt="Header Image" class="branding-image">
            @else
                <!-- Fallback text header -->
                <div style="padding: 20px 40px; border-bottom: 3px solid {{ $branding['primary_color'] ?? '#ccc' }}; background: #fff;">
                    <h1 style="margin:0;">{{ $branding['company_name'] }}</h1>
                </div>
            @endif
        </header>
    @endif

    <div class="content">
        @yield('content')
    </div>

    @if($elementToggles['footer'] ?? true)
        <footer>
            @hasSection('signature')
                <div class="signature-area">
                    @yield('signature')
                </div>
            @endif
            @if(!empty($branding['footer_image_base64']))
                <img src="{{ $branding['footer_image_base64'] }}" alt="Footer Image" class="branding-image">
            @else
                <div style="padding: 20px 40px; border-top: 1px solid #ccc; font-size: 12px; color: #666; text-align: center; background: #fff;">
                    <p style="margin: 0;">{{ $branding['company_name'] }} | {{ $branding['company_email'] }} | {{ $branding['company_phone'] }}</p>
                    @if(!empty($branding['company_website']))
                        <p style="margin: 2px 0 0 0;">{{ $branding['company_website'] }}</p>
                    @endif
                    <p style="margin: 2px 0 0 0;">{{ $branding['company_address'] }}</p>
                </div>
            @endif
        </footer>
    @endif
</div>

</body>
</html>
