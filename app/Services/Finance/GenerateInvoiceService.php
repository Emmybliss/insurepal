<?php

namespace App\Services\Finance;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GenerateInvoiceService
{
    public function generate(array $data, User $user, ?string $tenantId = null): Invoice
    {
        return DB::transaction(function () use ($data, $user, $tenantId) {
            $tenantId ??= $user->tenant_id;

            $items = $this->calculateItems($data['items']);
            $invoiceNumber = $this->generateInvoiceNumber($tenantId);

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'policy_id' => $data['policy_id'] ?? null,
                'user_id' => $user->id,
                'due_date' => $data['due_date'],
                'currency' => $data['currency'] ?? 'USD',
                'notes' => $data['notes'] ?? null,
                'billing_address' => $data['billing_address'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'subtotal' => $items->sum('total'),
                'tax_amount' => $items->sum('tax_amount'),
                'discount_amount' => $items->sum('discount_amount'),
                'total_amount' => $items->sum('total'),
                'status' => Invoice::STATUS_DRAFT,
            ]);

            $invoice->items()->createMany($items->toArray());

            return $invoice;
        });
    }

    public function updateInvoice(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            if (isset($data['items'])) {
                $items = $this->calculateItems($data['items']);
                unset($data['items']);

                $data['subtotal'] = $items->sum('total');
                $data['tax_amount'] = $items->sum('tax_amount');
                $data['discount_amount'] = $items->sum('discount_amount');
                $data['total_amount'] = $items->sum('total');

                $this->syncItems($invoice, $items);
            }

            $invoice->update($data);

            return $invoice->fresh();
        });
    }

    public function calculateItems(array $items): Collection
    {
        return collect($items)->map(function ($item) {
            $subtotal = $item['quantity'] * $item['unit_price'];
            $taxAmount = $subtotal * ($item['tax_rate'] ?? 0) / 100;
            $discountAmount = $subtotal * ($item['discount_rate'] ?? 0) / 100;

            return [
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'tax_rate' => $item['tax_rate'] ?? 0,
                'tax_amount' => $taxAmount,
                'discount_rate' => $item['discount_rate'] ?? 0,
                'discount_amount' => $discountAmount,
                'total' => $subtotal + $taxAmount - $discountAmount,
            ];
        });
    }

    public function generateInvoiceNumber(int $tenantId): string
    {
        $lastInvoice = Invoice::withTrashed()
            ->where('tenant_id', $tenantId)
            ->latest('id')
            ->first();

        $lastNumber = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -6) : 0;

        return str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
    }

    private function syncItems(Invoice $invoice, Collection $items): void
    {
        $existingItemIds = $invoice->items->pluck('id')->toArray();
        $updatedItemIds = $items->pluck('id')->filter()->toArray();

        $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
        if (! empty($itemsToDelete)) {
            InvoiceItem::whereIn('id', $itemsToDelete)->delete();
        }

        foreach ($items as $item) {
            if (isset($item['id'])) {
                InvoiceItem::find($item['id'])->update($item);
            } else {
                $invoice->items()->create($item);
            }
        }
    }
}
