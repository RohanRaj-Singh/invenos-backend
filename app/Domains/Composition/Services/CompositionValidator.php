<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Validation\ValidationException;

class CompositionValidator
{
    private const MAX_DEPTH = 20;

    public function __construct(
        private readonly ProductUnitService $units,
    ) {}

    public function validate(SaveCompositionData $data, ?int $excludeCompositionId = null): void
    {
        if (! in_array($data->kind, ProductComposition::KINDS, true)) {
            $this->fail('kind', 'Unknown composition kind.');
        }

        if ($data->outputQuantity <= 0) {
            $this->fail('output_quantity', 'Output quantity must be greater than zero.');
        }

        if (empty($data->items)) {
            $this->fail('items', 'A composition must contain at least one component.');
        }

        $product = Product::withArchived()->withTrashed()->find($data->productId);

        if ($product === null || $product->archived_at !== null || $product->trashed()) {
            $this->fail('product_id', 'The composition product must exist and be active.');
        }

        if ($data->outputUnitId !== null) {
            $this->assertUnitCompatible($product->base_unit_id, $data->outputUnitId, 'output_unit_id');
        }

        $seen = [];
        foreach ($data->items as $index => $item) {
            if (! $item instanceof CompositionItemData) {
                $this->fail('items', 'Invalid component line.');
            }

            if ($item->componentProductId <= 0) {
                $this->fail("items.{$index}.component_product_id", 'A component product is required.');
            }

            if (isset($seen[$item->componentProductId])) {
                $this->fail('items', 'The same component cannot appear more than once.');
            }
            $seen[$item->componentProductId] = true;

            if ($item->componentProductId === $data->productId) {
                $this->fail('items', 'A product cannot contain itself as a component.');
            }

            if ($item->quantityBase <= 0) {
                $this->fail("items.{$index}.quantity_base", 'Component quantity must be greater than zero.');
            }

            if ($item->wastagePct < 0 || $item->wastagePct > 100) {
                $this->fail("items.{$index}.wastage_pct", 'Wastage must be between 0 and 100 percent.');
            }

            if ($item->sortOrder !== null && $item->sortOrder < 0) {
                $this->fail("items.{$index}.sort_order", 'Sort order cannot be negative.');
            }

            $component = Product::withArchived()->withTrashed()->find($item->componentProductId);

            if ($component === null || $component->archived_at !== null || $component->trashed()) {
                $this->fail("items.{$index}.component_product_id", 'The component must exist and be active.');
            }

            if (! $component->track_inventory) {
                $this->fail("items.{$index}.component_product_id", 'The component must track inventory.');
            }

            if ($item->displayUnitId !== null) {
                $this->assertUnitCompatible(
                    $component->base_unit_id,
                    $item->displayUnitId,
                    "items.{$index}.display_unit_id",
                );
            }
        }

        $this->assertNoCycle($data, $excludeCompositionId);
    }

    private function assertUnitCompatible(string $baseUnitId, string $displayUnitId, string $field): void
    {
        $baseType = $this->units->getMeasurementType($baseUnitId);
        $displayType = $this->units->getMeasurementType($displayUnitId);

        if ($displayType === null) {
            $this->fail($field, 'The selected unit is not recognised.');
        }

        if ($baseType === null) {
            if (strtolower($baseUnitId) !== strtolower($displayUnitId)) {
                $this->fail($field, 'The selected unit is not compatible with the component base unit.');
            }

            return;
        }

        if ($baseType !== $displayType) {
            $this->fail($field, 'The selected unit is not compatible with the component base unit.');
        }
    }

    private function assertNoCycle(SaveCompositionData $data, ?int $excludeCompositionId): void
    {
        $graph = [];

        $compositions = ProductComposition::query()
            ->where('is_active', true)
            ->when($excludeCompositionId !== null, fn ($query) => $query->where('id', '!=', $excludeCompositionId))
            ->with(['items:id,composition_id,component_product_id'])
            ->get();

        foreach ($compositions as $composition) {
            foreach ($composition->items as $item) {
                $graph[(int) $composition->product_id][] = (int) $item->component_product_id;
            }
        }

        foreach ($data->items as $item) {
            $graph[$data->productId][] = $item->componentProductId;
        }

        foreach ($data->items as $item) {
            $this->assertNoPathTo($graph, $item->componentProductId, $data->productId);
        }
    }

    private function assertNoPathTo(array $graph, int $from, int $target, array $visited = [], int $depth = 0): void
    {
        if ($depth > self::MAX_DEPTH) {
            $this->fail('items', 'Composition nesting is too deep.');
        }

        if ($from === $target) {
            $this->fail('items', 'The composition would create a cycle.');
        }

        if (isset($visited[$from])) {
            return;
        }

        $visited[$from] = true;

        foreach ($graph[$from] ?? [] as $next) {
            $this->assertNoPathTo($graph, (int) $next, $target, $visited, $depth + 1);
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
