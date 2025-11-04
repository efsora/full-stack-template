import type { User } from "#db/schema";

import { userRepository } from "#infrastructure/repositories/drizzle";
import first from "lodash/fp/first";

import { command, Result, fail, success } from "#lib/result/index";
import { UserData } from "./types/outputs";
import { Email } from "./value-objects/Email";
import { mapUserToUserData } from "#core/users/mappers";

/**
 * Continuation function for findAllUsers operation.
 * Maps User entities to UserData DTOs (excludes passwords).
 *
 * @param userList - Array of User entities from database
 * @returns Result with array of UserData
 *
 * @example
 * ```ts
 * // Unit test
 * const mockUsers = [
 *   { id: 'uuid-1', email: 'user1@example.com', name: 'User 1', password: 'hash', createdAt: new Date(), updatedAt: new Date() },
 *   { id: 'uuid-2', email: 'user2@example.com', name: 'User 2', password: 'hash', createdAt: new Date(), updatedAt: new Date() }
 * ];
 * const result = handleFindAllUsersResult(mockUsers);
 * expect(result.status).toBe('Success');
 * expect(result.value).toHaveLength(2);
 * expect(result.value[0]).not.toHaveProperty('password');
 * ```
 */
export function handleFindAllUsersResult(userList: User[]) {
  return success(userList.map(mapUserToUserData));
}

/**
 * Finds all users
 * Returns Command that queries the database via repository
 */
export function findAllUsers(): Result<UserData[]> {
  return command(
    async () => {
      const allUsers = await userRepository.findAll();
      return allUsers;
    },
    handleFindAllUsersResult,
    {
      operation: "findAllUsers",
      tags: { action: "read", domain: "users" },
    },
  );
}

/**
 * Continuation function for findByEmail operation.
 * Wraps the found user (or undefined) in a Success result.
 *
 * @param user - User entity from database or undefined if not found
 * @returns Result with User or undefined
 *
 * @example
 * ```ts
 * // Unit test - user found
 * const mockUser = { id: 'uuid-123', email: 'test@example.com', name: 'Test', password: 'hash', createdAt: new Date(), updatedAt: new Date() };
 * const result = handleFindByEmailResult(mockUser);
 * expect(result.status).toBe('Success');
 * expect(result.value).toEqual(mockUser);
 *
 * // Unit test - user not found
 * const result = handleFindByEmailResult(undefined);
 * expect(result.status).toBe('Success');
 * expect(result.value).toBeUndefined();
 * ```
 */
export function handleFindByEmailResult(user: User | undefined) {
  return success(user);
}

/**
 * Finds user by email using Email Value Object
 * Returns Command that queries the database via repository
 *
 * Returns the full User entity (including password) for authentication/validation purposes.
 * Use this for:
 * - Email availability checks during registration
 * - Login authentication
 *
 * For public user data (without password), use findUserById instead.
 */
export function findByEmail(email: Email): Result<undefined | User> {
  return command(async () => {
    const emailStr = Email.toString(email);
    const users = await userRepository.findByEmail(emailStr);
    return first(users);
  }, handleFindByEmailResult);
}

/**
 * Continuation function for findUserById operation.
 * Handles the result of user lookup by ID.
 *
 * @param users - Array of User entities from database
 * @returns Result with UserData on success, or Failure if user not found
 *
 * @example
 * ```ts
 * // Unit test - user found
 * const mockUsers = [{ id: 'uuid-123', email: 'test@example.com', name: 'Test', password: 'hash', createdAt: new Date(), updatedAt: new Date() }];
 * const result = handleFindUserByIdResult(mockUsers);
 * expect(result.status).toBe('Success');
 * expect(result.value.id).toBe('uuid-123');
 *
 * // Unit test - user not found
 * const result = handleFindUserByIdResult([]);
 * expect(result.status).toBe('Failure');
 * expect(result.error.code).toBe('USER_NOT_FOUND');
 * ```
 */
export function handleFindUserByIdResult(users: User[]) {
  const user = first(users);
  return user !== undefined
    ? success(mapUserToUserData(user))
    : fail({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
}

/**
 * Finds user by ID
 * Returns Command that queries the database via repository
 */
export function findUserById(userId: string): Result<UserData> {
  return command(
    async () => {
      const users = await userRepository.findById(userId);
      return users;
    },
    handleFindUserByIdResult,
    {
      operation: "findUserById",
      tags: { action: "read", domain: "users" },
    },
  );
}
