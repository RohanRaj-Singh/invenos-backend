<?php

namespace App\Domains\Products\Services;

use App\Models\Product;
use App\Models\SellingUnit;

/**
 * Single source of truth for all unit resolution in the backend.
 *
 * Every service, controller, and resource should call this class instead of
 * implementing its own unit resolution logic. No business logic should perform
 * string comparisons on unit IDs or measurement types outside this class.
 */
class ProductUnitService
{
    /**
     * Master unit registry — single mapping of unit IDs to display names.
     * This is the ONLY place in the backend where unit IDs are mapped to strings.
     */
    private const UNITS = [
        // Count
        'piece'   => 'Piece',
        'capsule' => 'Capsule',
        'tablet'  => 'Tablet',
        'bottle'  => 'Bottle',
        'box'     => 'Box',
        'carton'  => 'Carton',
        'strip'   => 'Strip',
        'sachet'  => 'Sachet',
        'packet'  => 'Packet',
        'roll'    => 'Roll',
        'sheet'   => 'Sheet',
        'tray'    => 'Tray',
        'pouch'   => 'Pouch',
        'vial'    => 'Vial',
        'ampoule' => 'Ampoule',
        'bag'     => 'Bag',
        'tub'     => 'Tub',
        'can'     => 'Can',
        'jar'     => 'Jar',
        // Weight
        'kg'      => 'Kilogram (kg)',
        'kilogram' => 'Kilogram (kg)',
        'g'       => 'Gram (g)',
        'gram'    => 'Gram (g)',
        'mg'      => 'Milligram (mg)',
        'milligram' => 'Milligram (mg)',
        // Volume
        'liter'   => 'Litre (L)',
        'litre'   => 'Litre (L)',
        'l'       => 'Litre (L)',
        'ml'      => 'Millilitre (ml)',
        'millilitre' => 'Millilitre (ml)',
        // Length
        'meter'   => 'Meter',
        'm'       => 'Meter',
        'cm'      => 'Centimetre (cm)',
        'centimetre' => 'Centimetre (cm)',
    ];

    /**
     * Measurement types — which measurement group a unit belongs to.
     */
    private const MEASUREMENT_TYPES = [
        'piece' => 'count', 'capsule' => 'count', 'tablet' => 'count',
        'bottle' => 'count', 'box' => 'count', 'carton' => 'count',
        'strip' => 'count', 'sachet' => 'count', 'packet' => 'count',
        'roll' => 'count', 'sheet' => 'count', 'tray' => 'count',
        'pouch' => 'count', 'vial' => 'count', 'ampoule' => 'count',
        'bag' => 'count', 'tub' => 'count', 'can' => 'count', 'jar' => 'count',
        'kg' => 'weight', 'kilogram' => 'weight',
        'g' => 'weight', 'gram' => 'weight',
        'mg' => 'weight', 'milligram' => 'weight',
        'liter' => 'volume', 'litre' => 'volume', 'l' => 'volume',
        'ml' => 'volume', 'millilitre' => 'volume',
        'meter' => 'length', 'm' => 'length',
        'cm' => 'length', 'centimetre' => 'length',
    ];

    /**
     * Base unit conversion — canonical base unit for each type.
     */
    private const BASE_UNITS = [
        'count'  => 'piece',
        'weight' => 'mg',
        'volume' => 'ml',
        'length' => 'cm',
    ];

    /**
     * Base factors — multiply a unit's value by this to get the canonical base unit.
     * factor = value_in_canonical_base / value_in_this_unit
     */
    private const BASE_FACTORS = [
        'piece'   => 1,
        'capsule' => 1, 'tablet' => 1, 'bottle' => 1, 'box' => 1,
        'carton'  => 1, 'strip' => 1, 'sachet' => 1, 'packet' => 1,
        'roll'    => 1, 'sheet' => 1, 'tray' => 1, 'pouch' => 1,
        'vial'    => 1, 'ampoule' => 1, 'bag' => 1, 'tub' => 1,
        'can'     => 1, 'jar' => 1,
        'mg' => 1, 'g' => 1000, 'kg' => 1000000, 'kilogram' => 1000000,
        'gram' => 1000, 'milligram' => 1,
        'ml' => 1, 'liter' => 1000, 'litre' => 1000, 'l' => 1000,
        'millilitre' => 1,
        'cm' => 1, 'meter' => 100, 'm' => 100, 'centimetre' => 1,
    ];

    // ─────────────────────────────────────────────────────────
    //  Resolution Methods
    // ─────────────────────────────────────────────────────────

    /**
     * Resolve any unit ID to its display name.
     *
     * @param string|null $unitId
     * @return string "Piece", "Kilogram (kg)", "Capsule", etc.
     */
    public function resolveDisplayUnit(?string $unitId): string
    {
        if ($unitId === null || $unitId === '') {
            return 'Unit';
        }

        $key = strtolower(trim($unitId));
        return self::UNITS[$key] ?? ucfirst($unitId);
    }

    /**
     * Resolve a selling unit's display information.
     *
     * @param SellingUnit $su
     * @return array{ name: string, unit_id: string, display_name: string, base_unit_name: string, quantity: float }
     */
    public function resolveSellingUnit(SellingUnit $su): array
    {
        return [
            'name'            => $su->name,
            'unit_id'         => $su->unit_id,
            'display_name'    => $su->name,
            'base_unit_name'  => $this->resolveDisplayUnit($su->unit_id),
            'quantity'        => (float) $su->quantity,
        ];
    }

    /**
     * Resolve purchase unit information for a product.
     *
     * Returns the selling unit that has a purchase cost if one exists,
     * otherwise falls back to the base unit display.
     *
     * @param Product $product
     * @return array{ name: string, unit_id: string, display_name: string, quantity: float }
     */
    public function resolvePurchaseUnit(Product $product): array
    {
        // Prefer the default selling unit, otherwise the first one
        $purchaseUnit = $product->sellingUnits()
            ->where('is_default', true)
            ->first() ?? $product->sellingUnits()->first();

        if ($purchaseUnit) {
            return [
                'name'         => $purchaseUnit->name,
                'unit_id'      => $purchaseUnit->unit_id ?? $product->base_unit_id,
                'display_name' => $purchaseUnit->name,
                'quantity'     => (float) $purchaseUnit->quantity,
            ];
        }

        $unitId = $product->base_unit_id ?? 'piece';
        return [
            'name'         => $this->resolveDisplayUnit($unitId),
            'unit_id'      => $unitId,
            'display_name' => $this->resolveDisplayUnit($unitId),
            'quantity'     => 1,
        ];
    }

    /**
     * Get the measurement type for a unit ID.
     * Returns 'count', 'weight', 'volume', 'length', or null.
     */
    public function getMeasurementType(?string $unitId): ?string
    {
        if ($unitId === null || $unitId === '') {
            return null;
        }
        $key = strtolower(trim($unitId));
        return self::MEASUREMENT_TYPES[$key] ?? null;
    }

    /**
     * Check if a unit ID represents a packaging-type unit (non-Piece count unit).
     */
    public function isPackagingUnit(?string $unitId): bool
    {
        $type = $this->getMeasurementType($unitId);
        if ($type !== 'count') {
            return false;
        }
        $packagingUnits = ['box', 'carton', 'bottle', 'strip', 'packet', 'sachet', 'roll', 'tray'];
        return in_array(strtolower(trim($unitId ?? '')), $packagingUnits, true);
    }

    /**
     * Check if a unit ID represents a measurement unit (weight/volume/length).
     */
    public function isMeasurementUnit(?string $unitId): bool
    {
        $type = $this->getMeasurementType($unitId);
        return $type === 'weight' || $type === 'volume' || $type === 'length';
    }

    // ─────────────────────────────────────────────────────────
    //  Formatting Methods
    // ─────────────────────────────────────────────────────────

    /**
     * Format a quantity with its unit for display.
     * E.g. formatQuantity(2.5, 'kg') → "2.5 Kilogram (kg)"
     *
     * @param float       $quantity
     * @param string|null $unitId
     * @return string
     */
    public function formatQuantity(float $quantity, ?string $unitId): string
    {
        $name = $this->resolveDisplayUnit($unitId);
        return number_format($quantity, $quantity == floor($quantity) ? 0 : 2) . ' ' . $name;
    }

    /**
     * Format stock quantity with pluralization.
     * E.g. formatStock(150, 'capsule') → "150 Capsules"
     *
     * @param float       $quantity
     * @param string|null $unitId
     * @return string
     */
    public function formatStock(float $quantity, ?string $unitId): string
    {
        $name = $this->resolveDisplayUnit($unitId);
        if ($quantity != 1 && $this->isPluralizable($unitId)) {
            $name = $this->pluralize($name);
        }
        return number_format($quantity, $quantity == floor($quantity) ? 0 : 2) . ' ' . $name;
    }

    // ─────────────────────────────────────────────────────────
    //  Custom Measurement Options
    // ─────────────────────────────────────────────────────────

    /**
     * Get custom measurement options for a base unit.
     * E.g. for 'kg': [Gram (g), factor: 0.001], [Kilogram (kg), factor: 1]
     * This is the SINGLE source — replaces all frontend duplicated branching.
     *
     * @param string $baseUnitId
     * @return array{ id: string, label: string, factor: float }[]
     */
    public function getMeasurementOptions(string $baseUnitId): array
    {
        $type = $this->getMeasurementType($baseUnitId);
        if (!$type) {
            return [];
        }

        $opts = [];

        if ($type === 'weight') {
            $gFactor = $this->getConversionFactor('g', $baseUnitId);
            if ($gFactor !== null) {
                $opts[] = ['id' => '__custom_gram', 'label' => 'Gram (g)', 'factor' => $gFactor];
            }
            $kgFactor = $this->getConversionFactor('kg', $baseUnitId);
            if ($kgFactor !== null) {
                $opts[] = ['id' => '__custom_kg', 'label' => 'Kilogram (kg)', 'factor' => $kgFactor];
            }
        }

        if ($type === 'volume') {
            $mlFactor = $this->getConversionFactor('ml', $baseUnitId);
            if ($mlFactor !== null) {
                $opts[] = ['id' => '__custom_ml', 'label' => 'Millilitre (ml)', 'factor' => $mlFactor];
            }
            $lFactor = $this->getConversionFactor('liter', $baseUnitId);
            if ($lFactor !== null) {
                $opts[] = ['id' => '__custom_liter', 'label' => 'Litre (L)', 'factor' => $lFactor];
            }
        }

        if ($type === 'length') {
            $cmFactor = $this->getConversionFactor('cm', $baseUnitId);
            if ($cmFactor !== null) {
                $opts[] = ['id' => '__custom_cm', 'label' => 'Per cm', 'factor' => $cmFactor];
            }
            $mFactor = $this->getConversionFactor('meter', $baseUnitId);
            if ($mFactor !== null) {
                $opts[] = ['id' => '__custom_meter', 'label' => 'Per Meter', 'factor' => $mFactor];
            }
        }

        return $opts;
    }

    /**
     * Get all unit definitions for dropdowns/settings.
     *
     * @return array{ value: string, label: string, type: string }[]
     */
    public function getUnitOptions(): array
    {
        $options = [];
        foreach (self::UNITS as $id => $name) {
            $type = $this->getMeasurementType($id);
            $options[] = [
                'value' => $id,
                'label' => $name,
                'type'  => $type ?? 'count',
            ];
        }
        // Remove duplicates by label
        $seen = [];
        $unique = [];
        foreach ($options as $opt) {
            if (!in_array($opt['label'], $seen, true)) {
                $seen[] = $opt['label'];
                $unique[] = $opt;
            }
        }
        return $unique;
    }

    // ─────────────────────────────────────────────────────────
    //  Internal Helpers
    // ─────────────────────────────────────────────────────────

    /**
     * Get the conversion factor from one unit to another within the same type.
     * Returns how many of $toUnit are in 1 $fromUnit.
     */
    private function getConversionFactor(string $fromUnit, string $toUnit): ?float
    {
        $fromFactor = self::BASE_FACTORS[$fromUnit] ?? null;
        $toFactor = self::BASE_FACTORS[$toUnit] ?? null;
        if ($fromFactor === null || $toFactor === null) {
            return null;
        }
        // Units are compatible if they share a base unit
        $fromBase = $this->getMeasurementType($fromUnit);
        $toBase = $this->getMeasurementType($toUnit);
        if ($fromBase !== $toBase) {
            return null;
        }
        return $fromFactor / $toFactor;
    }

    /**
     * Check if a unit name should be pluralized.
     */
    private function isPluralizable(?string $unitId): bool
    {
        $type = $this->getMeasurementType($unitId);
        // Count units are pluralizable (Capsules, Strips, Boxes)
        // Measurement units are not (kg, g, L, mL stay the same)
        return $type === 'count';
    }

    /**
     * Simple pluralization for unit names.
     */
    private function pluralize(string $name): string
    {
        // Handle special cases
        $lower = strtolower($name);
        if (in_array($lower, ['piece', 'capsule', 'tablet', 'bottle', 'strip', 'sachet',
            'packet', 'sheet', 'pouch', 'vial', 'ampoule', 'tub', 'jar'])) {
            return $name . 's';
        }
        if (in_array($lower, ['box'])) {
            return substr($name, 0, -1) . 'es';
        }
        if (in_array($lower, ['tray', 'bag'])) {
            return $name . 's'; // trays, bags
        }
        if (in_array($lower, ['carton', 'can', 'roll'])) {
            return $name . 's'; // cartons, cans, rolls
        }
        // Non-pluralizable — measurement units stay the same
        return $name;
    }
}
