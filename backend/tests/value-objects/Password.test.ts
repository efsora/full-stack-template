import { describe, it, expect } from "vitest";

import { Password } from "#core/users/value-objects/Password";
import { run } from "#lib/result/index";

describe("Password Value Object", () => {
  describe("create()", () => {
    it("creates valid password successfully (8 characters)", async () => {
      const result = await run(Password.create("password"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Password.toString(result.value)).toBe("password");
      }
    });

    it("creates valid password successfully (longer than 8 characters)", async () => {
      const result = await run(Password.create("mySecurePass123"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Password.toString(result.value)).toBe("mySecurePass123");
      }
    });

    it("rejects password shorter than 8 characters", async () => {
      const result = await run(Password.create("short"));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_PASSWORD");
        expect(result.error.message).toBe(
          "Password must be at least 8 characters long",
        );
      }
    });

    it("rejects empty string", async () => {
      const result = await run(Password.create(""));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_PASSWORD");
        expect(result.error.message).toBe(
          "Password must be at least 8 characters long",
        );
      }
    });

    it("rejects password with exactly 7 characters", async () => {
      const result = await run(Password.create("1234567"));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_PASSWORD");
      }
    });

    it("accepts password with special characters", async () => {
      const result = await run(Password.create("P@ssw0rd!"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Password.toString(result.value)).toBe("P@ssw0rd!");
      }
    });

    it("accepts password with spaces", async () => {
      const result = await run(Password.create("my password 123"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Password.toString(result.value)).toBe("my password 123");
      }
    });
  });

  describe("strength()", () => {
    it("returns 'weak' for letters only", async () => {
      const result = await run(Password.create("password"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("weak");
      }
    });

    it("returns 'weak' for numbers only", async () => {
      const result = await run(Password.create("12345678"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("weak");
      }
    });

    it("returns 'medium' for letters and numbers", async () => {
      const result = await run(Password.create("password123"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("medium");
      }
    });

    it("returns 'strong' for letters, numbers, and special characters", async () => {
      const result = await run(Password.create("P@ssw0rd!"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("strong");
      }
    });

    it("returns 'weak' for special characters only", async () => {
      const result = await run(Password.create("!@#$%^&*"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("weak");
      }
    });

    it("returns 'weak' for letters and special characters only", async () => {
      const result = await run(Password.create("password!@#"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const strength = Password.strength(result.value);
        expect(strength).toBe("weak");
      }
    });
  });

  describe("toString()", () => {
    it("converts to string correctly", async () => {
      const result = await run(Password.create("myPassword123"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const str = Password.toString(result.value);
        expect(str).toBe("myPassword123");
        expect(typeof str).toBe("string");
      }
    });
  });
});
