import { handleResult } from "#middlewares/resultHandler";
import { Router } from "express";

import { handleGetHello } from "./handlers";

const router = Router();

/**
 * GET /hello
 * Simple health/test endpoint - no authentication required
 */
router.get("/", handleResult(handleGetHello));

export default router;
