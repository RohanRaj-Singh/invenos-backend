<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SaleReturnService
{
    public function search(string $query = '', int $perPage = 25): LengthAwarePaginator
    {
        return Sale::with('customer')
            ->where('invoice_number', 'like', 'RET-%')
            ->where(function ($q) use ($query) {
                if ($query) {
                    $q->where('invoice_number', 'like', "%{$query}%")
                      ->orWhere('customer_name', 'like', "%{$query}%");
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(CreateSaleReturnData $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $original = Sale::findOrFail($data->originalSaleId);

            $sale = Sale::create([
                'invoice_number' => $data->returnNumber,
                'source' => 'pos',
                'date' => $data->date,
                'customer_id' => $original->customer_id,
                'customer_name' => $original->customer_name,
                'subtotal' => $data->refundTotal,
                'discount' => 0,
                'grand_total' => $data->refundTotal,
                'amount_paid' => $data->refundTotal,
                'outstanding_balance' => 0,
                'payment_status' => 'paid',
                'notes' => "Return for {$original->invoice_number}",
                'created_by' => $data->createdBy,
            ]);

            foreach ($data->items as $itemData) {
                $product = Product::findOrFail($itemData->productId);

                // Only create sale item for record-keeping
                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $itemData->productName ?: $product->name,
                    'packaging_name' => 'Unit',
                    'packaging_quantity' => $itemData->quantity,
                    'base_unit_quantity' => 1,
                    'base_quantity' => $itemData->quantity,
                    'unit_price' => $itemData->unitPrice,
                    'total' => $itemData->refundAmount,
                    'category' => $product->category?->name ?? '',
                    'restock' => $itemData->restock,
                ]);

                // Only restock if condition is resellable
                if ($itemData->restock) {
                    $newBalance = $product->stock_quantity + $itemData->quantity;
                    InventoryTransaction::create([
                        'product_id' => $product->id,
                        'type' => 'return',
                        'quantity' => $itemData->quantity,
                        'unit' => $product->base_unit_id,
                        'date' => $data->date,
                        'reference' => $data->returnNumber,
                        'notes' => "Sale return — {$original->invoice_number}",
                        'user' => $data->createdBy,
                        'running_balance' => $newBalance,
                    ]);

                    $product->increment('stock_quantity', $itemData->quantity);
                    $this->recalculateStatus($product);
                }
            }

            return $sale->load('items');
        });
    }

    public function get(int $id): Sale
    {
        return Sale::with('items')->findOrFail($id);
    }

    private function recalculateStatus(Product $product): void
    {
        $status = 'in-stock';
        if ($product->stock_quantity <= 0) $status = 'out-of-stock';
        elseif ($product->stock_quantity <= $product->low_stock_threshold) $status = 'low-stock';
        $product->status = $status;
        $product->save();
    }
}
