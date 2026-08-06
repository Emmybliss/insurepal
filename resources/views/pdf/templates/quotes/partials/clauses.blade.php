@if(($clauses && $clauses->isNotEmpty()) || !empty($quote->claim_payment_condition))
    <div style="margin-top: 15px; margin-bottom: 15px; page-break-inside: avoid;">
        <h3 class="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1 mb-2">Terms, Exclusions & Payment Instructions</h3>
        
        @if(!empty($quote->claim_payment_condition))
            <div style="margin-bottom: 10px; font-size: 11px;">
                <strong>Payment & Coverage Conditions:</strong>
                <p style="margin-top: 2px; color: #475569;">{{ $quote->claim_payment_condition }}</p>
            </div>
        @endif

        @if($clauses && $clauses->isNotEmpty())
            @foreach($clauses as $clause)
                <div style="margin-bottom: 8px; font-size: 11px;">
                    <strong style="color: #0f172a;">{{ $clause->title }}</strong>
                    <div style="margin-top: 2px; color: #475569; line-height: 1.4;">{!! nl2br(e($clause->content)) !!}</div>
                </div>
            @endforeach
        @endif
    </div>
@endif
