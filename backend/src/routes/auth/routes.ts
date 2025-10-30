import { handleEffect } from "#middlewares/effectHandler";
import { validate } from "#middlewares/validate";
import { Router } from "express";

import { handleLogin } from "../users/handlers";
import { loginSchema } from "../users/schemas";

const router = Router();

/**
 * POST /auth/login
 * Authenticate user with email and password (public endpoint - no authentication required)
 */
router.post("/login", validate(loginSchema), handleEffect(handleLogin));

export default router;
