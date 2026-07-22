@if(($elementToggles['prepared_by'] ?? true) || ($elementToggles['authorized_signature'] ?? true))
    <div class="avoid-break mt-8 w-full">
        <div class="flex justify-between items-end">
            @if($elementToggles['prepared_by'] ?? true)
                <div class="flex flex-col items-center text-center" style="width: 200px;">
                    @php
                        $prepSig = $payload['preparer_signature_path'] ?? $preparer_signature_path ?? $payload['preparer_signature_base64'] ?? $preparer_signature ?? null;
                        $prepName = $payload['preparer_name'] ?? $preparer_name ?? 'Preparer';
                    @endphp
                    @if(!empty($prepSig))
                        <img src="{{ $prepSig }}" style="height: 50px; max-width: 160px; object-fit: contain; margin-bottom: 4px;">
                    @else
                        <div style="height: 40px;"></div>
                    @endif
                    <div class="w-full border-t border-slate-800 pt-2 text-center">
                        <p class="text-xs text-muted">Prepared By:</p>
                        <!-- <p class="text-xs font-bold">{{ $prepName }}</p> -->
                    </div>
                </div>
            @endif

            @if($elementToggles['authorized_signature'] ?? true)
                <div class="flex flex-col items-center text-center relative" style="width: 200px;">
                    @if($elementToggles['stamp'] ?? true)
                        @if(!empty($branding['stamp_path']))
                            <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); z-index: 2; opacity: 0.85;">
                                <img src="{{ $branding['stamp_path'] }}" style="width: 70px; height: 70px; object-fit: contain;">
                            </div>
                        @elseif(!empty($branding['stamp_base64']))
                            <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); z-index: 2; opacity: 0.85;">
                                <img src="{{ $branding['stamp_base64'] }}" style="width: 70px; height: 70px; object-fit: contain;">
                            </div>
                        @endif
                    @endif
                    
                    @if(!empty($branding['signature_path']))
                        <img src="{{ $branding['signature_path'] }}" style="height: 50px; max-width: 160px; object-fit: contain; margin-bottom: 4px; position: relative; z-index: 1;">
                    @elseif(!empty($branding['signature_base64']))
                        <img src="{{ $branding['signature_base64'] }}" style="height: 50px; max-width: 160px; object-fit: contain; margin-bottom: 4px; position: relative; z-index: 1;">
                    @else
                        <div style="height: 40px;"></div>
                    @endif
                    <div class="w-full border-t border-slate-800 pt-2 text-center">
                        <p class="text-xs text-muted">Authorized Signature</p>
                    </div>
                </div>
            @endif
        </div>
    </div>
@endif
