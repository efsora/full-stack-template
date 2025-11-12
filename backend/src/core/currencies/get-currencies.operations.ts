import { command, success, type Result } from "#lib/result/index";
import { currencyRepository } from "#infrastructure/repositories/drizzle";
import type { CurrencyData } from "./types/outputs";

/**
 * Find all active currencies from the database
 */
export function findAllActiveCurrencies(): Result<CurrencyData[]> {
  return command(
    async () => {
      return await currencyRepository.findAllActive();
    },
    (currencies) => {
      const formattedCurrencies: CurrencyData[] = currencies.map((c) => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        type: c.type,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      return success(formattedCurrencies);
    },
    {
      operation: "findAllActiveCurrencies",
      tags: { domain: "currencies", action: "find" },
    },
  );
}

