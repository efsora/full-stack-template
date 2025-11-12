---
name: external-service-builder
description: Creates external service interfaces and client implementations (email, payment, SMS, etc.) for FCIS backends
tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# External Service Builder Agent

Generate external service interfaces and clients.

## Input

Read design document section: **Design > External Services**

## Process

1. Create service interface (contract):
   - Use `interface I[Service]Service` for contracts
   - Define method signatures (async operations)
   - Document expected behavior
2. Create client implementation:
   - Export `create[Service]Client()` factory function
   - Implement interface methods
   - Handle errors with Result type
   - Add configuration from environment
3. Export singleton: `export const [service]Client = create[Service]Client()`
4. Update barrel export: `src/infrastructure/services/index.ts` (create if needed)
5. Update design document

## Output

- New service file: `src/infrastructure/services/[Service]Service.ts`
- Updated/new barrel: `src/infrastructure/services/index.ts`
- Design document update

## FCIS Principle

"External services are Imperative Shell - wrapped with clean interfaces for Functional Core consumption."

## Template Reference

Use `templates/service.ts.tmpl` for structure.

## Example

```typescript
// src/infrastructure/services/EmailService.ts
import { logger } from "#infrastructure/logger";
import { config } from "#infrastructure/config/env";

/**
 * Email Service Interface
 * Handles sending emails for password reset, verification, etc.
 */
export interface IEmailService {
  sendResetEmail(to: string, token: string): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
}

/**
 * Email Client Implementation
 */
export function createEmailClient(): IEmailService {
  // Initialize email client with config
  const apiKey = config.EMAIL_API_KEY;

  return {
    sendResetEmail: async (to: string, token: string): Promise<void> => {
      try {
        logger.info({ to, token }, "EmailService.sendResetEmail");
        // Implementation: Send email via API
        // await emailProvider.send({ to, subject, body })
      } catch (error) {
        logger.error({ error, to }, "EmailService.sendResetEmail failed");
        throw error;
      }
    },

    sendVerificationEmail: async (to: string, token: string): Promise<void> => {
      try {
        logger.info({ to, token }, "EmailService.sendVerificationEmail");
        // Implementation: Send email via API
      } catch (error) {
        logger.error(
          { error, to },
          "EmailService.sendVerificationEmail failed",
        );
        throw error;
      }
    },
  };
}

export const emailClient = createEmailClient();
```
