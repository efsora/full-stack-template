import { command, fail, success, type Result } from "#lib/result/index";
import { currencyRepository } from "#infrastructure/repositories/drizzle";

const brand: unique symbol = Symbol("CoinType");

/**
 * CoinType Value Object
 *
 * Ensures type safety for currency/coin type codes.
 * Validates that the code exists in the currencies table and is active.
 *
 * Supported: USD, EUR, BTC, ETH (managed via currencies table)
 */
export type CoinType = string & { readonly [brand]: typeof brand };

export const CoinType = {
  /**
   * Create a CoinType from a string
   *
   * Validates that:
   * 1. Code is not empty
   * 2. Code exists in currencies table
   * 3. Currency is active (isActive = true)
   *
   * @param value - The raw currency code (USD, EUR, BTC, etc.)
   * @returns Result with CoinType or validation error
   *
   * @example
   * ```ts
   * const coinType = await run(CoinType.create("USD"));
   * if (coinType.status === "Success") {
   *   // Use the validated coin type
   * }
   * ```
   */
  create: (value: string): Result<CoinType> => {
    // Validate input format
    if (!value || typeof value !== "string" || value.length === 0) {
      return fail({
        code: "WALLET_INVALID_COIN_TYPE",
        message: "Coin type cannot be empty",
      });
    }

    // Check format: uppercase letters and numbers only, 2-5 chars
    if (!/^[A-Z0-9]{2,5}$/.test(value)) {
      return fail({
        code: "WALLET_INVALID_COIN_TYPE",
        message: "Invalid coin type format. Use uppercase letters/numbers (2-5 chars)",
      });
    }

    // Async validation against currencies table
    return command(
      async () => {
        const currencies = await currencyRepository.findByCode(value);
        return currencies.length > 0 ? currencies[0] : null;
      },
      (currency) => {
        if (!currency) {
          return fail({
            code: "WALLET_INVALID_COIN_TYPE",
            message: `Currency '${value}' not found`,
          });
        }

        if (!currency.isActive) {
          return fail({
            code: "WALLET_INVALID_COIN_TYPE",
            message: `Currency '${value}' is not active`,
          });
        }

        return success(value as CoinType);
      },
      {
        operation: "CoinType.create",
        tags: { domain: "wallets", action: "validate" },
      },
    );
  },

  /**
   * Unwrap CoinType to raw string
   */
  toString: (coinType: CoinType): string => coinType as string,

  /**
   * Check if two coin types are equal
   */
  isEqual: (a: CoinType, b: CoinType): boolean => {
    return (a as string) === (b as string);
  },

  /**
   * Check if value is a valid coin type format (without DB check)
   * Useful for quick validation before async create()
   */
  isValidFormat: (value: string): boolean => {
    return /^[A-Z0-9]{2,5}$/.test(value);
  },
};
