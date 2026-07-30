/**
 * Measurement Options — Shared utility for custom measurement unit options.
 *
 * Centralizes the measurementType-branching logic that was duplicated across
 * AddMedicineDialog (clinic), SaleBill (POS), purchase strategies, etc.
 *
 * All 5+ copies should import from here instead of re-implementing the same
 * switch on measurementType strings with hardcoded labels and conversion factors.
 *
 * Business logic lives in \App\Domains\Products\Services\ProductUnitService.
 * This file is a transient frontend mirror until all consumers hit the backend
 * endpoint GET /inventory/measurement-options?base_unit_id={id}.
 */

import { getUnit, convert } from './units'

export interface MeasurementOption {
  id: string
  label: string
  factor: number
}

/**
 * Get custom measurement options for a base unit ID.
 *
 * Returns available measurement subdivisions (e.g. Gram, kg for weight base units)
 * with conversion factors relative to the given base unit.
 *
 * @example getMeasurementOptions('kg')
 * → [{ id: '__custom_gram', label: 'Gram (g)', factor: 0.001 }, ...]
 */
export function getMeasurementOptions(baseUnitId: string | null | undefined): MeasurementOption[] {
  if (!baseUnitId) return []

  const unit = getUnit(baseUnitId)
  if (!unit) return []

  const type = unit.measurementType
  const opts: MeasurementOption[] = []

  if (type === 'weight') {
    const gFactor = convert(1, 'g', baseUnitId)
    if (gFactor !== null) {
      opts.push({ id: '__custom_gram', label: 'Gram (g)', factor: gFactor })
    }
    const kgFactor = convert(1, 'kg', baseUnitId)
    if (kgFactor !== null) {
      opts.push({ id: '__custom_kg', label: 'Kilogram (kg)', factor: kgFactor })
    }
  }

  if (type === 'volume') {
    const mlFactor = convert(1, 'ml', baseUnitId)
    if (mlFactor !== null) {
      opts.push({ id: '__custom_ml', label: 'Millilitre (ml)', factor: mlFactor })
    }
    const lFactor = convert(1, 'liter', baseUnitId)
    if (lFactor !== null) {
      opts.push({ id: '__custom_liter', label: 'Litre (L)', factor: lFactor })
    }
  }

  if (type === 'length') {
    const cmFactor = convert(1, 'cm', baseUnitId)
    if (cmFactor !== null) {
      opts.push({ id: '__custom_cm', label: 'Per cm', factor: cmFactor })
    }
    const mFactor = convert(1, 'meter', baseUnitId)
    if (mFactor !== null) {
      opts.push({ id: '__custom_meter', label: 'Per Meter', factor: mFactor })
    }
  }

  return opts
}