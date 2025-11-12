import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Transaction data response schema
 */
export const transactionDataSchema = z
  .object({
    amount: z.string().openapi({ example: "100.00" }),
    coinType: z.string().openapi({ example: "USD" }),
    createdAt: z.coerce.date().openapi({ example: "2025-11-07T10:30:00.000Z" }),
    fromUserId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
    status: z
      .enum(["pending", "completed", "failed"])
      .openapi({ example: "completed" }),
    toUserId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
    updatedAt: z.coerce.date().openapi({ example: "2025-11-07T10:30:00.000Z" }),
  })
  .openapi("TransactionData");

export type TransactionData = z.infer<typeof transactionDataSchema>;

/**
 * Transfer coins request body schema
 */
export const transferCoinsBodySchema = z
  .object({
    amount: z.number().positive().openapi({ example: 100 }),
    coinType: z.string().openapi({ example: "USD" }),
    fromUserId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    toUserId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  })
  .openapi("TransferCoinsBody");

export type TransferCoinsBody = z.infer<typeof transferCoinsBodySchema>;

/**
 * Get transaction history params schema
 */
export const getTransactionHistoryParamsSchema = z
  .object({
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  })
  .openapi("GetTransactionHistoryParams");

export const getTransactionHistoryQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().optional().openapi({ example: 10 }),
    offset: z.coerce.number().int().nonnegative().optional().openapi({ example: 0 }),
  })
  .openapi("GetTransactionHistoryQuery");

export type GetTransactionHistoryParams = z.infer<typeof getTransactionHistoryParamsSchema>;
export type GetTransactionHistoryQuery = z.infer<typeof getTransactionHistoryQuerySchema>;

/**
 * Validation schemas for routes
 */
export const transferCoinsSchema = {
  body: transferCoinsBodySchema,
};

export const getTransactionHistorySchema = {
  params: getTransactionHistoryParamsSchema,
  query: getTransactionHistoryQuerySchema,
};
