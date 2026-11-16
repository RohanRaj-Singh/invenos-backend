<?php

namespace App\Domains\Composition\Exceptions;

use RuntimeException;

class InsufficientComponentStockException extends RuntimeException
{
    public function __construct(
        public readonly int $componentProductId,
        public readonly string $componentName,
        public readonly float $requiredQuantity,
        public readonly float $availableQuantity,
    ) {
        parent::__construct(sprintf(
            "Insufficient stock for component '%s' (required: %s, available: %s).",
            $componentName,
            $this->formatQuantity($requiredQuantity),
            $this->formatQuantity($availableQuantity),
        ));
    }

    public function context(): array
    {
        return [
            'component_product_id' => $this->componentProductId,
            'component_name' => $this->componentName,
            'required_quantity' => $this->requiredQuantity,
            'available_quantity' => $this->availableQuantity,
        ];
    }

    private function formatQuantity(float $quantity): string
    {
        return rtrim(rtrim(number_format($quantity, 6, '.', ''), '0'), '.');
    }
}
