<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class CompositionPayloadMapper
{
    public function __construct(
        private readonly ProductUnitService $units,
    ) {}

    public function toSaveData(array $payload, int $productId): SaveCompositionData
    {
        $items = [];

        foreach (array_values($payload['items'] ?? []) as $index => $item) {
            $component = Product::withArchived()->withTrashed()->find($item['component_product_id'] ?? 0);

            if ($component === null) {
                throw ValidationException::withMessages([
                    "items.{$index}.component_product_id" => 'The component product does not exist.',
                ]);
            }

            $baseUnitId = $component->base_unit_id ?: 'piece';
            $unitId = $item['unit_id'] ?? $baseUnitId;
            $unitId = $unitId !== null && trim((string) $unitId) !== '' ? trim((string) $unitId) : $baseUnitId;

            $baseQuantity = $this->units->convert((float) ($item['quantity'] ?? 0), $unitId, $baseUnitId);

            if ($baseQuantity === null) {
                throw ValidationException::withMessages([
                    "items.{$index}.unit_id" => 'The selected unit is not compatible with the component base unit.',
                ]);
            }

            if ($baseQuantity <= 0) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => 'Component quantity must be greater than zero.',
                ]);
            }

            $items[] = new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: $baseQuantity,
                displayUnitId: $unitId,
                wastagePct: (float) ($item['wastage_pct'] ?? 0),
                isOptional: (bool) ($item['is_optional'] ?? false),
                sortOrder: isset($item['sort_order']) ? (int) $item['sort_order'] : $index,
            );
        }

        return new SaveCompositionData(
            productId: $productId,
            kind: (string) ($payload['kind'] ?? ''),
            items: $items,
            name: $payload['name'] ?? null,
            outputQuantity: (float) ($payload['output_quantity'] ?? 1),
            outputUnitId: $payload['output_unit_id'] ?? null,
            notes: $payload['notes'] ?? null,
        );
    }
}
