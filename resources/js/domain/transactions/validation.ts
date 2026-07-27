import type { CartState } from './types'
import type { TransactionStrategy } from './strategies/types'

export interface ValidationRule {
  check(cart: CartState, strategy: TransactionStrategy): string | null
}

export const itemsRequiredRule: ValidationRule = {
  check(cart) {
    if (!cart.items || cart.items.length === 0) return 'At least one item is required'
    return null
  },
}

export const partyRequiredRule: ValidationRule = {
  check(cart, strategy) {
    if (strategy.requiresParty && typeof strategy.requiresParty === 'function' && strategy.requiresParty()) return 'Party is required'
    return null
  },
}

export const paymentRequiredRule: ValidationRule = {
  check(cart) {
    if (!cart.paymentMethod) return 'Payment method is required'
    return null
  },
}

export function validateCart(cart: CartState, strategy: TransactionStrategy): string[] {
  const errors: string[] = []
  for (const rule of strategy.getValidationRules()) {
    const error = rule.check(cart, strategy)
    if (error) errors.push(error)
  }
  return errors
}
