import { handleEffect } from "#middlewares/effectHandler";
import { Router } from "express";

import { handleGetHello } from "./handlers";

const router = Router();

/**
 * GET /hello
 * Simple health/test endpoint - no authentication required
 */
router.get("/", handleEffect(handleGetHello));

export default router;
