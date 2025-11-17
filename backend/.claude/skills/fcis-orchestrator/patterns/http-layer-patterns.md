# HTTP Layer Code Patterns

This document defines code quality patterns for the HTTP layer (Imperative Shell - API Layer) including routes, handlers, Zod schemas, and OpenAPI registrations.

## Pattern Categories

Patterns are categorized by severity:
- **CRITICAL** (Blocking): Deprecated APIs, security issues - Must be fixed
- **IMPORTANT** (Warning): Best practices, maintainability - Warn, allow with acknowledgment
- **STYLE** (Info): Preferences, organization - Info only

---

## Zod Schema Patterns

### CRITICAL: Zod Deprecated APIs

**Pattern ID**: ZODB001-ZODB010

**Issue**: Zod v4 changed API, some convenience methods deprecated.

**Deprecated Patterns**:

**ZODB001: UUID Type**
```typescript
// ❌ DEPRECATED (Zod v3)
id: z.string().uuid()

// ✅ CORRECT (Zod v4+)
id: z.uuid()
```

**Detection**: `z\.string\(\)\.uuid\(\)`
**Fix**: Auto-replace with `z.uuid()`
**Severity**: CRITICAL

---

**ZODB002: Date/DateTime (Check if deprecated)**
```typescript
// Check Zod v4 docs - datetime might have changed
// If deprecated:
// ❌ z.string().datetime()
// ✅ z.datetime() or z.coerce.date()
```

**Detection**: `z\.string\(\)\.datetime\(\)`
**Fix**: Replace based on Zod v4 API
**Severity**: CRITICAL (if deprecated)

---

**Other Potential Deprecations** (verify against Zod v4 docs):
- `z.string().email()` - Likely still valid
- `z.string().url()` - Likely still valid
- `z.string().cuid()` - Check if direct `z.cuid()` exists
- `z.string().cuid2()` - Check if direct `z.cuid2()` exists

**Action**: Validate against current Zod version in package.json and update patterns accordingly.

### IMPORTANT: OpenAPI Metadata

**Pattern**: All schemas should have OpenAPI metadata

```typescript
// ❌ MISSING OpenAPI metadata
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

// ✅ WITH OpenAPI metadata
export const createUserSchema = z.object({
  email: z.string().email().openapi({ example: "user@example.com" }),
  name: z.string().optional().openapi({ example: "John Doe" })
}).openapi("CreateUserRequest");
```

**Detection**: Schemas without `.openapi()` calls
**Fix**: Report with suggestion
**Severity**: IMPORTANT

---

## Handler Patterns

### IMPORTANT: Explicit Field Returns

**Pattern ID**: HTTP001

**Issue**: Implicit data returns make API response unclear and may expose unintended fields.

**Anti-Pattern**:
```typescript
// ❌ IMPLICIT (what fields are returned?)
export async function handleGetUser(
  req: ValidatedRequest<{ params: IdParams }>
): Promise<AppResponse<UserData>> {
  const { id } = req.validated.params;
  const result = await run(getUserById(id));

  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse(data), // Implicit
    onFailure: (error) => createFailureResponse(error),
  });
}
```

**Correct Pattern**:
```typescript
// ✅ EXPLICIT (clear what API exposes)
export async function handleGetUser(
  req: ValidatedRequest<{ params: IdParams }>
): Promise<AppResponse<UserData>> {
  const { id } = req.validated.params;
  const result = await run(getUserById(id));

  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse({
      id: data.id,
      email: data.email,
      name: data.name
      // Explicit field mapping - clear what's exposed
    }),
    onFailure: (error) => createFailureResponse(error),
  });
}
```

**Why This Matters**:
1. **Security**: Prevents accidental exposure of sensitive fields (hashedPassword, internal IDs)
2. **Documentation**: Clear what API returns without reading workflow code
3. **API Contract**: Explicit fields make breaking changes obvious
4. **Type Safety**: Catches if data type changes unexpectedly

**Detection**: `createSuccessResponse\([a-z][a-z]*\)` (single variable passed)
**Fix**: Report with suggestion based on data type
**Severity**: IMPORTANT

**Exception**: If data is explicitly typed with only public fields, implicit return acceptable:
```typescript
// ✅ ACCEPTABLE (PublicUserData has only safe fields)
const data: PublicUserData = { id: user.id, email: user.email };
return createSuccessResponse(data); // Explicit type ensures safety
```

---

### IMPORTANT: Proper Error Handling

**Pattern**: All handlers should use matchResponse for Result handling

```typescript
// ✅ CORRECT
return matchResponse(result, {
  onSuccess: (data) => createSuccessResponse(data),
  onFailure: (error) => createFailureResponse(error),
});

// ❌ INCORRECT (manual matching)
if (result.status === "Success") {
  return createSuccessResponse(result.value);
} else {
  return createFailureResponse(result.error);
}
```

**Detection**: Handlers not using matchResponse
**Fix**: Report
**Severity**: IMPORTANT

---

## Route Patterns

### STYLE: Consistent Route Organization

**Pattern**: Routes grouped by resource, ordered by HTTP method

```typescript
// ✅ CORRECT (organized)
router.post("/users", validate(createUserSchema), handleResult(handleCreateUser));
router.get("/users", validate(listUsersSchema), handleResult(handleListUsers));
router.get("/users/:id", validate(idParamsSchema), handleResult(handleGetUser));
router.patch("/users/:id", validate(updateUserSchema, idParamsSchema), handleResult(handleUpdateUser));
router.delete("/users/:id", validate(idParamsSchema), handleResult(handleDeleteUser));
```

**Detection**: Manual review (complex to automate)
**Fix**: Report if out of order
**Severity**: STYLE

---

### IMPORTANT: Validation Middleware

**Pattern**: All routes must use validate() middleware

```typescript
// ✅ CORRECT (with validation)
router.post("/users", validate(createUserSchema), handleResult(handleCreateUser));

// ❌ INCORRECT (missing validation)
router.post("/users", handleResult(handleCreateUser));
```

**Detection**: Routes without `validate()`
**Fix**: Report
**Severity**: IMPORTANT

---

## OpenAPI Patterns

### IMPORTANT: Complete Path Registration

**Pattern**: All routes must have corresponding OpenAPI registration

```typescript
// routes/users/routes.ts
router.post("/users", validate(createUserSchema), handleResult(handleCreateUser));

// openapi/paths/users.ts - MUST EXIST
registry.registerPath({
  method: "post",
  path: "/api/v1/users",
  summary: "Create user",
  // ... complete registration
});
```

**Detection**: Compare routes to OpenAPI registrations
**Fix**: Report missing registrations
**Severity**: IMPORTANT

---

## Summary

**Critical Patterns** (Blocking):
- ZODB001: Zod deprecated UUID API (auto-fix)
- [Future: Security patterns, breaking changes]

**Important Patterns** (Warning):
- HTTP001: Handler explicit field returns (report)
- Handler error handling with matchResponse
- Route validation middleware usage
- OpenAPI path completeness

**Style Patterns** (Info):
- Route organization and ordering
- Consistent naming conventions
- Comment quality

These patterns ensure HTTP layer code is:
- ✅ Using current APIs (not deprecated)
- ✅ Secure (explicit field exposure)
- ✅ Well-documented (OpenAPI complete)
- ✅ Type-safe (proper validation)
- ✅ Maintainable (consistent patterns)
