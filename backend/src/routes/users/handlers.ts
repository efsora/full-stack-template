import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import {
  CreateUserResult,
  UserData,
  createUser,
  getUserById,
} from "#core/users/index";
import {
  createFailureResponse,
  createSuccessResponse,
  type AppResponse,
} from "#lib/types/response";
import type { ValidatedRequest } from "#middlewares/validate";

import type { CreateUserBody, GetUserParams } from "./schemas";

/**
 * POST /users
 * Create a new user
 */
export async function handleCreateUser(
  req: ValidatedRequest<{ body: CreateUserBody }>,
): Promise<AppResponse<CreateUserResult>> {
  const body = req.validated.body;
  const result = await run(createUser(body));

  return matchResponse(result, {
    onSuccess: (user) =>
      createSuccessResponse({
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
export async function handleGetUserById(
  req: ValidatedRequest<{ params: GetUserParams }>,
): Promise<AppResponse<UserData>> {
  const { id } = req.validated.params;

  const result = await run(getUserById(id));

  return matchResponse(result, {
    onSuccess: (user) =>
      createSuccessResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    onFailure: (error) => createFailureResponse(error),
  });
}
