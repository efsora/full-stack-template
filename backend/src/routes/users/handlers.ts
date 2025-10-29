import type { Request } from "express";

import { runEffect } from "#shared/effect/index.js";
import { register } from "#core/users/register.workflow.js";
import { getUserById } from "#core/users/get-user.workflow.js";

import { CreateUserBody, GetUserParams } from "./schemas.js";

/**
 * POST /users
 * Create a new user
 */
export async function handleCreateUser(req: Request) {
  const body = req.body as CreateUserBody;
  return await runEffect(register(body));
}

/**
 * GET /users/:id
 * Get user by ID (authenticated users only, can only access own data)
 */
export async function handleGetUserById(req: Request) {
  const { id } = req.params as unknown as GetUserParams;
  const requestUserId = req.user?.userId;

  return await runEffect(getUserById(id, requestUserId));
}
