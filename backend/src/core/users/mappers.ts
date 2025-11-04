import type { User } from "#db/schema";
import type { UserData } from "#core/users/types/outputs";

/**
 * Maps User entity to UserData DTO (excludes password)
 *
 * @param user - User entity from database
 * @returns UserData DTO without sensitive fields
 */
export function mapUserToUserData(user: User): UserData {
  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
    updatedAt: user.updatedAt,
  };
}
