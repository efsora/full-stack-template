# Pattern Detection Registry

This document catalogs all code pattern checks in a structured format, making it easy to add new patterns over time.

## Purpose

The pattern detection registry provides:
- Single source of truth for all pattern checks
- Structured format for easy addition of new patterns
- Clear categorization by layer and severity
- Detection and fix strategies for each pattern

---

## Pattern Format

Each pattern documented as:

```markdown
## Pattern: [ID] - [Name]

**ID**: [Unique identifier]
**Name**: [Pattern name]
**Layer**: [Core / Infrastructure / HTTP]
**Severity**: [Critical / Important / Style]
**Anti-Pattern**: [What to avoid]
**Correct Pattern**: [What to use instead]
**Detection**: [Grep pattern / AST check / Script]
**Fix Strategy**: [Auto-fix / Report / Manual]
**Version**: [When introduced / deprecated]
**Reference**: [Documentation link if applicable]

**Example**:
[Code example showing before/after]
```

---

## Critical Patterns (Blocking)

### Pattern: ZODB001 - Deprecated UUID API

**ID**: ZODB001
**Name**: Zod string().uuid() deprecated
**Layer**: HTTP (Zod schemas)
**Severity**: Critical (Blocking)
**Anti-Pattern**: `z.string().uuid()`
**Correct Pattern**: `z.uuid()`
**Detection**: Grep pattern `z\.string\(\)\.uuid\(\)`
**Fix Strategy**: Auto-fix (safe replacement)
**Zod Version**: Deprecated in v4.0.0
**Reference**: https://zod.dev (check migration guide)

**Example**:
```typescript
// ❌ BEFORE (Zod v3 style)
export const idParamSchema = z.object({
  id: z.string().uuid()
});

// ✅ AFTER (Zod v4 style)
export const idParamSchema = z.object({
  id: z.uuid()
});
```

**Fix Algorithm**:
1. Grep: `grep -rn "z\.string\(\)\.uuid\(\)" src/routes/`
2. Read file with violation
3. Replace: `z.string().uuid()` → `z.uuid()`
4. Save file
5. Re-validate

---

### Pattern: ZODB002 - Check Other Zod Deprecations

**ID**: ZODB002-ZODB010 (Reserved)
**Name**: Other potential Zod deprecations
**Layer**: HTTP (Zod schemas)
**Severity**: Critical (if deprecated)
**Action Required**: Check Zod v4 documentation for:
- `z.string().cuid()` → `z.cuid()` (if exists)
- `z.string().email()` → Likely still valid
- `z.string().url()` → Likely still valid
- `z.string().datetime()` → Check if `z.datetime()` exists

**Note**: Validate against current Zod version and add specific patterns as needed.

---

## Important Patterns (Warning)

### Pattern: HTTP001 - Handler Response Explicitness

**ID**: HTTP001
**Name**: Handler implicit data returns
**Layer**: HTTP (Request handlers)
**Severity**: Important (Warning)
**Anti-Pattern**: `createSuccessResponse(data)` (implicit)
**Correct Pattern**: `createSuccessResponse({ id: data.id, email: data.email })` (explicit)
**Detection**: Grep pattern `createSuccessResponse\([a-z][a-z]*\)`
**Fix Strategy**: Report with suggestion (structural, needs human review)
**Rationale**: Security (prevent accidental field exposure), API clarity

**Example**:
```typescript
// ❌ BEFORE (implicit - not clear what's returned)
export async function handleGetUser(req: ValidatedRequest<{ params: IdParams }>): Promise<AppResponse<UserData>> {
  const result = await run(getUserById(req.params.id));
  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse(data),
    onFailure: (error) => createFailureResponse(error),
  });
}

// ✅ AFTER (explicit - clear API contract)
export async function handleGetUser(req: ValidatedRequest<{ params: IdParams }>): Promise<AppResponse<UserData>> {
  const result = await run(getUserById(req.params.id));
  return matchResponse(result, {
    onSuccess: (data) => createSuccessResponse({
      id: data.id,
      email: data.email,
      name: data.name
    }),
    onFailure: (error) => createFailureResponse(error),
  });
}
```

**Report Format**:
```
⚠️ Important: Handler Response Explicitness (HTTP001)

File: src/routes/users/handlers.ts:25
Issue: Implicit data return

Suggestion: Use explicit field mapping
Current: createSuccessResponse(data)
Suggested: createSuccessResponse({ id: data.id, email: data.email, name: data.name })

Why: Prevents accidental exposure of sensitive fields (hashedPassword, etc.)
```

---

### Pattern: INFR001 - Use Drizzle Schema Types

**ID**: INFR001
**Name**: Infrastructure inline types
**Layer**: Infrastructure (Repositories)
**Severity**: Important (Warning)
**Anti-Pattern**: `Promise<{ id: string; email: string }>`
**Correct Pattern**: `Promise<User | null>` (Drizzle schema type)
**Detection**: Grep pattern `Promise<{ [a-z]` in `src/infrastructure/repositories/`
**Fix Strategy**: Report with suggestion (requires import + type change)
**Rationale**: Single source of truth, maintainability

**Example**:
```typescript
// ❌ BEFORE (inline type)
export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string): Promise<{ id: string; email: string; name: string | null } | null> => {
      return dbInstance.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
    }
  };
}

// ✅ AFTER (schema type)
import type { User } from "#db/schema";

export function createUserRepository(dbInstance: typeof db) {
  return {
    findById: (id: string): Promise<User | null> => {
      return dbInstance.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
    }
  };
}
```

**Report Format**:
```
⚠️ Important: Use Drizzle Schema Types (INFR001)

File: src/infrastructure/repositories/drizzle/UserRepository.ts:12
Issue: Inline type instead of schema type

Current: Promise<{ id: string; email: string } | null>
Suggested:
  - Add import: import type { User } from "#db/schema";
  - Change type: Promise<User | null>

Why: Schema types auto-update when database schema changes
```

---

## Style Patterns (Info Only)

### Pattern: CORE001 - Type File Organization

**ID**: CORE001
**Name**: Type file organization
**Layer**: Core (Type definitions)
**Severity**: Style (Info)
**Pattern**: Organize types in inputs.ts, outputs.ts, errors.ts, internal.ts
**Detection**: Manual review
**Fix Strategy**: Report if inconsistent
**Rationale**: Consistency with existing domains

---

### Pattern: HTTP002 - Route Organization

**ID**: HTTP002
**Name**: Route method ordering
**Layer**: HTTP (Routes)
**Severity**: Style (Info)
**Pattern**: Routes ordered by HTTP method (POST, GET, PATCH, DELETE)
**Detection**: Manual review
**Fix Strategy**: Report
**Rationale**: Consistency and readability

---

## Adding New Patterns

To add a new pattern to the registry:

### Step 1: Document Pattern

Choose unique ID based on layer:
- Core: CORE001-CORE999
- Infrastructure: INFR001-INFR999
- HTTP: HTTP001-HTTP999
- Zod-specific: ZODB001-ZODB999

### Step 2: Categorize

Assign severity:
- **Critical**: Deprecated APIs, type safety violations, security issues
- **Important**: Best practices, maintainability, accidental bugs
- **Style**: Preferences, organization, readability

### Step 3: Define Detection

Choose detection method:
- Grep pattern for simple string matching
- AST analysis for complex structural patterns
- Manual review for subjective quality

### Step 4: Define Fix Strategy

Choose fix approach:
- Auto-fix: Safe replacements (API deprecations, simple refactors)
- Report: Structural changes, human judgment needed
- Manual: Complex refactoring required

### Step 5: Add to Validator

Update `validator.md` Step 6.5 with new pattern check.

### Step 6: Add to Layer Pattern Doc

Document in appropriate layer file (core/infrastructure/http-layer-patterns.md).

---

## Pattern Catalog Summary

**Current Patterns**:

**Critical (Blocking)**: 1
- ZODB001: Zod UUID deprecated API

**Important (Warning)**: 2
- HTTP001: Handler response explicitness
- INFR001: Infrastructure inline types

**Style (Info)**: 2
- CORE001: Type file organization
- HTTP002: Route organization

**Reserved for Future**:
- ZODB002-ZODB010: Other Zod deprecations
- HTTP003-HTTP010: Other HTTP patterns
- INFR002-INFR010: Other infrastructure patterns
- CORE002-CORE010: Other core patterns

**Total Patterns**: 3 enforced, many reserved for future

---

## Extensibility Examples

### Example 1: Adding New Zod Deprecation

If Zod v5 deprecates `z.string().email()`:

1. Add pattern: ZODB002 - Deprecated Email API
2. Severity: Critical
3. Detection: `z\.string\(\)\.email\(\)`
4. Fix: Replace with `z.email()` (if new API exists)
5. Add to validator Step 6.5
6. Add to http-layer-patterns.md

### Example 2: Adding Core Pattern

If we want to enforce operation naming:

1. Add pattern: CORE002 - Operation Naming Convention
2. Severity: Important
3. Detection: Grep for operation names not matching pattern
4. Fix: Report
5. Add to validator Step 6.5
6. Add to core-layer-patterns.md

### Example 3: Adding Infrastructure Pattern

If we want to enforce service timeout configuration:

1. Add pattern: INFR002 - Service Timeout Required
2. Severity: Important
3. Detection: fetch calls without timeout
4. Fix: Report with suggestion
5. Add to validator Step 6.5
6. Add to infrastructure-patterns.md

---

## Integration with Validator

The validator (Step 6.5) reads this registry to:
1. Know which patterns to check
2. Understand severity (block vs warn vs info)
3. Apply appropriate detection method
4. Use correct fix strategy
5. Generate proper reports

This registry makes adding new patterns a straightforward process without changing validator logic.
