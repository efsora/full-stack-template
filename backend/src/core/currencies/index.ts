/**
 * Currencies Module
 * Public API for currency operations
 */

// Workflows
export { getSupportedCurrencies } from "./get-currencies.workflow";

// Public types - Outputs
export type { CurrencyData, GetCurrenciesResult } from "./types/outputs";

// Note: operations, internal types, and other implementation details are intentionally NOT exported
// Handlers should only use workflows from this barrel file
