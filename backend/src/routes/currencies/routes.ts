import { Router } from "express";
import { handleResult } from "#middlewares/resultHandler";
import { handleGetSupportedCurrencies } from "./handlers";

const router = Router();

/**
 * GET /currencies
 * Get all supported currencies (fiat and crypto)
 */
router.get("/", handleResult(async () => handleGetSupportedCurrencies()));

export default router;
