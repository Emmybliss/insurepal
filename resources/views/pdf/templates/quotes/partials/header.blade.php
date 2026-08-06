@if($watermark)
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 64px; color: rgba(200, 0, 0, 0.05); font-weight: bold; text-transform: uppercase; letter-spacing: 8px; z-index: 9999; pointer-events: none; white-space: nowrap;">
        {{ $watermark }}
    </div>
@endif

<div class="flex justify-between items-center border-b pb-2 mb-4">
    <div>
        <h1 class="text-3xl font-bold text-[#000] uppercase tracking-wider">Official Insurance Quote</h1>
        <span class="text-sm text-muted font-bold">
            Quote #: <span class="font-normal">{{ $quote->quote_number }}</span> &nbsp;|&nbsp; 
            Date: <span class="font-normal">{{ $quote->created_at ? $quote->created_at->format('d M Y') : date('d M Y') }}</span>
            @if($quote->valid_until)
                 &nbsp;|&nbsp; Valid Until: <span class="font-bold text-primary">{{ $quote->valid_until->format('d M Y') }}</span>
            @endif
            @if($quote->version > 1)
                 &nbsp;|&nbsp; Version: <span class="font-bold">{{ $quote->version }}</span>
            @endif
        </span>
    </div>
    @if(!empty($qr_base64))
        <div>
            <img src="{{ $qr_base64 }}" class="w-20 h-20 object-contain" alt="QR Verification Code">
        </div>
    @endif
</div>
