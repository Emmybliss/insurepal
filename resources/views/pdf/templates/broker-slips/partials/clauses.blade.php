@if(!empty($slip->claim_payment_condition))
    <div class="bg-light p-3 border-l-4 border-[#000] avoid-break mb-4">
        <h3 class="text-base font-bold text-[#000] uppercase mb-1">Claim Payment Condition</h3>
        <p class="text-sm leading-normal" style="white-space: pre-wrap;">{{ $slip->claim_payment_condition }}</p>
    </div>
@endif

@if($clauses && $clauses->isNotEmpty())
    <div class="mt-4">
        <h3 class="text-base font-bold text-[#000] uppercase pb-2 border-b mb-4">Clauses & Conditions</h3>
        @foreach($clauses as $clause)
            <div class="bg-light p-3 border-l-4 border-[#000] avoid-break mb-3">
                <h4 class="text-sm font-bold text-[#000] mb-1">{{ $clause->title ?? $clause->clause_title ?? 'Clause' }}</h4>
                <p class="text-xs leading-normal" style="line-height: 1.4;">{{ $clause->text ?? $clause->clause_text ?? '' }}</p>
            </div>
        @endforeach
    </div>
@endif