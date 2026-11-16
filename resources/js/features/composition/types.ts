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
  /** Present only with `products.composition.cost`; omitted otherwise. */
  unit_cost?: number | null
  line_cost?: number | null
  cost_basis?: 'exact' | 'estimated' | 'unavailable'
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
  /**
   * Cost keys are present only for users with `products.composition.cost`.
   * The server omits them entirely otherwise, so they must stay optional.
   */
  estimated_cost?: number | null
  estimated_unit_cost?: number | null
  cost_basis?: 'exact' | 'estimated' | 'unavailable'
  cost_complete?: boolean
  is_estimated?: boolean
  /** Pricing guidance; present only with the cost permission. */
  pricing?: CompositionPricing
  output_quantity_base: number | null
  created_at: string | null
  updated_at: string | null
}

export interface CompositionPricing {
  target_margin_percent: number
  /** Cost of one selling unit. */
  estimated_cost: number | null
  cost_complete: boolean
  cost_basis: string
  selling_price: number | null
  /** Name of the selling unit the price applies to. */
  selling_unit_name?: string | null
  profit: number | null
  margin_percent: number | null
  recommended_price: number | null
  recommended_profit: number | null
  available: boolean
  unavailable_reason: string | null
}

/** Request body for the POS profitability preview. */
export interface FormulaProfitabilityInput {
  composition_id?: number | null
  quantity: number
  selling_unit_id?: number | null
  unit_price?: number | null
  discount_percent?: number
  discount_amount?: number | null
  overrides?: { composition_item_id: number; quantity: number; unit_id?: string | null }[]
  optional_item_ids?: number[]
}

export interface FormulaProfitabilityLine {
  component_product_id: number
  component_name: string | null
  unit: string | null
  actual_quantity: number
  unit_cost: number | null
  total_cost: number | null
  cost_basis: string
}

/** Server-resolved profitability for a customized formula line. */
export interface FormulaProfitability {
  quantity: number
  formula_units: number
  cost_complete: boolean
  cost_basis: string
  cost_per_formula_unit: number | null
  total_ingredient_cost: number | null
  selling_unit_price: number | null
  gross_subtotal: number | null
  discount_amount: number | null
  net_revenue: number | null
  gross_profit: number | null
  gross_margin_percent: number | null
  target_margin_percent: number
  recommended_price: number | null
  recommended_profit: number | null
  available: boolean
  unavailable_reason: string | null
  lines: FormulaProfitabilityLine[]
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
  /** Present when the caller may see cost. */
  pricing?: CompositionPricing
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

export interface DraftCostEstimateItem {
  component_product_id: number
  line_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
}

/** Server cost for a formula that has not been saved yet. */
export interface DraftCostEstimate {
  output_quantity: number
  output_unit_id: string
  output_quantity_base: number
  total_cost: number | null
  unit_cost: number | null
  cost_basis: 'exact' | 'estimated' | 'unavailable'
  complete: boolean
  is_estimated: boolean
  items: DraftCostEstimateItem[]
}

export interface DraftCostInput {
  baseUnitId: string
  outputQuantity: number
  items: {
    componentProductId: number
    quantity: number
    unitId: string
    wastagePct: number
  }[]
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
