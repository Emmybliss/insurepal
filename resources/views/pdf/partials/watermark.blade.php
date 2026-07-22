@if(!empty($branding['logo_path']))
    <div class="watermark-container">
        <img src="{{ $branding['logo_path'] }}" alt="Watermark Logo">
    </div>
@elseif(!empty($branding['logo_base64']))
    <div class="watermark-container">
        <img src="{{ $branding['logo_base64'] }}" alt="Watermark Logo">
    </div>
@endif