import { handleEffect } from "#middlewares/effectHandler";
import { validate } from "#middlewares/validate";
import { Router } from "express";
import { auth } from "#middlewares/auth";

import { handleCreateUser, handleGetUserById } from "./handlers";
import { createUserSchema, getUserSchema } from "./schemas";

const router = Router();

/**
 * POST /users
 * Create a new user (public endpoint - no authentication required)
 */
router.post("/", validate(createUserSchema), handleEffect(handleCreateUser));

/**
 * GET /users/:id
 * Get user by ID (protected endpoint - authentication required)
 * Users can only access their own data
 */
router.get("/:id", auth, validate(getUserSchema), handleEffect(handleGetUserById));

export default router;
