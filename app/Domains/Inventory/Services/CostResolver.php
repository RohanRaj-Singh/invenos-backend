<?php

namespace App\Domains\Inventory\Services;

use App\Models\Product;
use App\Models\PurchaseBillItem;

/**
 * Resolves the best available cost per inventory (base) unit.
 *
 * Legacy `last_purchase_cost` / `default_purchase_cost` are stored per
 * purchase pack, so they are only used after dividing by the pack factor.
 * When nothing is reliable the answer is null — never an invented number.
 */
class CostResolver
{
    public function unitCost(Product $product): ?float
    {
        if ($product->average_cost !== null) {
            return (float) $product->average_cost;
        }

        if ($product->opening_cost !== null) {
            return (float) $product->opening_cost;
        }

        $line = $this->latestPurchaseLine($product);
        if ($line) {
            if ($line->unit_cost_base !== null) {
                return (float) $line->unit_cost_base;
            }

            $packQty = (float) $line->purchase_pack_qty;
            if ($packQty > 0) {
                return (float) $line->unit_cost / $packQty;
            }
        }

        $packQty = $this->defaultPackQty($product);

        if ($product->last_purchase_cost !== null) {
            return $packQty > 1
                ? (float) $product->last_purchase_cost / $packQty
                : (float) $product->last_purchase_cost;
        }

        if ($product->default_purchase_cost !== null) {
            return $packQty > 1
                ? (float) $product->default_purchase_cost / $packQty
                : (float) $product->default_purchase_cost;
        }

        return null;
    }

    public function costBasis(Product $product): string
    {
        if ($product->average_cost !== null) return 'exact';
        if ($product->opening_cost !== null) return 'exact';
        if ($this->latestPurchaseLine($product)) return 'estimated';
        if ($product->last_purchase_cost !== null || $product->default_purchase_cost !== null) return 'estimated';
        return 'unavailable';
    }

    private function latestPurchaseLine(Product $product): ?PurchaseBillItem
    {
        return PurchaseBillItem::query()
            ->join('purchase_bills', 'purchase_bills.id', '=', 'purchase_bill_items.purchase_bill_id')
            ->where('purchase_bill_items.product_id', $product->id)
            ->whereNull('purchase_bills.deleted_at')
            ->orderByDesc('purchase_bills.date')
            ->orderByDesc('purchase_bill_items.id')
            ->select('purchase_bill_items.*')
            ->first();
    }

    private function defaultPackQty(Product $product): float
    {
        $unit = $product->sellingUnits()->where('is_default', true)->first()
            ?? $product->sellingUnits()->first();

        return (float) ($unit?->quantity ?? 1);
    }
}
