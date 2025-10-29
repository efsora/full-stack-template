import type { User } from "#db/schema";

import { userRepository } from "#infrastructure/repositories/drizzle";
import first from "lodash/fp/first";

import { commandEffect, Effect, failure, success } from "#lib/effect/index";
import { UserData } from "./types/outputs";
import { Email } from "./value-objects/Email";

/**
 * Finds all users
 * Returns CommandEffect that queries the database via repository
 */
export function findAllUsers(): Effect<UserData[]> {
  return commandEffect(
    async () => {
      const allUsers = await userRepository.findAll();
      return allUsers;
    },
    (userList: User[]) => success(userList.map(mapUserToUserData)),
    {
      operation: "findAllUsers",
      tags: { action: "read", domain: "users" },
    },
  );
}

/**
 * Finds user by email using Email Value Object
 * Returns CommandEffect that queries the database via repository
 *
 * Returns the full User entity (including password) for authentication/validation purposes.
 * Use this for:
 * - Email availability checks during registration
 * - Login authentication
 *
 * For public user data (without password), use findUserById instead.
 */
export function findByEmail(email: Email): Effect<undefined | User> {
  return commandEffect(
    async () => {
      const emailStr = Email.toString(email);
      const users = await userRepository.findByEmail(emailStr);
      return first(users);
    },
    (user: undefined | User) => success(user),
  );
}

/**
 * Finds user by ID
 * Returns CommandEffect that queries the database via repository
 */
export function findUserById(userId: number): Effect<UserData> {
  return commandEffect(
    async () => {
      const users = await userRepository.findById(userId);
      return users;
    },
    (users: User[]) => {
      const user = first(users);
      return user
        ? success(mapUserToUserData(user))
        : failure({
            code: "NOT_FOUND",
            message: "User not found",
            resourceId: userId,
            resourceType: "user",
          });
    },
    {
      operation: "findUserById",
      tags: { action: "read", domain: "users" },
    },
  );
}

/**
 * Maps User entity to UserData DTO (excludes password)
 */
function mapUserToUserData(user: User): UserData {
  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
    updatedAt: user.updatedAt,
  };
}