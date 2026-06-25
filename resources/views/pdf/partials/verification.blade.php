@if(!empty($qr_base64) || !empty($verification_url))
    <div style="text-align: right; padding-top: 15px;">
        @if(!empty($qr_base64))
            <img src="{{ $qr_base64 }}" style="width: 50px; height: 50px; display: inline-block; vertical-align: middle;" alt="QR Code">
        @endif
        @if(!empty($verification_url))
            <span style="font-size: 9px; color: #999; word-break: break-all; margin-left: 6px; display: inline-block; vertical-align: middle; max-width: 250px;">Verify: {{ $verification_url }}</span>
        @endif
    </div>
@endif