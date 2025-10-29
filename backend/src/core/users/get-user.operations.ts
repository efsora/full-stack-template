import { type Effect, failure, success } from "#shared/effect/index";

import { UserData } from "./types/outputs.js";

/**
 * Checks if the requesting user is the owner of the resource
 * Business logic: "A user can only view their own data"
 *
 * @param requestUserId - ID of the user making the request
 * @returns Function that checks if userData belongs to requestUserId
 */
export function checkUserOwnership(requestUserId: number) {
  return (userData: UserData): Effect<UserData> => {
    if (userData.id !== requestUserId) {
      return failure({
        code: "FORBIDDEN",
        message: "You do not have permission to access this user's data",
        resourceId: userData.id,
        resourceType: "user",
      });
    }

    return success(userData);
  };
}
