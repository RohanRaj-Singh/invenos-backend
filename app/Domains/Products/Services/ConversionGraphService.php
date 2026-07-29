<?php

namespace App\Domains\Products\Services;

use App\Models\Product;
use App\Models\SellingUnit;

/**
 * Walks the relationship (packaging) graph for a product and computes
 * transitive quantities from any named unit back to the Default Unit.
 *
 * Pure function — no side effects, no database writes.
 *
 * Example:
 *   Product has: Box → 12 → Strip → 10 → Capsule (Default)
 *   getQuantity(productId: 1, 'Box') → 120
 *   getQuantity(productId: 1, 'Strip') → 10
 *   getQuantity(productId: 1, 'Capsule') → 1
 */
class ConversionGraphService
{
    /**
     * Get the quantity in Default Units for a given unit name.
     *
     * @param int    $productId
     * @param string $unitName  e.g. "Box", "Strip"
     * @return float|null  Quantity in Default Units, or null if not found
     */
    public function getQuantity(int $productId, string $unitName): ?float
    {
        $graph = $this->buildGraph($productId);
        if (empty($graph)) {
            return null;
        }

        $defaultUnit = $this->findDefaultUnit($productId);
        if (!$defaultUnit) {
            return null;
        }

        if ($unitName === $defaultUnit) {
            return 1.0;
        }

        return $this->walkToDefault($unitName, $defaultUnit, $graph);
    }

    /**
     * Convert a quantity from a given unit to Default Units.
     *
     * @param int    $productId
     * @param float  $quantity
     * @param string $fromUnit  e.g. "Box"
     * @return float|null  Quantity in Default Units, or null if not found
     */
    public function convert(int $productId, float $quantity, string $fromUnit): ?float
    {
        $perUnit = $this->getQuantity($productId, $fromUnit);
        if ($perUnit === null) {
            return null;
        }
        return $quantity * $perUnit;
    }

    /**
     * Build the relationship graph from product_packaging rows.
     *
     * Graph structure:
     *   [ node_name => [ 'parent' => parent_name, 'qty' => quantity_to_parent ] ]
     */
    private function buildGraph(int $productId): array
    {
        $packaging = \App\Models\ProductPackaging::with('containerUnit', 'containsUnit')
            ->where('product_id', $productId)
            ->get();

        if ($packaging->isEmpty()) {
            return [];
        }

        $graph = [];
        foreach ($packaging as $row) {
            $container = $row->containerUnit->name;
            $contains = $row->containsUnit->name;
            $qty = (float) $row->quantity;

            // container contains N of contains → contains is the child
            // To get from container to base: walk DOWN the chain
            $graph[$container] = [
                'child' => $contains,
                'qty' => $qty,
            ];
        }

        return $graph;
    }

    /**
     * Find the Default Unit — the leaf of the packaging graph
     * (a unit that is "contained" but never a "container" itself).
     */
    private function findDefaultUnit(int $productId): ?string
    {
        $packaging = \App\Models\ProductPackaging::with('containerUnit', 'containsUnit')
            ->where('product_id', $productId)
            ->get();

        if ($packaging->isEmpty()) {
            // No packaging — the selling unit name IS the default unit
            $defaultSu = SellingUnit::where('product_id', $productId)
                ->where('is_default', true)
                ->first();
            return $defaultSu ? $defaultSu->name : null;
        }

        $containers = [];
        $contained = [];

        foreach ($packaging as $row) {
            $containers[] = $row->containerUnit->name;
            $contained[] = $row->containsUnit->name;
        }

        // The Default Unit is contained but never a container
        $leaf = array_diff($contained, $containers);

        if (empty($leaf)) {
            // Fallback: last contains_unit in the deepest level
            return $packaging->last()->containsUnit->name;
        }

        return reset($leaf);
    }

    /**
     * Walk the graph from a node down to the Default Unit.
     */
    private function walkToDefault(string $node, string $defaultUnit, array $graph): ?float
    {
        $totalQty = 1.0;
        $current = $node;
        $visited = [];

        while ($current !== $defaultUnit) {
            if (isset($visited[$current])) {
                // Cycle detected
                return null;
            }
            $visited[$current] = true;

            if (!isset($graph[$current])) {
                return null;
            }

            $edge = $graph[$current];
            $totalQty *= $edge['qty'];
            $current = $edge['child'];
        }

        return $totalQty;
    }
}
