import type { Request } from "express";

import { matchResponse } from "#lib/effect/combinators";
import { runEffect } from "#lib/effect/index";
import { createUser, getUserById, login } from "#core/users/index";

import { CreateUserBody, GetUserParams, LoginBody } from "./schemas";

/**
 * POST /users
 * Create a new user
 */
export async function handleCreateUser(req: Request) {
  const body = req.body as CreateUserBody;
  const result = await runEffect(createUser(body));

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

  const result = await runEffect(getUserById(id));

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

/**
 * POST /auth/login
 * Authenticate user with email and password
 */
export async function handleLogin(req: Request) {
  const body = req.body as LoginBody;
  const result = await runEffect(login(body));

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
