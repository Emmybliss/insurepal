@if(!empty($branding['header_image_path']))
    <img src="{{ $branding['header_image_path'] }}" alt="Header Image" style="width: 100%; height: 100%; object-fit: conver; object-position: center; display: block;">
@elseif(!empty($branding['header_image_base64']))
    <img src="{{ $branding['header_image_base64'] }}" alt="Header Image" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;">
@else
    <div class="h-full flex items-center bg-white" style="padding: 30px 50px 10px 50px; border-bottom: 3px solid {{ $branding['primary_color'] ?? '#ccc' }};">
        <h1 class="text-2xl font-bold text-primary">{{ $branding['company_name'] ?? 'InsurePal' }}</h1>
    </div>
@endif
