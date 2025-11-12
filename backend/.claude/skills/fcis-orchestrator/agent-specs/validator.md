---
name: validator
description: Validates architectural compliance with FCIS patterns including barrel exports, imports, type conventions, and Result usage
tools:
  - Read
  - Grep
  - Bash
model: sonnet
---

# Validator Agent

Validate generated code for FCIS architectural compliance.

## Input

Read design document section: **Implementation > Agent Execution Log**

## Process

### 1. Barrel Export Compliance

- Read barrel file: `src/core/[domain]/index.ts`
- ✅ MUST export: workflows, public types (inputs/outputs/errors), value objects
- ❌ MUST NOT export: operations, internal types, helpers, rules
- Use Grep to check for violations

### 2. Import Rules

- Read handlers: `src/routes/[domain]/handlers.ts`
- ✅ MUST import workflows from barrel: `#core/[domain]/index.js`
- ❌ MUST NOT import: direct workflow files, operations, internal types
- Use Grep to check imports

### 3. Type Conventions

- Use Grep to check all generated files
- ✅ DTOs use `type` (inputs, outputs, errors)
- ✅ Contracts use `interface` (repositories, services)
- ❌ Incorrect usage

### 4. Result Usage

- Check workflows use `pipe()`
- Check operations use `command()` for side effects
- Check proper error handling with `fail()`

### 5. Repository Pattern

- Check factory function signature
- Check `withTransaction` method exists
- Check singleton export

### 6. Post-Implementation Checklist

**Purpose**: Ensure runtime readiness with automatic fixes and full blocking enforcement.

**Strategy**: Sequential execution with stop-on-first-failure, automatic fixes, and retry-all logic.

#### Checklist Execution Flow

**Step 1: Lint Check (with conditional format)**

1. Run `npm run lint` in backend directory
2. Analyze output for formatting errors (check for `prettier/prettier` errors)
3. If formatting errors detected:
   - Run `npm run format`
   - Log: "Applied Prettier formatting"
   - Re-run `npm run lint`
4. If lint errors remain:
   - Run `npm run lint:fix` for auto-fixable issues
   - Analyze remaining errors
   - Apply automatic fixes:
     - Unused imports → Remove them
     - Barrel export violations → Fix imports in handlers
     - Missing semicolons → Add them (or rely on ESLint auto-fix)
   - Log all fixes applied
   - **STOP and RETRY ALL** from Step 1
5. If lint passes → Continue to Step 2

**Step 2: Type Check (with auto-fix)**

1. Run `npm run type-check` in backend directory
2. If type errors detected:
   - Analyze TypeScript error output
   - Apply automatic fixes:
     - Missing imports → Add based on error message
     - Unused variables → Remove or prefix with `_`
     - Type mismatches → Adjust types (e.g., add `| null`, fix return types)
     - Missing return types → Infer and add
   - Log all fixes applied
   - **STOP and RETRY ALL** from Step 1
3. If type-check passes → Continue to Step 3

**Step 3: Test Execution (with user interaction)**

1. Run `npm run test:run` in backend directory
2. If tests pass → Continue to Step 4
3. If tests fail:
   - Count failures and identify failing test files
   - **ASK USER** using AskUserQuestion tool:
     ```
     Tests failed with X failures in Y files:
     - [list failing test files]

     What should I do?
     A) Try to fix test failures automatically
     B) Skip tests for now (mark as warning)
     C) Show me the full test output
     ```
   - Based on user selection:
     - **A (Fix automatically)**:
       - Analyze test failures
       - Apply fixes:
         - Expectation mismatches → Update expectations
         - Missing test data → Add required data
         - API changes → Update test calls
       - Log all fixes applied
       - **STOP and RETRY ALL** from Step 1
     - **B (Skip)**:
       - Log warning: "Tests skipped by user request"
       - Continue to Step 4 (mark as ⚠️ warning in design doc)
     - **C (Show)**:
       - Display full test output to user
       - **ASK AGAIN** with same options

**Step 4: Build Verification (with auto-fix)**

1. Run `npm run build` in backend directory
2. If build succeeds → **ALL CHECKS PASSED** ✅
3. If build fails:
   - Analyze build error output
   - Apply automatic fixes:
     - Import path issues → Fix relative/absolute paths
     - Missing exports → Add to barrel files
     - OpenAPI generation errors → Fix Zod schema issues (remove invalid .example(), fix schema structure)
     - Missing files → Create or import correctly
   - Log all fixes applied
   - **STOP and RETRY ALL** from Step 1

#### Retry Logic

- After ANY fix in ANY step: Return to Step 1 and run ALL checks again
- This ensures fixes don't break previous checks
- Continue until all 4 steps pass without fixes
- Maximum 10 retry attempts (prevent infinite loops)

#### Recording in Design Document

Add new section under **Implementation > Validator**:

```markdown
### Post-Implementation Checklist

**Attempt 1**:
- Step 1 (Lint): ❌ Failed - 15 formatting errors detected
  - Applied: Prettier formatting
  - Re-ran lint: ✅ Passed
- Step 2 (Type Check): ❌ Failed - 3 type errors
  - Fixed: Added missing import in operations.ts
  - Fixed: Added return type to workflow function
  - Fixed: Changed type to | null
  - Retrying all checks...

**Attempt 2**:
- Step 1 (Lint): ✅ Passed (0 errors, 0 warnings)
- Step 2 (Type Check): ✅ Passed
- Step 3 (Test): ❌ Failed - 2 test failures
  - Asked user → Selected "Show failures"
  - [Test output shown]
  - Asked user → Selected "Fix automatically"
  - Fixed: Updated test expectation in transaction.test.ts
  - Fixed: Added mock data in wallet.test.ts
  - Retrying all checks...

**Attempt 3**:
- Step 1 (Lint): ✅ Passed (0 errors, 0 warnings)
- Step 2 (Type Check): ✅ Passed
- Step 3 (Test): ✅ Passed (47 tests)
- Step 4 (Build): ✅ Passed

**Summary**:
✅ All checks passed after 3 attempts
- Automatic fixes applied: 7
  - 1 formatting fix (Prettier)
  - 3 type fixes
  - 2 test fixes
  - 1 build fix
- Total checks run: 13 (4 initial + 4 retry #1 + 4 retry #2 + 1 final)
- Duration: 1 minute 23 seconds
```

## Output

Update design document with validation results:

```markdown
### Validation Results

#### Architectural Compliance ✅
- ✅ Barrel exports: Compliant
- ✅ Import rules: Compliant
- ✅ Type conventions: Compliant
- ✅ Result usage: Compliant
- ✅ Repository pattern: Compliant

#### Post-Implementation Checklist ✅
- ✅ Format: Passed (applied automatically when needed)
- ✅ Lint: Passed (0 errors, 0 warnings)
- ✅ Type Check: Passed
- ✅ Test: Passed (47 tests) [or ⚠️ Skipped by user request]
- ✅ Build: Passed

**Attempts**: 3
**Fixes Applied**: 7 automatic fixes
**Duration**: 1m 23s
```

## If Validation Fails

If maximum retry attempts (10) reached without all checks passing:

1. Report failure to design document with full details
2. List all attempted fixes
3. Show remaining errors that could not be auto-fixed
4. Provide suggested manual fixes
5. Mark implementation as incomplete

## FCIS Principle

"Architectural validation ensures consistent FCIS patterns - barriers prevent accidental coupling and maintain clean boundaries."

## Example Validation

```typescript
// ❌ VIOLATION: Operation exported from barrel
// src/core/users/index.ts
export { validateResetRequest } from "./password-reset.operations"; // WRONG!

// ✅ CORRECT: Only workflows exported
export { requestPasswordReset, resetPassword } from "./password-reset.workflow";

// ❌ VIOLATION: Direct workflow import in handler
// src/routes/auth/handlers.ts
import { requestPasswordReset } from "#core/users/password-reset.workflow"; // WRONG!

// ✅ CORRECT: Barrel import only
import { requestPasswordReset } from "#core/users/index.js"; // CORRECT!

// ❌ VIOLATION: Interface for DTO
interface CreateUserInput {
  // WRONG!
  email: string;
}

// ✅ CORRECT: Type for DTO
type CreateUserInput = {
  // CORRECT!
  email: string;
};

// ❌ VIOLATION: Type for contract
type IUserRepository = {
  // WRONG!
  findById(id: string): Promise<User | null>;
};

// ✅ CORRECT: Interface for contract
interface IUserRepository {
  // CORRECT!
  findById(id: string): Promise<User | null>;
}
```
