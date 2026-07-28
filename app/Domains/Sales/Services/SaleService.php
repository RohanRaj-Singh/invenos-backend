<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Models\Contact;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function search(string $query = '', ?int $customerId = null, ?string $paymentStatus = null, int $perPage = 25): LengthAwarePaginator
    {
        $q = Sale::with('customer')->withCount('items')->where('invoice_number', 'not like', 'RET-%');

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('invoice_number', 'like', "%{$query}%")
                  ->orWhere('customer_name', 'like', "%{$query}%");
            });
        }

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        if ($paymentStatus && $paymentStatus !== 'all') {
            $q->where('payment_status', $paymentStatus);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(CreateSaleData $data): Sale
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Sale must have at least one item.');
        }

        return DB::transaction(function () use ($data) {
            // Resolve customer — 0 means walk-in
            $customer = null;
            if ($data->customerId > 0) {
                $customer = Contact::lockForUpdate()->findOrFail($data->customerId);
                if (!in_array('customer', $customer->roles ?? [])) {
                    throw new \InvalidArgumentException('Contact must have the customer role.');
                }
            }

            // Validate items before any creation
            foreach ($data->items as $itemData) {
                if ($itemData->baseQuantity <= 0) {
                    throw new \InvalidArgumentException(
                        "Invalid quantity for product '{$itemData->productName}'."
                    );
                }
                if ($itemData->unitPrice < 0) {
                    throw new \InvalidArgumentException(
                        "Unit price cannot be negative for '{$itemData->productName}'."
                    );
                }
            }

            $subtotal = array_sum(array_map(fn ($item) => $item->total, $data->items));
            $grandTotal = $subtotal - $data->discount;
            $outstanding = max(0, $grandTotal - $data->amountPaid);

            $sale = Sale::create([
                'invoice_number' => $data->invoiceNumber,
                'source' => $data->source,
                'date' => $data->date,
                'customer_id' => $data->customerId > 0 ? $data->customerId : null,
                'customer_name' => $data->customerName ?: ($customer?->name ?? 'Walk-in Customer'),
                'subtotal' => $subtotal,
                'discount' => $data->discount,
                'grand_total' => $grandTotal,
                'amount_paid' => $data->amountPaid,
                'outstanding_balance' => $outstanding,
                'payment_status' => $data->paymentStatus,
                'notes' => $data->notes,
                'created_by' => $data->createdBy,
            ]);

            foreach ($data->items as $itemData) {
                $product = Product::lockForUpdate()->findOrFail($itemData->productId);

                // Recalculate base quantity server-side (never trust client conversions)
                $baseQty = $itemData->packagingQuantity * $itemData->baseUnitQuantity;

                // Calculate COGS using best-available-cost fallback
                $costPrice = $product->last_purchase_cost ?? $product->default_purchase_cost ?? 0;
                $cogs = $costPrice * $baseQty;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $itemData->productName ?: $product->name,
                    'packaging_name' => $itemData->packagingName ?? 'Unit',
                    'packaging_quantity' => $itemData->packagingQuantity,
                    'base_unit_quantity' => $itemData->baseUnitQuantity,
                    'base_quantity' => $baseQty,
                    'unit_price' => $itemData->unitPrice,
                    'cost_price' => $cogs,
                    'total' => $itemData->total,
                    'discount_pct' => $itemData->discountPct,
                    'category' => $itemData->category ?: ($product->category?->name ?? ''),
                ]);

                $this->inventoryService->recordSale(
                    productId: $product->id,
                    quantity: $baseQty,
                    packagingName: $itemData->packagingName,
                    packagingQuantity: $itemData->packagingQuantity,
                    reference: $data->invoiceNumber,
                    notes: "Sale to " . ($customer?->name ?? 'Walk-in Customer'),
                    user: $data->createdBy,
                    referenceId: $sale->id,
                );
            }

            // Update customer balance
            if ($customer) {
                $customer->current_balance = ($customer->current_balance ?? 0) + $grandTotal;
                $customer->save();
            }

            return $sale->load('items', 'customer');
        });
    }

    public function get(int $id): Sale
    {
        return Sale::with('items', 'customer')->findOrFail($id);
    }

    public function delete(int $id): ?bool
    {
        return DB::transaction(function () use ($id) {
            $sale = Sale::with('items', 'customer')->findOrFail($id);

            foreach ($sale->items as $item) {
                $this->inventoryService->recordAdjustment(
                    productId: $item->product_id,
                    quantity: $item->base_quantity,
                    reference: 'REV-' . $sale->invoice_number,
                    notes: "Reversal of sale {$sale->invoice_number}",
                    referenceType: 'sale',
                    referenceId: $sale->id,
                );
            }

            if ($sale->customer && $sale->grand_total > 0) {
                $sale->customer->current_balance = max(0, ($sale->customer->current_balance ?? 0) - $sale->grand_total);
                $sale->customer->save();
            }

            return $sale->delete();
        });
    }

    public function restore(int $id): Sale
    {
        $sale = Sale::withTrashed()->findOrFail($id);
        $sale->restore();
        return $sale;
    }
}
