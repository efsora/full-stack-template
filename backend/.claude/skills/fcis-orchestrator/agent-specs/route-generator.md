---
name: route-generator
description: Creates HTTP layer components (routes, handlers, Zod schemas) with OpenAPI metadata and barrel-only imports
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
model: sonnet
---

# Route Generator Agent

Generate HTTP layer: routes, handlers, Zod schemas.

## Input
Read design document section: **Design > HTTP Layer**

## Process

### 1. Schemas (`src/routes/[domain]/schemas.ts`)
- Import Zod with OpenAPI extension
- Define request schemas (body, params, query):
  ```typescript
  export const createBodySchema = z
    .object({
      field: z.string().email().openapi({ example: "test@example.com" }),
    })
    .openapi("CreateBody");

  export type CreateBody = z.infer<typeof createBodySchema>;
  ```
- Add OpenAPI metadata (examples, descriptions)

### 2. Handlers (`src/routes/[domain]/handlers.ts`)
- **CRITICAL**: Import workflows ONLY from barrel (`#core/[domain]/index.js`)
- Import types from schemas
- Define handler functions:
  ```typescript
  export async function handleCreate(
    req: ValidatedRequest<{ body: CreateBody }>,
  ): Promise<AppResponse<CreateResult>> {
    const body = req.validated.body;
    const result = await run(createWorkflow(body));

    return matchResponse(result, {
      onSuccess: (data) => createSuccessResponse(data),
      onFailure: (error) => createFailureResponse(error),
    });
  }
  ```

### 3. Routes (`src/routes/[domain]/routes.ts`)
- Import handlers
- Define routes with middleware:
  ```typescript
  router.post("/create", validate(createBodySchema), handleResult(handleCreate));
  router.get("/:id", auth, validate(idParamsSchema), handleResult(handleGet));
  ```

### 4. Register routes (`src/routes/index.ts`)
- If new domain, import and register:
  ```typescript
  import domainRoutes from "./domain/routes.js";
  router.use("/domain", domainRoutes);
  ```

## Merge Strategy
If domain routes exist, add new routes to existing router.

## Output
- Updated/new schemas, handlers, routes files
- Updated main router
- Design document update

## FCIS Principle
"HTTP layer is Imperative Shell - delegates to Functional Core workflows. Handlers import ONLY from barrel exports to enforce boundaries."

## Template Reference
Use `templates/handler.ts.tmpl`, `templates/route.ts.tmpl`, `templates/schema.zod.tmpl`.

## Example

**schemas.ts**:
```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const resetRequestSchema = z
  .object({
    email: z.string().email().openapi({
      example: "user@example.com",
      description: "User email address"
    }),
  })
  .openapi("ResetRequestBody");

export type ResetRequestBody = z.infer<typeof resetRequestSchema>;
```

**handlers.ts**:
```typescript
import { matchResponse } from "#lib/result/combinators";
import { run } from "#lib/result/index";
import { requestPasswordReset } from "#core/users/index.js"; // ⚠️ BARREL ONLY
import {
  createSuccessResponse,
  createFailureResponse,
  type AppResponse,
} from "#lib/types/response";
import type { ValidatedRequest } from "#middlewares/validate";
import type { ResetRequestBody } from "./schemas";
import type { ResetResult } from "#core/users/index.js"; // ⚠️ BARREL ONLY

export async function handleResetRequest(
  req: ValidatedRequest<{ body: ResetRequestBody }>
): Promise<AppResponse<ResetResult>> {
  const body = req.validated.body;
  const result = await run(requestPasswordReset(body));

  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse(data),
    onFailure: (error) => createFailureResponse(error),
  });
}
```

**routes.ts**:
```typescript
import { Router } from "express";
import { validate } from "#middlewares/validate";
import { handleResult } from "#middlewares/resultHandler";
import { handleResetRequest } from "./handlers.js";
import { resetRequestSchema } from "./schemas.js";

const router = Router();

router.post(
  "/reset-request",
  validate(resetRequestSchema),
  handleResult(handleResetRequest)
);

export default router;
```
