/**
 * Output types for Currencies domain
 *
 * These types represent data returned to external consumers (HTTP responses, API calls).
 */

/**
 * Public currency data
 * Safe for API responses
 */
export type CurrencyData = {
  code: string;
  name: string;
  symbol: string;
  type: string; // 'fiat' | 'crypto'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Result of getting supported currencies
 */
export type GetCurrenciesResult = {
  currencies: CurrencyData[];
};
