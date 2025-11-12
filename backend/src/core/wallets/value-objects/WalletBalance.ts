import Decimal from "decimal.js";
import { fail, success, type Result } from "#lib/result/index";

const brand: unique symbol = Symbol("WalletBalance");

/**
 * WalletBalance Value Object
 *
 * Ensures type safety for wallet balance amounts.
 * Uses Decimal.js for precise financial arithmetic.
 *
 * Constraints:
 * - Non-negative (>= 0)
 * - Maximum precision: 20 digits total, 2 decimal places
 * - Matches database numeric(20, 2) type
 */
export type WalletBalance = string & { readonly [brand]: typeof brand };

export const WalletBalance = {
  /**
   * Create a WalletBalance from a number or string
   *
   * Validates that:
   * 1. Value is not negative
   * 2. Value has at most 2 decimal places
   * 3. Value has at most 20 total digits
   *
   * @param value - The balance amount (number or string)
   * @returns Result with WalletBalance or validation error
   *
   * @example
   * ```ts
   * const balance = WalletBalance.create(100.50);
   * if (balance.status === "Success") {
   *   const newBalance = WalletBalance.add(balance.value, WalletBalance.create(50).value);
   * }
   * ```
   */
  create: (value: number | string): Result<WalletBalance> => {
    try {
      const decimal = new Decimal(value);

      // Check if negative
      if (decimal.isNegative()) {
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Balance cannot be negative",
        });
      }

      // Check decimal places (max 2)
      if (decimal.decimalPlaces() > 2) {
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Balance can have at most 2 decimal places",
        });
      }

      // Check total digits (max 20)
      const integerDigits = decimal.toFixed(0).length;
      if (integerDigits > 18) {
        // 20 - 2 decimal places = 18 integer digits max
        return fail({
          code: "WALLET_INVALID_BALANCE",
          message: "Balance exceeds maximum value (9999999999999999.99)",
        });
      }

      // Normalize to 2 decimal places
      const normalized = decimal.toFixed(2);
      return success(normalized as WalletBalance);
    } catch {
      return fail({
        code: "WALLET_INVALID_BALANCE",
        message: "Invalid balance format",
      });
    }
  },

  /**
   * Add two balances
   *
   * @param a - First balance
   * @param b - Second balance
   * @returns Sum as WalletBalance (always succeeds for valid inputs)
   */
  add: (a: WalletBalance, b: WalletBalance): WalletBalance => {
    const result = new Decimal(a as string).plus(new Decimal(b as string));
    return result.toFixed(2) as WalletBalance;
  },

  /**
   * Subtract one balance from another
   *
   * @param a - Balance to subtract from
   * @param b - Balance to subtract
   * @returns Difference as WalletBalance
   */
  subtract: (a: WalletBalance, b: WalletBalance): WalletBalance => {
    const result = new Decimal(a as string).minus(new Decimal(b as string));
    // Ensure result is non-negative (should be checked before calling this)
    const normalized = result.isNegative() ? new Decimal(0) : result;
    return normalized.toFixed(2) as WalletBalance;
  },

  /**
   * Check if balance is greater than or equal to another
   *
   * @param a - First balance
   * @param b - Second balance
   * @returns true if a >= b
   */
  isGreaterThanOrEqual: (a: WalletBalance, b: WalletBalance): boolean => {
    return new Decimal(a as string).greaterThanOrEqualTo(
      new Decimal(b as string),
    );
  },

  /**
   * Check if balance is greater than another
   *
   * @param a - First balance
   * @param b - Second balance
   * @returns true if a > b
   */
  isGreaterThan: (a: WalletBalance, b: WalletBalance): boolean => {
    return new Decimal(a as string).greaterThan(new Decimal(b as string));
  },

  /**
   * Check if two balances are equal
   *
   * @param a - First balance
   * @param b - Second balance
   * @returns true if a === b
   */
  isEqual: (a: WalletBalance, b: WalletBalance): boolean => {
    return new Decimal(a as string).equals(new Decimal(b as string));
  },

  /**
   * Convert WalletBalance to string
   */
  toString: (balance: WalletBalance): string => balance as string,

  /**
   * Convert WalletBalance to number (for comparisons, etc.)
   * Warning: May lose precision for very large numbers
   */
  toNumber: (balance: WalletBalance): number => {
    return new Decimal(balance as string).toNumber();
  },

  /**
   * Get zero balance
   */
  zero: (): WalletBalance => "0.00" as WalletBalance,

  /**
   * Check if balance is zero
   */
  isZero: (balance: WalletBalance): boolean => {
    return new Decimal(balance as string).isZero();
  },
};
