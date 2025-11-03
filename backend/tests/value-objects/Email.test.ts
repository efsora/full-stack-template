import { describe, it, expect } from "vitest";

import { Email } from "#core/users/value-objects/Email";
import { run } from "#lib/result/index";

describe("Email Value Object", () => {
  describe("create()", () => {
    it("creates valid email successfully", async () => {
      const result = await run(Email.create("user@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Email.toString(result.value)).toBe("user@example.com");
      }
    });

    it("rejects empty string", async () => {
      const result = await run(Email.create(""));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
        expect(result.error.message).toBe("Invalid email format");
      }
    });

    it("rejects invalid email format", async () => {
      const result = await run(Email.create("not-an-email"));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
        expect(result.error.message).toBe("Invalid email format");
      }
    });

    it("rejects string without @ symbol", async () => {
      const result = await run(Email.create("userexample.com"));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
      }
    });

    it("rejects email with multiple @ symbols", async () => {
      const result = await run(Email.create("user@@example.com"));

      expect(result.status).toBe("Failure");
      if (result.status === "Failure") {
        expect(result.error.code).toBe("USER_INVALID_EMAIL");
      }
    });

    it("accepts email with subdomain", async () => {
      const result = await run(Email.create("user@mail.example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Email.toString(result.value)).toBe("user@mail.example.com");
      }
    });

    it("accepts email with plus addressing", async () => {
      const result = await run(Email.create("user+tag@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        expect(Email.toString(result.value)).toBe("user+tag@example.com");
      }
    });
  });

  describe("domain()", () => {
    it("extracts domain correctly", async () => {
      const result = await run(Email.create("user@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const domain = Email.domain(result.value);
        expect(domain).toBe("example.com");
      }
    });

    it("extracts domain from subdomain email", async () => {
      const result = await run(Email.create("user@mail.example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const domain = Email.domain(result.value);
        expect(domain).toBe("mail.example.com");
      }
    });
  });

  describe("localPart()", () => {
    it("extracts local part correctly", async () => {
      const result = await run(Email.create("user@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const localPart = Email.localPart(result.value);
        expect(localPart).toBe("user");
      }
    });

    it("extracts local part with plus addressing", async () => {
      const result = await run(Email.create("user+tag@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const localPart = Email.localPart(result.value);
        expect(localPart).toBe("user+tag");
      }
    });
  });

  describe("toString()", () => {
    it("converts to string correctly", async () => {
      const result = await run(Email.create("user@example.com"));

      expect(result.status).toBe("Success");
      if (result.status === "Success") {
        const str = Email.toString(result.value);
        expect(str).toBe("user@example.com");
        expect(typeof str).toBe("string");
      }
    });
  });
});
