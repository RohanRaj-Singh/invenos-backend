<?php

namespace App\Domains\Sales\Services;

use App\Domains\Products\Services\ProductUnitService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Models\Contact;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\FinancialTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly ProductUnitService $productUnitService,
    ) {}

    public function search(string $query = '', ?int $customerId = null, ?string $paymentStatus = null, string $dateFrom = '', string $dateTo = '', int $perPage = 25): LengthAwarePaginator
    {
        $q = Sale::with('customer')->withCount('items')->where('invoice_number', 'not like', 'RET-%');

        if ($query) {
            $raw = trim($query);
            $compact = preg_replace('/[^a-z0-9]/i', '', $raw);

            $q->where(function ($q) use ($raw, $compact) {
                $q->where('invoice_number', 'like', "%{$raw}%")
                  ->orWhere('customer_name', 'like', "%{$raw}%")
                  ->orWhere('payment_status', 'like', "%{$raw}%")
                  ->orWhere('source', 'like', "%{$raw}%")
                  ->orWhere('created_by', 'like', "%{$raw}%")
                  ->orWhere('date', 'like', "%{$raw}%")
                  ->orWhereRaw('CAST(subtotal AS CHAR) LIKE ?', ["%{$raw}%"])
                  ->orWhereRaw('CAST(discount AS CHAR) LIKE ?', ["%{$raw}%"])
                  ->orWhereRaw('CAST(grand_total AS CHAR) LIKE ?', ["%{$raw}%"])
                  ->orWhereRaw('CAST(amount_paid AS CHAR) LIKE ?', ["%{$raw}%"])
                  ->orWhereRaw('CAST(outstanding_balance AS CHAR) LIKE ?', ["%{$raw}%"]);

                // "INV 260831 2234" / "inv2608312234" both match INV-260831-2234
                if ($compact !== '') {
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(invoice_number,'-',''),' ',''),'INV','') LIKE ?",
                        ["%{$compact}%"]
                    );
                }
            });
        }

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        if ($paymentStatus && $paymentStatus !== 'all') {
            $q->where('payment_status', $paymentStatus);
        }

        if ($dateFrom) {
            $q->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $q->whereDate('date', '<=', $dateTo);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(CreateSaleData $data, bool $bypassStockCheck = false): Sale
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Sale must have at least one item.');
        }

        return DB::transaction(function () use ($data, $bypassStockCheck) {
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
                $product = Product::withArchived()->lockForUpdate()->findOrFail($itemData->productId);

                // Archived products are hidden from the POS picker; reject a crafted request too.
                if ($product->isArchived()) {
                    throw ValidationException::withMessages([
                        'items' => "'{$product->name}' is archived and can't be added to a new sale.",
                    ]);
                }

                // Server-side selling unit re-validation:
                // When a selling_unit_id is provided, look up the authoritative
                // conversion factor from the selling_units table instead of
                // trusting the client-provided baseUnitQuantity.
                $authoritativeBaseUnitQty = $itemData->baseUnitQuantity;
                if ($itemData->sellingUnitId) {
                    $sellingUnit = \App\Models\SellingUnit::lockForUpdate()->find($itemData->sellingUnitId);
                    if ($sellingUnit && $sellingUnit->product_id === $product->id) {
                        $authoritativeBaseUnitQty = (float) $sellingUnit->quantity;
                    }
                }

                $baseQty = $itemData->packagingQuantity * $authoritativeBaseUnitQty;

                // Uncosted opening stock is consumed first and never valued.
                if ((float) $product->uncosted_qty > 0) {
                    $product->uncosted_qty = max(0, (float) $product->uncosted_qty - $baseQty);
                    $product->save();
                }

                // Best available cost per base unit (average -> opening -> derived).
                $costPrice = app(\App\Domains\Inventory\Services\CostResolver::class)->unitCost($product);

                // Resolve the display unit name through ProductUnitService so raw
                // unit_ids like 'kg' become 'Kilogram (kg)', and display names pass through.
                $displayUnitName = $itemData->packagingName;
                if (!$displayUnitName && $itemData->sellingUnitId) {
                    $su = \App\Models\SellingUnit::find($itemData->sellingUnitId);
                    $displayUnitName = $su?->name;
                }
                if (!$displayUnitName) {
                    $displayUnitName = $this->productUnitService->resolveDisplayUnit($product->base_unit_id);
                } else {
                    $displayUnitName = $this->productUnitService->resolveDisplayUnit($displayUnitName);
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $itemData->productName ?: $product->name,
                    'packaging_name' => $displayUnitName,
                    'packaging_quantity' => $itemData->packagingQuantity,
                    'base_unit_quantity' => $authoritativeBaseUnitQty,
                    'base_quantity' => $baseQty,
                    'unit_price' => $itemData->unitPrice,
                    'cost_price' => $costPrice,
                    'total' => $itemData->total,
                    'discount_pct' => $itemData->discountPct,
                    'category' => $itemData->category ?: ($product->category?->name ?? ''),
                    'selling_unit_id' => $itemData->sellingUnitId,
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
                    bypassStockCheck: $bypassStockCheck,
                    unitCost: $costPrice,
                    documentDate: $data->date,
                );
            }

            // Update customer balance: the invoice raises it, the initial
            // payment settles part of it. Both sides must be recorded.
            if ($customer) {
                \App\Domains\Ledger\PartyBalance::apply($customer, $grandTotal);
            }

            $ledger = app(\App\Domains\Ledger\CashLedgerService::class);

            // Initial payment is a real cash receipt — including walk-ins,
            // which have no contact and were previously never recorded.
            if ((float) $data->amountPaid > 0) {
                $ledger->record([
                    'contact_id' => $customer?->id,
                    'direction' => 'in',
                    'type' => 'collection',
                    'date' => $data->date,
                    'amount' => $data->amountPaid,
                    'method' => $data->paymentMethod ?: 'cash',
                    'reference' => 'RCPT-' . $data->invoiceNumber,
                    'description' => "Initial payment for {$data->invoiceNumber}",
                    'linked_sale_id' => $sale->id,
                    'source_type' => 'sale',
                    'source_id' => $sale->id,
                    'event_key' => 'sale-initial:' . $sale->id,
                    'created_by' => $data->createdBy,
                ]);

                if ($customer) {
                    \App\Domains\Ledger\PartyBalance::applyCash($customer, 'collection', (float) $data->amountPaid);
                }
            }

            // Invoice memo — a credit document, not cash. Kept for backward
            // compatibility; every cash report excludes type='invoice'.
            if ($customer) {
                $ledger->record([
                    'contact_id' => $customer->id,
                    'direction' => 'in',
                    'type' => 'invoice',
                    'date' => $data->date,
                    'amount' => $grandTotal,
                    'method' => $data->paymentMethod,
                    'reference' => $data->invoiceNumber,
                    'description' => "Sale: {$data->invoiceNumber}",
                    'linked_sale_id' => $sale->id,
                    'source_type' => 'sale',
                    'source_id' => $sale->id,
                    'event_key' => 'sale-invoice:' . $sale->id,
                    'created_by' => $data->createdBy,
                ]);
            }

            return $sale->load('items', 'customer');
        });
    }

    public function get(int $id): Sale
    {
        return Sale::with('items', 'customer')->findOrFail($id);
    }

    /**
     * Deprecated — use RecordLifecycleService via SaleController::destroy().
     * This method now delegates to the lifecycle path for consistency.
     */
    public function delete(int $id): ?bool
    {
        $sale = Sale::findOrFail($id);
        app(\App\Services\Lifecycle\RecordLifecycleService::class)->delete(
            $sale,
            request('reason', 'Deleted via service'),
            \Illuminate\Support\Facades\Auth::user() ?? \App\Models\User::first(),
        );
        return true;
    }

    public function restore(int $id): Sale
    {
        $sale = Sale::withTrashed()->findOrFail($id);
        $sale->restore();
        return $sale;
    }
}
