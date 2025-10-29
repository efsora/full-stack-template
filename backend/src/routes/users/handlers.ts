import type { Request } from "express";

import { runEffect } from "#lib/effect/index";
import { getUserById, register } from "#core/users/index";

import { CreateUserBody, GetUserParams } from "./schemas";

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
