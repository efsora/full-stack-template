import Decimal from "decimal.js";
import { fail, success, type Result } from "#lib/result/index";

const brand: unique symbol = Symbol("TransactionAmount");

/**
 * TransactionAmount Value Object
 *
 * Ensures type safety for transaction amounts.
 * Uses Decimal.js for precise financial arithmetic.
 *
 * Constraints:
 * - Must be positive (> 0)
 * - Maximum precision: 20 digits total, 2 decimal places
 * - Matches database numeric(20, 2) type
 */
export type TransactionAmount = string & { readonly [brand]: typeof brand };

export const TransactionAmount = {
  /**
   * Create a TransactionAmount from a number or string
   *
   * Validates that:
   * 1. Value is positive (> 0)
   * 2. Value has at most 2 decimal places
   * 3. Value has at most 20 total digits
   *
   * @param value - The transaction amount (number or string)
   * @returns Result with TransactionAmount or validation error
   *
   * @example
   * ```ts
   * const amount = TransactionAmount.create(50.25);
   * if (amount.status === "Success") {
   *   // Use the validated amount for transfer
   * }
   * ```
   */
  create: (value: number | string): Result<TransactionAmount> => {
    try {
      const decimal = new Decimal(value);

      // Check if zero or negative
      if (!decimal.isPositive()) {
        return fail({
          code: "TRANSACTION_INVALID_AMOUNT",
          message: "Transaction amount must be greater than 0",
        });
      }

      // Check decimal places (max 2)
      if (decimal.decimalPlaces() > 2) {
        return fail({
          code: "TRANSACTION_INVALID_AMOUNT",
          message: "Amount can have at most 2 decimal places",
        });
      }

      // Check total digits (max 20)
      const integerDigits = decimal.toFixed(0).length;
      if (integerDigits > 18) {
        // 20 - 2 decimal places = 18 integer digits max
        return fail({
          code: "TRANSACTION_INVALID_AMOUNT",
          message: "Amount exceeds maximum value (9999999999999999.99)",
        });
      }

      // Normalize to 2 decimal places
      const normalized = decimal.toFixed(2);
      return success(normalized as TransactionAmount);
    } catch {
      return fail({
        code: "TRANSACTION_INVALID_AMOUNT",
        message: "Invalid amount format",
      });
    }
  },

  /**
   * Check if two amounts are equal
   *
   * @param a - First amount
   * @param b - Second amount
   * @returns true if a === b
   */
  isEqual: (a: TransactionAmount, b: TransactionAmount): boolean => {
    return new Decimal(a as string).equals(new Decimal(b as string));
  },

  /**
   * Check if amount is greater than another
   *
   * @param a - First amount
   * @param b - Second amount
   * @returns true if a > b
   */
  isGreaterThan: (a: TransactionAmount, b: TransactionAmount): boolean => {
    return new Decimal(a as string).greaterThan(new Decimal(b as string));
  },

  /**
   * Check if amount is less than or equal to another
   *
   * @param a - First amount
   * @param b - Second amount
   * @returns true if a <= b
   */
  isLessThanOrEqual: (a: TransactionAmount, b: TransactionAmount): boolean => {
    return new Decimal(a as string).lessThanOrEqualTo(
      new Decimal(b as string),
    );
  },

  /**
   * Convert TransactionAmount to string
   */
  toString: (amount: TransactionAmount): string => amount as string,

  /**
   * Convert TransactionAmount to number (for comparisons, etc.)
   * Warning: May lose precision for very large numbers
   */
  toNumber: (amount: TransactionAmount): number => {
    return new Decimal(amount as string).toNumber();
  },
};
