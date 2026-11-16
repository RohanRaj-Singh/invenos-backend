export type CompositionKind = 'assembly' | 'consumption'

export interface CompositionUnitOption {
  id: string
  label: string
  factor: number
  is_base: boolean
}

export interface CompositionComponentSummary {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  base_unit_id: string
  base_unit_name: string
  track_inventory?: boolean
  stock_quantity?: number
  /** Resolved negative-stock policy for this ingredient. */
  allows_negative_stock?: boolean
  status?: string
  archived?: boolean
  unit_options?: CompositionUnitOption[]
}

export interface CompositionItem {
  id: number
  component_product_id: number
  component: CompositionComponentSummary | null
  quantity_base: number
  display_unit_id: string
  display_unit_name: string
  display_quantity: number
  /** Ingredient stock expressed in the display unit for shortfall checks. */
  display_stock_quantity?: number | null
  wastage_pct: number
  effective_quantity: number
  unit_cost: number | null
  line_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
  nested: boolean
  nested_composition_id: number | null
  nested_version: number | null
  is_optional: boolean
  sort_order: number
}

export interface ProductComposition {
  id: number
  product_id: number
  product: {
    id: number
    name: string
    sku: string
    base_unit_id: string
    base_unit_name: string
  } | null
  kind: CompositionKind
  version: number
  name: string | null
  output_quantity: number
  output_unit_id: string
  output_unit_name: string
  is_active: boolean
  notes: string | null
  created_by: string | null
  component_count: number
  items: CompositionItem[]
  estimated_cost: number | null
  estimated_unit_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
  cost_complete: boolean
  is_estimated: boolean
  output_quantity_base: number | null
  created_at: string | null
  updated_at: string | null
}

export interface CompositionCostItem {
  component_product_id: number
  component_name: string
  component_sku: string
  base_unit_id: string
  base_unit_name: string
  quantity_base: number
  display_unit_id: string | null
  display_unit_name: string
  wastage_pct: number
  effective_quantity: number
  unit_cost: number | null
  line_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
  nested: boolean
  nested_composition_id: number | null
  nested_version: number | null
  is_optional: boolean
  sort_order: number
}

export interface CompositionCostPreview {
  output_quantity: number
  output_unit_id: string
  output_quantity_base: number
  total_cost: number | null
  unit_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
  complete: boolean
  is_estimated: boolean
  items: CompositionCostItem[]
}

export interface CompositionPayloadItem {
  component_product_id: number
  quantity: number
  unit_id: string
  wastage_pct: number
  is_optional: boolean
  sort_order: number
}

export interface CompositionPayload {
  kind: CompositionKind
  name?: string | null
  output_quantity: number
  output_unit_id?: string | null
  notes?: string | null
  items: CompositionPayloadItem[]
}

export interface ComponentSearchResult {
  id: number
  name: string
  sku: string
  barcode: string | null
  base_unit_id: string
  base_unit_name: string
  measurement_type: string | null
  stock_quantity: number
  status: string
  unit_options: CompositionUnitOption[]
}

export interface ComponentSearchResponse {
  data: ComponentSearchResult[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ComponentUnitResponse {
  component_product_id: number
  base_unit_id: string
  base_unit_name: string
  measurement_type: string | null
  options: CompositionUnitOption[]
}
