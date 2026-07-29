<?php

namespace App\Domains\Products\Services;

use App\Models\ProductUnit;

/**
 * Transforms user-defined unit relationships into the backend runtime format
 * that ProductService already accepts.
 *
 * Input:  [{ unit_name, related_unit_name, quantity, sale_price, purchase_cost, barcode }]
 * Output: { packaging: [...], selling_units: [...] }
 *
 * This is the bridge between the Relationship Editor UX and the existing
 * ProductService::create() / update() methods.
 */
class RelationshipTransformer
{
    public function __construct(
        private readonly ProductUnitService $productUnitService,
    ) {}

    /**
     * Transform relationships to the backend payload format.
     *
     * @param string $defaultUnitName  The Default Unit name (e.g. "Capsule")
     * @param array  $relationships    Each: unit_name, related_unit_name, quantity, sale_price?, purchase_cost?
     * @return array{ packaging: array, selling_units: array }
     */
    public function transform(string $defaultUnitName, array $relationships): array
    {
        // Step 1: Resolve unit names to product_units IDs
        $unitIds = $this->resolveUnitIds($relationships, $defaultUnitName);

        // Step 2: Generate packaging rows (container → contains)
        $packaging = [];
        $seenContainer = [];
        $level = 1;

        foreach ($relationships as $rel) {
            // Determine direction: the larger unit is the container
            // Container is the one that's NOT the Default Unit (or has larger quantity)
            $containerName = $rel['unit_name'];
            $containsName = $rel['related_unit_name'];

            $packaging[] = [
                'container_unit_id' => $unitIds[$containerName] ?? null,
                'contains_unit_id'  => $unitIds[$containsName] ?? null,
                'quantity'          => (float) $rel['quantity'],
                'level'             => $level++,
            ];
        }

        // Step 3: Compute transitive quantities for selling units
        $quantities = $this->computeTransitiveQuantities($defaultUnitName, $relationships);

        // Step 4: Generate selling_units rows
        $sellingUnits = [];
        $hasDefault = false;

        // Add the Default Unit itself
        $sellingUnits[] = [
            'name'            => $defaultUnitName,
            'unit_id'         => strtolower($defaultUnitName),
            'quantity'        => 1,
            'sale_price'      => $this->findPrice($defaultUnitName, $relationships),
            'is_default'      => true,
            'product_unit_id' => $unitIds[$defaultUnitName] ?? null,
        ];
        $hasDefault = true;

        // Add each defined unit
        foreach ($relationships as $rel) {
            $unitName = $rel['unit_name'];
            $qty = $quantities[$unitName] ?? null;

            if ($qty === null || $qty <= 0) {
                continue;
            }

            // Skip if this is the Default Unit (already added)
            if ($unitName === $defaultUnitName) {
                continue;
            }

            $sellingUnits[] = [
                'name'            => $unitName,
                'unit_id'         => strtolower($rel['related_unit_name'] ?? $unitName),
                'quantity'        => $qty,
                'sale_price'      => $rel['sale_price'] ?? null,
                'purchase_cost'   => $rel['purchase_cost'] ?? null,
                'barcode'         => $rel['barcode'] ?? null,
                'is_default'      => false,
                'product_unit_id' => $unitIds[$unitName] ?? null,
            ];
        }

        // Ensure the related_unit_name units also get selling units if they're leaves
        foreach ($relationships as $rel) {
            $childName = $rel['related_unit_name'];
            if ($childName === $defaultUnitName) continue;

            // Check if this child already has a selling unit
            $alreadyExists = false;
            foreach ($sellingUnits as $su) {
                if ($su['name'] === $childName) {
                    $alreadyExists = true;
                    break;
                }
            }
            if ($alreadyExists) continue;

            // Check if this child is also a container in another relationship
            $isContainer = false;
            foreach ($relationships as $r) {
                if ($r['unit_name'] === $childName) {
                    $isContainer = true;
                    break;
                }
            }
            // If it's not a container AND not the default, it's a leaf selling unit
            if (!$isContainer) {
                $qty = $quantities[$childName] ?? null;
                if ($qty !== null && $qty > 0) {
                    $sellingUnits[] = [
                        'name'            => $childName,
                        'unit_id'         => strtolower($childName),
                        'quantity'        => $qty,
                        'sale_price'      => $this->findPrice($childName, $relationships),
                        'purchase_cost'   => null,
                        'barcode'         => null,
                        'is_default'      => false,
                        'product_unit_id' => $unitIds[$childName] ?? null,
                    ];
                }
            }
        }

        return [
            'packaging'     => $packaging,
            'selling_units' => $sellingUnits,
        ];
    }

    /**
     * Resolve unit names to product_units IDs.
     */
    private function resolveUnitIds(array $relationships, string $defaultUnitName): array
    {
        $ids = [];
        $names = [$defaultUnitName];

        foreach ($relationships as $rel) {
            $names[] = $rel['unit_name'];
            $names[] = $rel['related_unit_name'];
        }

        foreach (array_unique($names) as $name) {
            $unit = ProductUnit::where('name', $name)->first();
            if ($unit) {
                $ids[$name] = $unit->id;
            }
        }

        return $ids;
    }

    /**
     * Compute transitive quantities for each unit relative to the Default Unit.
     *
     * For Box → 12 → Strip → 10 → Capsule (Default):
     *   Capsule = 1 (default)
     *   Strip   = 10   (10 × 1)
     *   Box     = 120  (12 × 10)
     */
    private function computeTransitiveQuantities(string $defaultUnitName, array $relationships): array
    {
        $quantities = [$defaultUnitName => 1.0];
        $maxIterations = count($relationships) + 1;

        for ($i = 0; $i < $maxIterations; $i++) {
            $changed = false;

            foreach ($relationships as $rel) {
                $unitName = $rel['unit_name'];
                $childName = $rel['related_unit_name'];
                $qty = (float) $rel['quantity'];

                // If we know the child's quantity, compute the parent's
                if (isset($quantities[$childName]) && !isset($quantities[$unitName])) {
                    $quantities[$unitName] = $qty * $quantities[$childName];
                    $changed = true;
                }

                // If we know the parent's quantity, compute the child's
                if (isset($quantities[$unitName]) && !isset($quantities[$childName])) {
                    $quantities[$childName] = $quantities[$unitName] / $qty;
                    $changed = true;
                }
            }

            if (!$changed) {
                break;
            }
        }

        return $quantities;
    }

    /**
     * Find the price for a given unit name from the relationship definitions.
     */
    private function findPrice(string $unitName, array $relationships): ?float
    {
        foreach ($relationships as $rel) {
            if ($rel['unit_name'] === $unitName && isset($rel['sale_price'])) {
                return (float) $rel['sale_price'];
            }
            // Also check if this unit appears as the parent in another relationship
            if ($rel['related_unit_name'] === $unitName && isset($rel['sale_price'])) {
                // Price is typically on the larger unit, not the leaf
                // But check both
            }
        }
        return null;
    }
}
