import { type Effect, pipe, failure } from "#lib/effect/index";

import { findUserById } from "#core/users/find.operations";
import { checkUserOwnership } from "#core/users/get-user.operations";
import { UserData } from "./types/outputs.js";

/**
 * Get user by ID workflow
 * Orchestrates: find user → check authorization
 *
 * @param userId - ID of the user to fetch
 * @param requestUserId - ID of the user making the request (from JWT)
 * @returns Effect with user data (excluding password)
 */
export function getUserById(userId: number, requestUserId?: number): Effect<UserData> {
  if (!requestUserId) {
    return failure({
      code: "UNAUTHORIZED",
      message: "You are not authorized to access this resource",
      resourceId: userId,
    });
  }

  return pipe(findUserById(userId), checkUserOwnership(requestUserId));
}
