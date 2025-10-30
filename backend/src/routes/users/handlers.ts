import type { Request } from "express";

import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import { createUser, getUserById } from "#core/users/index";

import { CreateUserBody, GetUserParams } from "./schemas";

/**
 * POST /users
 * Create a new user
 */
export async function handleCreateUser(req: Request) {
  const body = req.body as CreateUserBody;
  const result = await run(createUser(body));

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      token: user.token,
    }),
  });
}

/**
 * GET /users/:id
 * Get user by ID (authenticated users only, can only access own data)
 */
export async function handleGetUserById(req: Request) {
  const { id } = req.params as unknown as GetUserParams;

  const result = await run(getUserById(id));

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
  });
}
