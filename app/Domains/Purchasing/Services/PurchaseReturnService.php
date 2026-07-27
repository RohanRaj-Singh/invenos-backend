<?php

namespace App\Domains\Purchasing\Services;

use App\Domains\Purchasing\DTOs\CreatePurchaseReturnData;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PurchaseReturnService
{
    public function search(string $query = '', int $perPage = 25): LengthAwarePaginator
    {
        return PurchaseBill::with('supplier')
            ->where('invoice_ref', 'like', 'PRET-%')
            ->where(function ($q) use ($query) {
                if ($query) {
                    $q->where('invoice_ref', 'like', "%{$query}%")
                      ->orWhere('supplier_name', 'like', "%{$query}%");
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(CreatePurchaseReturnData $data): PurchaseBill
    {
        return DB::transaction(function () use ($data) {
            $original = PurchaseBill::findOrFail($data->originalPurchaseId);

            $bill = PurchaseBill::create([
                'invoice_ref' => $data->returnRef,
                'supplier_id' => $original->supplier_id,
                'supplier_name' => $original->supplier_name,
                'date' => $data->date,
                'subtotal' => $data->refundTotal,
                'total_amount' => $data->refundTotal,
                'amount_paid' => $data->refundTotal,
                'outstanding_balance' => 0,
                'payment_status' => 'paid',
                'status' => 'received',
                'notes' => "Return for {$original->invoice_ref}",
                'created_by' => $data->createdBy,
            ]);

            foreach ($data->items as $itemData) {
                $product = Product::findOrFail($itemData->productId);

                $bill->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $itemData->productName ?: $product->name,
                    'base_unit_id' => $product->base_unit_id,
                    'base_unit_name' => $product->base_unit_id,
                    'purchase_pack_name' => 'Unit',
                    'purchase_pack_qty' => $itemData->quantity,
                    'purchase_quantity' => 1,
                    'unit_cost' => $itemData->unitCost,
                    'total_cost' => $itemData->refundAmount,
                ]);

                // Remove from inventory (going back to supplier)
                if ($itemData->restock) {
                    $newBalance = $product->stock_quantity - $itemData->quantity;
                    InventoryTransaction::create([
                        'product_id' => $product->id,
                        'type' => 'return',
                        'quantity' => -$itemData->quantity,
                        'unit' => $product->base_unit_id,
                        'date' => $data->date,
                        'reference' => $data->returnRef,
                        'notes' => "Purchase return — {$original->invoice_ref}",
                        'user' => $data->createdBy,
                        'running_balance' => $newBalance,
                    ]);

                    $product->decrement('stock_quantity', $itemData->quantity);
                    $status = 'in-stock';
                    if ($product->stock_quantity <= 0) $status = 'out-of-stock';
                    elseif ($product->stock_quantity <= $product->low_stock_threshold) $status = 'low-stock';
                    $product->status = $status;
                    $product->save();
                }
            }

            return $bill->load('items', 'supplier');
        });
    }

    public function get(int $id): PurchaseBill
    {
        return PurchaseBill::with('items', 'supplier')->findOrFail($id);
    }
}
