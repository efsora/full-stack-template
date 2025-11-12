import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Currency response schema
 */
export const currencyDataSchema = z
  .object({
    code: z.string().openapi({ example: "USD" }),
    isActive: z.boolean().openapi({ example: true }),
    name: z.string().openapi({ example: "US Dollar" }),
    symbol: z.string().openapi({ example: "$" }),
    type: z.string().openapi({ example: "fiat" }),
  })
  .openapi("CurrencyData");

export type CurrencyData = z.infer<typeof currencyDataSchema>;
