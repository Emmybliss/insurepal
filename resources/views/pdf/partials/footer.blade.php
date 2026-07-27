@if(!empty($branding['footer_image_path']))
    <img src="{{ $branding['footer_image_path'] }}" alt="Footer Image" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;">
@elseif(!empty($branding['footer_image_base64']))
    <img src="{{ $branding['footer_image_base64'] }}" alt="Footer Image" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;">
@else
    <div class="h-full flex flex-col justify-center gap-1 text-center text-muted bg-white border-t" style="padding: 15px 50px 30px 50px;">
        <p class="font-semibold text-primary" style="margin: 0; font-size: 10px;">{{ $branding['company_name'] ?? 'InsurePal' }}</p>
        <p style="margin: 0; font-size: 8px;">{{ $branding['company_email'] ?? 'support@insurepal.app' }} | {{ $branding['company_phone'] ?? '' }}</p>
        @if(!empty($branding['company_website']))
            <p style="margin: 0; font-size: 8px;">{{ $branding['company_website'] }}</p>
        @endif
        @if(!empty($branding['company_address']))
            <p style="margin: 0; font-size: 8px;">{{ $branding['company_address'] }}</p>
        @endif
    </div>
@endif
