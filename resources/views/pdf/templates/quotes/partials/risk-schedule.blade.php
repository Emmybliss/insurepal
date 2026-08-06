@if($risks && $risks->isNotEmpty())
    <div style="margin-top: 15px; margin-bottom: 15px;">
        <h3 class="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1 mb-2">Schedule of Insured Risks</h3>
        <table class="modern-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
                <tr style="background-color: #f8fafc;">
                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">#</th>
                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Description / Property</th>
                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Identifier / Location</th>
                    <th style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">Sum Insured</th>
                    <th style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">Rate</th>
                    <th style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">Premium</th>
                </tr>
            </thead>
            <tbody>
                @foreach($risks as $index => $risk)
                    <tr>
                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">{{ $index + 1 }}</td>
                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">
                            <strong>{{ $risk->description ?? 'Insured Item' }}</strong>
                            @if($risk->policyProduct)
                                <div class="text-xs text-muted">{{ $risk->policyProduct->name }}</div>
                            @endif
                        </td>
                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">
                            {{ $risk->identifier ?? '-' }} {{ $risk->location ? '('.$risk->location.')' : '' }}
                        </td>
                        <td style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">
                            {{ $quote->currency ?? 'NGN' }} {{ number_format($risk->coverage_amount, 2) }}
                        </td>
                        <td style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">
                            {{ $risk->rate ? $risk->rate . '%' : '-' }}
                        </td>
                        <td style="padding: 6px 10px; text-align: right; border: 1px solid #e2e8f0;">
                            {{ $quote->currency ?? 'NGN' }} {{ number_format($risk->premium, 2) }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endif
