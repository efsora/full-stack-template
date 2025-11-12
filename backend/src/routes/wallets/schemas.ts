import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Wallet data response schema
 */
export const walletDataSchema = z
  .object({
    balance: z.string().openapi({ example: "1000.00" }),
    coinType: z.string().openapi({ example: "USD" }),
    createdAt: z.coerce.date().openapi({ example: "2025-11-07T10:30:00.000Z" }),
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    updatedAt: z.coerce.date().openapi({ example: "2025-11-07T10:30:00.000Z" }),
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  })
  .openapi("WalletData");

export type WalletData = z.infer<typeof walletDataSchema>;

/**
 * Create wallet request body schema
 */
export const createWalletBodySchema = z
  .object({
    coinType: z.string().openapi({ example: "USD" }),
    initialBalance: z.number().optional().openapi({ example: 1000 }),
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  })
  .openapi("CreateWalletBody");

export type CreateWalletBody = z.infer<typeof createWalletBodySchema>;

/**
 * Get wallet params schema
 */
export const getWalletParamsSchema = z
  .object({
    coinType: z.string().openapi({ example: "USD" }),
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  })
  .openapi("GetWalletParams");

export type GetWalletParams = z.infer<typeof getWalletParamsSchema>;

/**
 * Get user wallets params schema (only userId)
 */
export const getUserWalletsParamsSchema = z
  .object({
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  })
  .openapi("GetUserWalletsParams");

export type GetUserWalletsParams = z.infer<typeof getUserWalletsParamsSchema>;

/**
 * Validation schemas for routes
 */
export const createWalletSchema = {
  body: createWalletBodySchema,
};

export const getWalletSchema = {
  params: getWalletParamsSchema,
};

export const getUserWalletsSchema = {
  params: getUserWalletsParamsSchema,
};
