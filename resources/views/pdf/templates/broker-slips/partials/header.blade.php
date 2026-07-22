@if($watermark)
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 72px; color: rgba(200, 0, 0, 0.05); font-weight: bold; text-transform: uppercase; letter-spacing: 10px; z-index: 9999; pointer-events: none; white-space: nowrap;">
        {{ $watermark }}
    </div>
@endif

<div class="flex justify-between items-center border-b pb-1 mb-4">
    <div>
        <h1 class="text-3xl font-bold text-[#000] uppercase tracking-wider">Broker Slip</h1>
        <span class="text-lg text-muted font-bold">
            Ref #: <span class="font-normal ">{{ $slip->slip_number }}</span> &nbsp;|&nbsp; 
            Date: <span class="font-normal ">{{ $slip->created_at->format('d M Y') }}</span>
            @if($slip->version > 1)
                 &nbsp;|&nbsp; Version: <span class="font-bold ">{{ $slip->version }}</span>
            @endif
        </span>
    </div>
    @if(!empty($qr_base64))
        <div>
            <img src="{{ $qr_base64 }}" class="w-20 h-20 object-contain" alt="QR Code">
        </div>
    @endif
</div>
