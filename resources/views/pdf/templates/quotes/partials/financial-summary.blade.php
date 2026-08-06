<div style="margin-top: 15px; margin-bottom: 15px;">
    <h3 class="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1 mb-2">Premium & Financial Summary</h3>
    <table class="modern-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <tbody>
            <tr>
                <td style="padding: 6px 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 60%;">TOTAL SUM INSURED:</td>
                <td style="padding: 6px 12px; text-align: right; font-weight: bold; border-bottom: 1px solid #e2e8f0;">
                    {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->sum_insured, 2) }}
                </td>
            </tr>
            <tr>
                <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">GROSS PREMIUM:</td>
                <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">
                    {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->gross_premium, 2) }}
                </td>
            </tr>
            @if($quote->taxes > 0)
                <tr>
                    <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">APPLICABLE TAXES (VAT/STAMP DUTY):</td>
                    <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">
                        {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->taxes, 2) }}
                    </td>
                </tr>
            @endif
            @if($quote->fees > 0)
                <tr>
                    <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0;">POLICY & POLICY ISSUANCE FEES:</td>
                    <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">
                        {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->fees, 2) }}
                    </td>
                </tr>
            @endif
            @if($quote->discount > 0)
                <tr>
                    <td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; color: #16a34a;">DISCOUNT APPLIED:</td>
                    <td style="padding: 6px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #16a34a;">
                        - {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->discount, 2) }}
                    </td>
                </tr>
            @endif
            <tr style="background-color: #f1f5f9; font-size: 13px;">
                <td style="padding: 8px 12px; font-weight: bold; border-top: 2px solid #0f172a;">TOTAL AMOUNT PAYABLE:</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #0f172a; border-top: 2px solid #0f172a;">
                    {{ $quote->currency ?? 'NGN' }} {{ number_format($quote->net_premium > 0 ? $quote->net_premium : $quote->total_amount, 2) }}
                </td>
            </tr>
        </tbody>
    </table>
</div>
