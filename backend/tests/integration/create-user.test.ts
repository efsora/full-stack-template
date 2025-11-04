/**
 * Integration Tests for Create User Workflow
 *
 * Tests the complete user creation flow with real database operations.
 * Uses PostgreSQL testcontainer for isolated, reproducible testing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { run } from "#lib/result/index";
import { createUser } from "#core/users/create-user.workflow";
import type { CreateUserInput } from "#core/users/types/inputs";
import { users } from "#db/schema";
import { cleanupDatabase, getTestDb } from "../helpers/database";

describe("createUser Integration Tests", () => {
  // Cleanup database before each test to ensure isolation
  beforeEach(async () => {
    const db = getTestDb();
    await cleanupDatabase(db);
  });

  describe("Happy Path", () => {
    it("should create user successfully with valid input", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "test@example.com",
        password: "securePassword123",
        name: "Test User",
      };

      // Act
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Success");

      if (result.status === "Success") {
        // Verify user data structure
        expect(result.value).toMatchObject({
          email: "test@example.com",
          name: "Test User",
        });

        // Verify UUID is generated
        expect(result.value.id).toBeDefined();
        expect(typeof result.value.id).toBe("string");

        // Verify authentication token is generated
        expect(result.value.token).toBeDefined();
        expect(typeof result.value.token).toBe("string");
        expect(result.value.token?.length).toBeGreaterThan(0);

        // Verify user exists in database
        const db = getTestDb();
        const userRecords = await db
          .select()
          .from(users)
          .where(eq(users.email, "test@example.com"));

        expect(userRecords).toHaveLength(1);
        expect(userRecords[0].email).toBe("test@example.com");
        expect(userRecords[0].name).toBe("Test User");
        // Password should be hashed, not plain text
        expect(userRecords[0].password).not.toBe("securePassword123");
        expect(userRecords[0].password.startsWith("$2b$")).toBe(true);
      }
    });

    it("should create user successfully without optional name", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "noname@example.com",
        password: "anotherPassword456",
      };

      // Act
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Success");

      if (result.status === "Success") {
        expect(result.value.email).toBe("noname@example.com");
        expect(result.value.name).toBeNull();
        expect(result.value.token).toBeDefined();
      }
    });
  });

  describe("Error Paths", () => {
    it("should fail when email already exists", async () => {
      // Arrange - Create first user
      const input: CreateUserInput = {
        email: "duplicate@example.com",
        password: "password123",
      };
      await run(createUser(input));

      // Act - Try to create user with same email
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Failure");

      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_EMAIL_ALREADY_EXISTS");
        expect(result.error.message).toBe("Email already in use");
      }
    });

    it("should fail with invalid email format", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "not-an-email",
        password: "validPassword123",
      };

      // Act
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Failure");

      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
        expect(result.error.message).toBe("Invalid email format");
      }
    });

    it("should fail with password shorter than 8 characters", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "test@example.com",
        password: "short",
      };

      // Act
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Failure");

      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_PASSWORD");
        expect(result.error.message).toBe(
          "Password must be at least 8 characters long",
        );
      }
    });

    it("should fail with empty email", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "",
        password: "validPassword123",
      };

      // Act
      const result = await run(createUser(input));

      // Assert
      expect(result.status).toBe("Failure");

      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
      }
    });
  });

  describe("Database Integration", () => {
    it("should persist user data correctly in database", async () => {
      // Arrange
      const input: CreateUserInput = {
        email: "persist@example.com",
        password: "testPassword123",
        name: "Persist Test",
      };

      // Act
      const result = await run(createUser(input));

      // Assert - Query database directly
      expect(result.status).toBe("Success");

      const db = getTestDb();
      const userRecords = await db
        .select()
        .from(users)
        .where(eq(users.email, "persist@example.com"));

      expect(userRecords).toHaveLength(1);
      expect(userRecords[0]).toMatchObject({
        email: "persist@example.com",
        name: "Persist Test",
      });

      // Verify timestamps are set
      expect(userRecords[0].createdAt).toBeInstanceOf(Date);
      expect(userRecords[0].updatedAt).toBeInstanceOf(Date);

      // Verify password is hashed with bcrypt
      expect(userRecords[0].password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it("should handle multiple users with different emails", async () => {
      // Arrange & Act - Create multiple users
      const user1 = await run(
        createUser({
          email: "user1@example.com",
          password: "password123",
        }),
      );
      const user2 = await run(
        createUser({
          email: "user2@example.com",
          password: "password456",
        }),
      );
      const user3 = await run(
        createUser({
          email: "user3@example.com",
          password: "password789",
        }),
      );

      // Assert
      expect(user1.status).toBe("Success");
      expect(user2.status).toBe("Success");
      expect(user3.status).toBe("Success");

      // Verify all users exist in database
      const db = getTestDb();
      const allUsers = await db.select().from(users);

      expect(allUsers).toHaveLength(3);
      expect(allUsers.map((u) => u.email)).toEqual([
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ]);
    });
  });
});
