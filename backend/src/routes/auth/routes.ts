import { handleEffect } from "#middlewares/effectHandler";
import { validate } from "#middlewares/validate";
import { Router } from "express";

import { handleLogin, handleRegister } from "./handlers";
import { loginSchema, registerSchema } from "./schemas";

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post("/register", validate(registerSchema), handleEffect(handleRegister));

/**
 * POST /auth/login
 * Login with email and password
 */
router.post("/login", validate(loginSchema), handleEffect(handleLogin));

export default router;