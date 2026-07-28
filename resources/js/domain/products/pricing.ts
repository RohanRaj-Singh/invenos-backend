export function computePricePerBaseUnit(defaultPrice: number, baseUnitQuantity: number): number {
  if (baseUnitQuantity <= 0) return 0
  return defaultPrice / baseUnitQuantity
}

export function computeCustomUnitPrice(pricePerBase: number, factor: number): number {
  const raw = pricePerBase * factor
  // Use 4 decimal places for small units (grams, ml) to avoid rounding to 0
  return Math.round(raw * 10000) / 10000
}
