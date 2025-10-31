import type { Request } from "express";

import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import {
  createUser,
  getUserById,
} from "#core/users/index";
import {
  createFailureResponse,
  createSuccessResponse,
  type AppResponse,
} from "#lib/types/response";

import { CreateUserBody, GetUserParams } from "./schemas";

/**
 * POST /users
 * Create a new user
 */
export async function handleCreateUser(req: Request): Promise<AppResponse<{
  email: string;
  id: number;
  name: null | string;
  token?: string;
}>> {
  const body = req.body as CreateUserBody;
  const result = await run(createUser(body));

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (user) => createSuccessResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      token: user.token,
    }),
    onFailure: (error) => createFailureResponse(error),
  });
}

/**
 * GET /users/:id
 * Get user by ID (authenticated users only, can only access own data)
 */
export async function handleGetUserById(req: Request): Promise<AppResponse<{
  createdAt: Date;
  email: string;
  id: number;
  name: null | string;
  updatedAt: Date;
}>> {
  const { id } = req.params as unknown as GetUserParams;

  const result = await run(getUserById(id));

  // Explicitly map response fields for API contract
  return matchResponse(result, {
    onSuccess: (user) => createSuccessResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
    onFailure: (error) => createFailureResponse(error),
  });
}
