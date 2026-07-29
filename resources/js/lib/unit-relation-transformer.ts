/**
 * Unit Relationship Transformer
 *
 * Converts user-defined unit relationships into the backend runtime format
 * that ProductService already accepts.
 *
 * Mirrors the backend RelationshipTransformer for instant client-side preview.
 *
 * Input:  [{ unitName, relatedUnitName, quantity, salePrice, purchaseCost }]
 * Output: { packaging: [...], selling_units: [...] }
 */

import type { UnitRelation } from './unit-relation-validator'

interface PackagingRow {
  container_unit_id: number | null
  contains_unit_id: number | null
  quantity: number
  level: number
}

interface SellingUnitRow {
  name: string
  unit_id: string
  quantity: number
  sale_price: number | null
  purchase_cost: number | null
  barcode: string | null
  is_default: boolean
  product_unit_id: number | null
}

interface BackendPayload {
  packaging: PackagingRow[]
  selling_units: SellingUnitRow[]
}

/**
 * Transform user-defined relationships into the backend payload format.
 *
 * @param defaultUnitName  The Default Unit name (e.g. "Capsule")
 * @param relationships    Array of user-defined relationships
 * @returns               { packaging, selling_units } matching ProductService input
 */
export function transformRelationships(
  defaultUnitName: string,
  relationships: UnitRelation[]
): BackendPayload {
  const packaging: PackagingRow[] = []
  const sellingUnits: SellingUnitRow[] = []
  let level = 1

  // Step 1: Generate packaging rows
  for (const rel of relationships) {
    packaging.push({
      container_unit_id: null,  // resolved server-side from product_units
      contains_unit_id: null,
      quantity: rel.quantity,
      level: level++,
    })
  }

  // Step 2: Compute transitive quantities
  const quantities = computeTransitiveQuantities(defaultUnitName, relationships)

  // Step 3: Build selling unit name → product_unit_id map
  // (resolved server-side; client sends name, backend looks up ID)

  // Step 4: Add Default Unit
  sellingUnits.push({
    name: defaultUnitName,
    unit_id: defaultUnitName.toLowerCase(),
    quantity: 1,
    sale_price: findPrice(defaultUnitName, relationships),
    purchase_cost: null,
    barcode: null,
    is_default: true,
    product_unit_id: null,
  })

  // Step 5: Add each relationship's primary unit
  for (const rel of relationships) {
    const qty = quantities[rel.unitName]
    if (qty === undefined || qty <= 0) continue
    if (rel.unitName === defaultUnitName) continue

    sellingUnits.push({
      name: rel.unitName,
      unit_id: rel.relatedUnitName.toLowerCase(),
      quantity: qty,
      sale_price: rel.salePrice ?? null,
      purchase_cost: rel.purchaseCost ?? null,
      barcode: rel.barcode ?? null,
      is_default: false,
      product_unit_id: null,
    })
  }

  // Step 6: Add leaf units (related units that aren't also containers)
  for (const rel of relationships) {
    const childName = rel.relatedUnitName
    if (childName === defaultUnitName) continue

    // Check if this child already has a selling unit
    const alreadyExists = sellingUnits.some(su => su.name === childName)
    if (alreadyExists) continue

    // Check if this child is a container in another relationship
    const isContainer = relationships.some(r => r.unitName === childName)
    if (isContainer) continue

    const qty = quantities[childName]
    if (qty === undefined || qty <= 0) continue

    sellingUnits.push({
      name: childName,
      unit_id: childName.toLowerCase(),
      quantity: qty,
      sale_price: findPrice(childName, relationships),
      purchase_cost: null,
      barcode: null,
      is_default: false,
      product_unit_id: null,
    })
  }

  return { packaging, selling_units: sellingUnits }
}

/**
 * Compute transitive quantities for each unit relative to the Default Unit.
 *
 * For: Box → 12 → Strip → 10 → Capsule (Default)
 *   Capsule = 1
 *   Strip   = 10
 *   Box     = 120
 */
function computeTransitiveQuantities(
  defaultUnitName: string,
  relationships: UnitRelation[]
): Record<string, number> {
  const quantities: Record<string, number> = { [defaultUnitName]: 1 }
  const maxIterations = relationships.length + 1

  for (let i = 0; i < maxIterations; i++) {
    let changed = false

    for (const rel of relationships) {
      const parentQty = quantities[rel.relatedUnitName]
      const childQty = quantities[rel.unitName]

      // If we know the child, compute the parent
      if (childQty !== undefined && quantities[rel.relatedUnitName] === undefined) {
        quantities[rel.relatedUnitName] = childQty / rel.quantity
        changed = true
      }

      // If we know the parent, compute the child
      if (parentQty !== undefined && quantities[rel.unitName] === undefined) {
        quantities[rel.unitName] = rel.quantity * parentQty
        changed = true
      }
    }

    if (!changed) break
  }

  return quantities
}

/**
 * Find the sale price for a unit name from relationships.
 */
function findPrice(unitName: string, relationships: UnitRelation[]): number | null {
  for (const rel of relationships) {
    if (rel.unitName === unitName && rel.salePrice !== null && rel.salePrice > 0) {
      return rel.salePrice
    }
  }
  return null
}
