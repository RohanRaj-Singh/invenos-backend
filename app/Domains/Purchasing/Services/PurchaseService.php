<?php

namespace App\Domains\Purchasing\Services;

use App\Domains\Products\Services\ProductUnitService;
use App\Domains\Purchasing\DTOs\CreatePurchaseData;
use App\Models\Contact;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\FinancialTransaction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly ProductUnitService $productUnitService,
    ) {}

    public function search(string $query = '', ?int $supplierId = null, ?string $status = null, string $dateFrom = '', string $dateTo = '', int $perPage = 25): LengthAwarePaginator
    {
        $q = PurchaseBill::with('supplier')->withCount('items');

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('invoice_ref', 'like', "%{$query}%")
                  ->orWhere('supplier_name', 'like', "%{$query}%");
            });
        }

        if ($supplierId) {
            $q->where('supplier_id', $supplierId);
        }

        if ($status && $status !== 'all') {
            $q->where('status', $status);
        }

        if ($dateFrom) {
            $q->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $q->whereDate('date', '<=', $dateTo);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(CreatePurchaseData $data): PurchaseBill
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Purchase must have at least one item.');
        }

        return DB::transaction(function () use ($data) {
            $supplier = Contact::lockForUpdate()->findOrFail($data->supplierId);
            if (!in_array('supplier', $supplier->roles ?? [])) {
                throw new \InvalidArgumentException('Contact must have the supplier role.');
            }

            foreach ($data->items as $itemData) {
                $product = Product::lockForUpdate()->findOrFail($itemData->productId);
                $baseQuantity = $itemData->purchasePackQty * $itemData->purchaseQuantity;
                if ($baseQuantity <= 0) {
                    throw new \InvalidArgumentException("Invalid quantity for product '{$product->name}'.");
                }
                if ($itemData->unitCost < 0) {
                    throw new \InvalidArgumentException("Unit cost cannot be negative for '{$product->name}'.");
                }
            }

            $subtotal = array_sum(array_map(fn ($item) => $item->unitCost * $item->purchaseQuantity, $data->items));
            $totalAmount = $subtotal - ($data->discount ?? 0);
            $outstanding = max(0, $totalAmount - $data->amountPaid);

            $bill = PurchaseBill::create([
                'invoice_ref' => $data->invoiceRef,
                'supplier_id' => $data->supplierId,
                'supplier_name' => $supplier->name,
                'date' => $data->date,
                'subtotal' => $subtotal,
                'discount' => $data->discount ?? 0,
                'total_amount' => $totalAmount,
                'amount_paid' => $data->amountPaid,
                'outstanding_balance' => $outstanding,
                'payment_status' => $data->paymentStatus,
                'status' => $data->status,
                'notes' => $data->notes,
                'created_by' => $data->createdBy,
            ]);

            foreach ($data->items as $itemData) {
                $product = Product::lockForUpdate()->findOrFail($itemData->productId);
                $baseQuantity = $itemData->purchasePackQty * $itemData->purchaseQuantity;

                // Resolve pack display name through ProductUnitService so raw unit_ids
                // like 'kg' become 'Kilogram (kg)', and display names pass through.
                $purchaseUnit = $this->productUnitService->resolvePurchaseUnit($product);
                $packName = $this->productUnitService->resolveDisplayUnit(
                    $itemData->packName ?: $purchaseUnit['name']
                );

                $unitName = $this->productUnitService->resolveDisplayUnit($product->base_unit_id);
                PurchaseBillItem::create([
                    'purchase_bill_id' => $bill->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'base_unit_id' => $product->base_unit_id,
                    'base_unit_name' => $unitName,
                    'purchase_pack_name' => $packName,
                    'purchase_pack_qty' => $itemData->purchasePackQty,
                    'purchase_quantity' => $itemData->purchaseQuantity,
                    'unit_cost' => $itemData->unitCost,
                    'total_cost' => $itemData->unitCost * $itemData->purchaseQuantity,
                    'discount_pct' => $itemData->discountPct,
                ]);

                $product->last_purchase_cost = $itemData->unitCost;
                if ($product->default_purchase_cost === null) {
                    $product->default_purchase_cost = $itemData->unitCost;
                }
                $product->save();

                $this->inventoryService->recordPurchase(
                    productId: $product->id,
                    quantity: (float) $baseQuantity,
                    packagingName: $itemData->packName,
                    packagingQuantity: (float) $itemData->purchasePackQty,
                    reference: $data->invoiceRef,
                    notes: "Purchase from {$supplier->name}",
                    user: $data->createdBy,
                    referenceId: $bill->id,
                );
            }

            $supplier->current_balance = ($supplier->current_balance ?? 0) + $totalAmount;
            $supplier->save();

            if ($totalAmount > 0) {
                FinancialTransaction::create([
                    'contact_id' => $supplier->id,
                    'direction' => 'out',
                    'type' => 'invoice',
                    'date' => $data->date,
                    'amount' => $totalAmount,
                    'method' => $data->paymentMethod,
                    'reference' => $data->invoiceRef,
                    'description' => "Purchase: {$data->invoiceRef}",
                    'created_by' => $data->createdBy,
                ]);
            }

            return $bill->load('items', 'supplier');
        });
    }

    public function get(int $id): PurchaseBill
    {
        return PurchaseBill::with('items', 'supplier')->findOrFail($id);
    }

    public function delete(int $id): ?bool
    {
        $bill = PurchaseBill::findOrFail($id);
        app(\App\Services\Lifecycle\RecordLifecycleService::class)->delete(
            $bill,
            request('reason', 'Deleted via service'),
            \Illuminate\Support\Facades\Auth::user() ?? \App\Models\User::first(),
        );
        return true;
    }

    public function restore(int $id): PurchaseBill
    {
        $bill = PurchaseBill::withTrashed()->findOrFail($id);
        app(\App\Services\Lifecycle\RecordLifecycleService::class)->restore(
            $bill,
            \Illuminate\Support\Facades\Auth::user() ?? \App\Models\User::first(),
        );
        return $bill->fresh();
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
