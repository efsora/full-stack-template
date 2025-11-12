import { handleResult } from "#middlewares/resultHandler";
import { validate } from "#middlewares/validate";
import { Router } from "express";

import {
  handleCreateWallet,
  handleGetWallet,
  handleGetUserWallets,
} from "./handlers";
import {
  createWalletSchema,
  getWalletSchema,
  getUserWalletsSchema,
} from "./schemas";

const router = Router();

/**
 * POST /wallets
 * Create a new wallet for a user
 */
router.post("/", validate(createWalletSchema), handleResult(handleCreateWallet));

/**
 * GET /wallets/:userId/:coinType
 * Get a specific wallet by user ID and coin type
 */
router.get(
  "/:userId/:coinType",
  validate(getWalletSchema),
  handleResult(handleGetWallet),
);

/**
 * GET /wallets/:userId
 * Get all wallets for a user
 */
router.get(
  "/:userId",
  validate(getUserWalletsSchema),
  handleResult(handleGetUserWallets),
);

export default router;
