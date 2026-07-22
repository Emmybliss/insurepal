@if($risks->isNotEmpty())
    <div class=" avoid-break">
        <h3 class=" font-bold  uppercase border-b">Risk Schedule</h3>
        <table class="modern-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Description</th>
                    <th style="width: 20%;">Product</th>
                    <th class="text-right" style="width: 15%;">Coverage Amount</th>
                    <th class="text-right" style="width: 12%;">Rate</th>
                    <th class="text-right" style="width: 13%;">Premium</th>
                </tr>
            </thead>
            <tbody>
                @foreach($risks as $index => $risk)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td class="text-left" style="line-height: 1.3;">{{ $risk->description ?? 'N/A' }}</td>
                        <td class="text-left">{{ $risk->policyProduct->name ?? $risk->policy_product_id ?? 'N/A' }}</td>
                        <td class="text-right ">{{ number_format($risk->coverage_amount ?? 0, 2) }}</td>
                        <td class="text-right">{{ $risk->rate ? (float)$risk->rate . ($risk->rate_basis === 'percentage' ? '%' : ($risk->rate_basis === 'per_mille' ? '‰' : ($risk->rate_basis ? ' ' . str_replace('_', ' ', $risk->rate_basis) : ''))) : '-' }}</td>
                        <td class="text-right  ">{{ number_format($risk->premium ?? 0, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endif
