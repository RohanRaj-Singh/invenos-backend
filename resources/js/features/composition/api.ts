import axios from 'axios'
import type {
  ComponentSearchResponse,
  ComponentUnitResponse,
  CompositionCostPreview,
  CompositionPayload,
  ProductComposition,
} from './types'

const productBase = (productId: number) => `/inventory/product/${productId}`

export async function fetchCompositions(productId: number): Promise<ProductComposition[]> {
  const response = await axios.get<{ data: ProductComposition[] }>(`${productBase(productId)}/compositions`)
  return response.data.data
}

export async function fetchActiveComposition(
  productId: number,
  kind: 'assembly' | 'consumption',
): Promise<ProductComposition | null> {
  const response = await axios.get<{ data: ProductComposition | null }>(
    `${productBase(productId)}/composition`,
    { params: { kind } },
  )
  return response.data.data
}

export async function createComposition(
  productId: number,
  payload: CompositionPayload,
): Promise<ProductComposition> {
  const response = await axios.post<{ data: ProductComposition }>(
    `${productBase(productId)}/composition`,
    payload,
  )
  return response.data.data
}

export async function updateComposition(
  productId: number,
  compositionId: number,
  payload: CompositionPayload,
): Promise<ProductComposition> {
  const response = await axios.put<{ data: ProductComposition }>(
    `${productBase(productId)}/composition/${compositionId}`,
    payload,
  )
  return response.data.data
}

export async function deactivateComposition(
  productId: number,
  compositionId: number,
): Promise<ProductComposition> {
  const response = await axios.delete<{ data: ProductComposition }>(
    `${productBase(productId)}/composition/${compositionId}`,
  )
  return response.data.data
}

export async function previewComposition(
  productId: number,
  payload: CompositionPayload,
): Promise<CompositionCostPreview> {
  const response = await axios.post<{ data: CompositionCostPreview }>(
    `${productBase(productId)}/composition/preview`,
    payload,
  )
  return response.data.data
}

export async function searchComponents(params: {
  search: string
  excludeProductId?: number | null
  perPage?: number
}): Promise<ComponentSearchResponse> {
  const response = await axios.get<ComponentSearchResponse>('/inventory/composition/components', {
    params: {
      search: params.search || undefined,
      exclude_product_id: params.excludeProductId ?? undefined,
      per_page: params.perPage ?? 12,
    },
  })
  return response.data
}

export async function fetchComponentUnits(componentProductId: number): Promise<ComponentUnitResponse> {
  const response = await axios.get<{ data: ComponentUnitResponse }>('/inventory/composition/units', {
    params: { component_product_id: componentProductId },
  })
  return response.data.data
}

export function compositionErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[] | string> | undefined
    if (errors) {
      const first = Object.values(errors)[0]
      if (Array.isArray(first)) return first[0] ?? 'Invalid composition.'
      if (typeof first === 'string') return first
    }
    if (typeof error.response?.data?.message === 'string') return error.response.data.message
    if (error.message) return error.message
  }

  return 'Something went wrong while saving the composition.'
}
