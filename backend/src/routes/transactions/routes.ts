import { handleResult } from "#middlewares/resultHandler";
import { validate } from "#middlewares/validate";
import { Router } from "express";

import {
  handleTransferCoins,
  handleGetTransactionHistory,
} from "./handlers";
import {
  transferCoinsSchema,
  getTransactionHistorySchema,
} from "./schemas";

const router = Router();

/**
 * POST /transactions/transfer
 * Transfer coins between users
 */
router.post(
  "/transfer",
  validate(transferCoinsSchema),
  handleResult(handleTransferCoins),
);

/**
 * GET /transactions/:userId
 * Get transaction history for a user
 */
router.get(
  "/:userId",
  validate(getTransactionHistorySchema),
  handleResult(handleGetTransactionHistory),
);

export default router;
