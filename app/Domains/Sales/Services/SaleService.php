<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Models\Contact;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function search(string $query = '', ?int $customerId = null, ?string $paymentStatus = null, int $perPage = 25): LengthAwarePaginator
    {
        $q = Sale::with('customer')->where('invoice_number', 'not like', 'RET-%');

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
        return DB::transaction(function () use ($data) {
            $customer = Contact::findOrFail($data->customerId);
            if (!in_array('customer', $customer->roles ?? [])) {
                throw new \InvalidArgumentException('Contact must have the customer role.');
            }

            $subtotal = array_sum(array_map(fn ($item) => $item->total, $data->items));
            $grandTotal = $subtotal - $data->discount;
            $outstanding = max(0, $grandTotal - $data->amountPaid);

            $sale = Sale::create([
                'invoice_number' => $data->invoiceNumber,
                'source' => $data->source,
                'date' => $data->date,
                'customer_id' => $data->customerId,
                'customer_name' => $data->customerName ?: $customer->name,
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
                $product = Product::findOrFail($itemData->productId);

                // Validate stock
                if ($product->track_inventory && $product->stock_quantity < $itemData->baseQuantity) {
                    throw new \RuntimeException(
                        "Insufficient stock for {$product->name}: " .
                        "requested {$itemData->baseQuantity}, available {$product->stock_quantity}"
                    );
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $itemData->productName ?: $product->name,
                    'packaging_name' => $itemData->packagingName ?? 'Unit',
                    'packaging_quantity' => $itemData->packagingQuantity,
                    'base_unit_quantity' => $itemData->baseUnitQuantity,
                    'base_quantity' => $itemData->baseQuantity,
                    'unit_price' => $itemData->unitPrice,
                    'total' => $itemData->total,
                    'discount_pct' => $itemData->discountPct,
                    'category' => $itemData->category ?: ($product->category?->name ?? ''),
                ]);

                // Inventory transaction (outflow)
                $newBalance = $product->stock_quantity - $itemData->baseQuantity;
                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => 'sale',
                    'quantity' => -$itemData->baseQuantity,
                    'unit' => $product->base_unit_id,
                    'date' => $data->date,
                    'reference' => $data->invoiceNumber,
                    'notes' => "Sale to {$data->customerName}",
                    'user' => $data->createdBy,
                    'running_balance' => $newBalance,
                    'packaging_name' => $itemData->packagingName,
                    'packaging_quantity' => $itemData->packagingQuantity,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                ]);

                $product->decrement('stock_quantity', $itemData->baseQuantity);
                $this->recalculateStatus($product);
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
        return Sale::findOrFail($id)->delete();
    }

    public function restore(int $id): Sale
    {
        $sale = Sale::withTrashed()->findOrFail($id);
        $sale->restore();
        return $sale;
    }

    private function recalculateStatus(Product $product): void
    {
        if ($product->stock_quantity <= 0) {
            $product->status = 'out-of-stock';
        } elseif ($product->stock_quantity <= $product->low_stock_threshold) {
            $product->status = 'low-stock';
        } else {
            $product->status = 'in-stock';
        }
        $product->save();
    }
}
