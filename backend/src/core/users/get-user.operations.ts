import { type Result, fail, success } from "#lib/result/index";

import { UserData } from "./types/outputs";

/**
 * Checks if the requesting user is the owner of the resource
 * Business logic: "A user can only view their own data"
 *
 * @param requestUserId - ID of the user making the request
 * @returns Function that checks if userData belongs to requestUserId
 */
export function checkUserOwnership(requestUserId: number) {
  return (userData: UserData): Result<UserData> => {
    if (userData.id !== requestUserId) {
      return fail({
        code: "FORBIDDEN",
        message: "You do not have permission to access this user's data",
        resourceId: userData.id,
        resourceType: "user",
      });
    }

    return success(userData);
  };
}
