<?php

namespace App\Domains\Products\Services;

use App\Models\Product;
use App\Models\ProductPackaging;
use App\Models\SellingUnit;
use App\Models\ProductUnit;
use Illuminate\Support\Collection;

/**
 * Packaging Derivation Engine
 *
 * Reads product_packaging rows, walks the graph, and generates/updates
 * selling_units with packaging_id references.
 *
 * ONE-WAY FLOW: product_packaging → derivation → selling_units
 * The reverse is forbidden. Changes to selling_units must never propagate
 * back to product_packaging.
 *
 * WRITE-TIME ONLY: This engine runs on product create and packaging edit.
 * It NEVER runs on read paths (sale, purchase, report, POS).
 */
class PackagingDerivationEngine
{
    /**
     * Derive selling units from the packaging graph for a given product.
     *
     * @param int $productId
     * @return Collection  The updated/created SellingUnit models
     */
    public function derive(int $productId): Collection
    {
        $packaging = ProductPackaging::with('containerUnit', 'containsUnit')
            ->where('product_id', $productId)
            ->orderBy('level')
            ->get();

        if ($packaging->isEmpty()) {
            return collect();
        }

        // ---------------------------------------------------------------
        // Step 1: Compute transitive quantities for each unit in the graph
        // ---------------------------------------------------------------
        $quantities = $this->computeTransitiveQuantities($packaging);

        // ---------------------------------------------------------------
        // Step 2: Determine which product_unit_ids are active in the graph
        // ---------------------------------------------------------------
        $activeUnitIds = $quantities->keys()->toArray();

        // ---------------------------------------------------------------
        // Step 3: Build a lookup: product_unit_id → packaging row where
        //          the unit is the container (if any)
        // ---------------------------------------------------------------
        $containerPackaging = [];
        foreach ($packaging as $row) {
            $containerPackaging[$row->container_unit_id] = $row;
        }

        // ---------------------------------------------------------------
        // Step 4: Find or create selling units for each active unit
        // ---------------------------------------------------------------
        $derived = collect();
        $hasDefault = SellingUnit::where('product_id', $productId)
            ->where('is_default', true)
            ->exists();

        foreach ($activeUnitIds as $unitId) {
            $unit = ProductUnit::find($unitId);
            if (!$unit) {
                continue;
            }

            $quantity = $quantities[$unitId];
            $packagingRow = $containerPackaging[$unitId] ?? null;

            $sellingUnit = SellingUnit::where('product_id', $productId)
                ->where('product_unit_id', $unitId)
                ->first();

            if ($sellingUnit) {
                // --- Update existing selling unit ---
                // Quantity is owned by packaging structure — update it
                $sellingUnit->quantity = $quantity;

                // packaging_id: re-attach if it was previously orphaned
                if ($packagingRow) {
                    $sellingUnit->packaging_id = $packagingRow->id;
                }

                // NEVER overwrite: sale_price, barcode, sku, is_default
                // These are business fields owned by the user.
                $sellingUnit->save();
                $derived->push($sellingUnit);
            } else {
                // --- Create new derived selling unit ---
                $su = SellingUnit::create([
                    'product_id'      => $productId,
                    'product_unit_id' => $unitId,
                    'name'            => $unit->name,
                    'unit_id'         => $unit->name,  // backward compat
                    'quantity'        => $quantity,
                    'sale_price'      => 0,
                    'is_default'      => !$hasDefault && $derived->isEmpty(),
                    'packaging_id'    => $packagingRow ? $packagingRow->id : null,
                ]);

                // If this is the first derived unit, mark as default
                if (!$hasDefault && $derived->isEmpty()) {
                    $hasDefault = true;
                }

                $derived->push($su);
            }
        }

        // ---------------------------------------------------------------
        // Step 5: Clean up orphaned selling units
        //         (those whose product_unit_id is no longer in the graph)
        // ---------------------------------------------------------------
        $this->cleanupOrphans($productId, $activeUnitIds);

        return $derived;
    }

    /**
     * Compute transitive base-unit quantities for each unit in the packaging graph.
     *
     * For a chain: Box → 12 → Pack → 10 → Capsule
     *   Capsule (leaf) = 1
     *   Pack          = 10 × 1 = 10
     *   Box           = 12 × 10 = 120
     *
     * @param Collection $packaging  ProductPackaging rows ordered by level ASC
     * @return Collection  [product_unit_id => quantity]
     */
    private function computeTransitiveQuantities(Collection $packaging): Collection
    {
        // Collect all container and contains unit IDs
        $allContainerIds = $packaging->pluck('container_unit_id')->unique();
        $allContainsIds  = $packaging->pluck('contains_unit_id')->unique();

        // Base units are those that are "contained" but never a "container"
        $leafIds = $allContainsIds->diff($allContainerIds);
        if ($leafIds->isEmpty()) {
            // Fallback: if the graph is circular or malformed, use the last
            // contains_unit_id in the chain (deepest level)
            $leafIds = collect([$packaging->last()->contains_unit_id]);
        }

        // Initialise quantities: leaf units = 1 (base unit)
        $quantities = collect();
        foreach ($leafIds as $id) {
            $quantities[$id] = 1.0;
        }

        // Walk the graph bottom-up (process rows in reverse level order)
        $reversed = $packaging->reverse();

        foreach ($reversed as $row) {
            $childQty = $quantities[$row->contains_unit_id] ?? 1.0;
            $parentQty = (float) $row->quantity * $childQty;

            $quantities[$row->container_unit_id] = $parentQty;

            // Ensure the contains unit also has a value (it was set above or is a leaf)
            if (!isset($quantities[$row->contains_unit_id])) {
                $quantities[$row->contains_unit_id] = $childQty;
            }
        }

        return $quantities;
    }

    /**
     * Remove or detach selling units whose unit is no longer in the packaging graph.
     *
     * Rule:
     * - If the selling unit has NO customizations (price=0, no barcode, no sku)
     *   → delete it (it was purely derived)
     * - If the selling unit HAS customizations (user set price, barcode, or sku)
     *   → null the packaging_id (becomes standalone), keep product_unit_id
     *
     * @param int   $productId
     * @param array $activeUnitIds  product_unit_ids still in the packaging graph
     */
    private function cleanupOrphans(int $productId, array $activeUnitIds): void
    {
        $orphaned = SellingUnit::where('product_id', $productId)
            ->whereNotNull('product_unit_id')
            ->whereNotIn('product_unit_id', $activeUnitIds)
            ->get();

        foreach ($orphaned as $su) {
            if ($this->hasCustomizations($su)) {
                // User has set business fields → keep as standalone
                $su->packaging_id = null;
                $su->save();
            } else {
                // No customizations → safe to delete (purely derived)
                $su->delete();
            }
        }
    }

    /**
     * Check if a selling unit has user-set customizations.
     *
     * A derived unit with default values (price=0, no barcode, no sku)
     * has not been customized. Any non-default value indicates the user
     * has intentionally configured this unit.
     */
    private function hasCustomizations(SellingUnit $su): bool
    {
        return $su->sale_price > 0
            || !empty($su->barcode)
            || !empty($su->sku);
    }

    /**
     * Preview derivation without persisting.
     * Used by the frontend to show derived units before saving.
     *
     * @param array $packagingData  Array of packaging level arrays
     * @return Collection  [unit_name => quantity]
     */
    public function preview(array $packagingData): Collection
    {
        // Build temporary collection of packaging-like objects
        $packaging = collect();
        foreach ($packagingData as $i => $level) {
            $row = (object) [
                'container_unit_id' => $level['container_unit_id'],
                'contains_unit_id'  => $level['contains_unit_id'],
                'quantity'          => (float) ($level['quantity'] ?? 1),
                'level'             => $level['level'] ?? ($i + 1),
            ];
            $packaging->push($row);
        }

        if ($packaging->isEmpty()) {
            return collect();
        }

        // Load the unit names for display
        $allIds = $packaging->pluck('container_unit_id')
            ->merge($packaging->pluck('contains_unit_id'))
            ->unique();

        $units = ProductUnit::whereIn('id', $allIds)->get()->keyBy('id');

        $quantities = $this->computeTransitiveQuantities($packaging);

        $result = collect();
        foreach ($quantities as $unitId => $qty) {
            $unit = $units->get($unitId);
            $result->push([
                'product_unit_id' => $unitId,
                'name'            => $unit ? $unit->name : "Unit #{$unitId}",
                'quantity'        => $qty,
                'sale_price'      => 0,
            ]);
        }

        return $result;
    }
}
