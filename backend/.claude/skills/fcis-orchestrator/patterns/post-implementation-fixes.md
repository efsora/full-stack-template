# Post-Implementation Fix Strategies

This document provides detailed strategies for automatically fixing common errors detected during the post-implementation checklist.

## Purpose

During the post-implementation checklist, the validator agent runs 4 critical checks. When failures occur, this guide provides actionable fix strategies that can be applied automatically.

---

## Lint Error Fixes

### Detecting Lint Errors

Run `npm run lint` and parse output for error patterns.

### Common Lint Errors and Fixes

#### 1. Formatting Errors (`prettier/prettier`)

**Detection**: Error message contains `prettier/prettier`

**Example**:
```
error: Replace `····` with `··` (prettier/prettier)
error: Delete `;` (prettier/prettier)
```

**Fix**:
- Run `npm run format`
- Re-run `npm run lint` to verify

**Implementation**:
```bash
npm run format
npm run lint
```

#### 2. Unused Imports

**Detection**: Error message contains `is defined but never used` or `'X' is declared but its value is never read`

**Example**:
```
error: 'Result' is defined but never used @typescript-eslint/no-unused-vars
```

**Fix**:
- Remove the unused import statement
- Use Read tool to get file content
- Use Edit tool to remove the unused import line

**Implementation**:
1. Read the file containing the error
2. Identify the unused import line
3. Edit file to remove that import

#### 3. Barrel Export Violations

**Detection**: Error in handler file importing directly from workflow file

**Example**:
```
error: Do not import from core modules directly. Use barrel exports.
```

**Fix**:
- Change direct import to barrel import
- Replace: `from "#core/users/create-user.workflow"`
- With: `from "#core/users/index.js"`

**Implementation**:
1. Read handler file
2. Find import statements from core modules
3. Replace with barrel imports using Edit tool

#### 4. Missing Semicolons

**Detection**: Error message contains `Missing semicolon`

**Fix**:
- Run `npm run lint:fix` (ESLint auto-fix handles this)
- Or manually add semicolons where missing

#### 5. Auto-Fixable ESLint Errors

**Detection**: Any ESLint error that can be auto-fixed

**Fix**:
- Run `npm run lint:fix`
- Re-run `npm run lint` to verify

---

## TypeScript Error Fixes

### Detecting Type Errors

Run `npm run type-check` and parse output for error patterns.

### Common Type Errors and Fixes

#### 1. Missing Imports

**Detection**: Error message contains `Cannot find name 'X'` or `'X' is not defined`

**Example**:
```
error TS2304: Cannot find name 'Result'.
```

**Fix**:
- Identify the missing type/function name
- Determine the correct import path based on naming:
  - `Result` → `import type { Result } from "#lib/result/types"`
  - `success`, `fail` → `import { success, fail } from "#lib/result/factories"`
  - `pipe` → `import { pipe } from "#lib/result/combinators"`
  - `command` → `import { command } from "#lib/result/factories"`
- Add import statement at top of file

**Implementation**:
1. Parse error to extract missing name
2. Use mapping table to determine import path
3. Read file
4. Add import at appropriate location using Edit tool

#### 2. Unused Variables

**Detection**: Error message contains `'X' is declared but its value is never read`

**Example**:
```
error TS6133: 'userId' is declared but its value is never read.
```

**Fix Option A**: Remove the variable if truly unused
**Fix Option B**: Prefix with underscore if intentionally unused (e.g., parameter in interface)

**Implementation**:
1. Read file
2. Identify if variable is a parameter or local variable
3. If parameter: Rename to `_userId`
4. If local: Remove declaration

#### 3. Type Mismatches

**Detection**: Error message contains `Type 'X' is not assignable to type 'Y'`

**Example**:
```
error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

**Fix**:
- Add null check or optional chaining
- Adjust type annotation to include `| null` or `| undefined`
- Add default value with `??` operator

**Implementation**:
1. Identify the type mismatch
2. Common fixes:
   - Add `| null` to type annotation
   - Add `| undefined` to type annotation
   - Use optional chaining: `obj?.property`
   - Use nullish coalescing: `value ?? defaultValue`

#### 4. Missing Return Types

**Detection**: Error message contains `Function lacks return type annotation`

**Example**:
```
error: Function lacks return type annotation and has an 'any' return type.
```

**Fix**:
- Infer return type from function body
- Add explicit return type annotation

**Implementation**:
1. Analyze function body to determine return type
2. Common patterns:
   - Workflows: `Result<OutputType>`
   - Operations: `Result<OutputType>`
   - Handlers: `Promise<AppResponse<ResultType>>`
3. Add return type using Edit tool

#### 5. Property Does Not Exist

**Detection**: Error message contains `Property 'X' does not exist on type 'Y'`

**Example**:
```
error TS2339: Property 'email' does not exist on type 'User'.
```

**Fix**:
- Check if property name is correct (typo)
- Add property to type definition
- Use type assertion if confident property exists

---

## Test Error Fixes

### Detecting Test Errors

Run `npm run test:run` and parse output for failure patterns.

### User Interaction Required

**Important**: Always ask user before fixing test failures, as tests encode business logic expectations.

### Common Test Errors (After User Approval)

#### 1. Expectation Mismatches

**Detection**: Error message contains `Expected X but received Y`

**Example**:
```
AssertionError: expected 'SUCCESS' to equal 'Success'
```

**Fix** (after user approval):
- Update test expectation to match actual output
- Or fix code to produce expected output (context dependent)

**Implementation**:
1. Show user the mismatch
2. Ask: "Should I update test expectation to 'Success'?"
3. If yes: Edit test file to update expectation

#### 2. Missing Test Data

**Detection**: Error message contains `Cannot read property of undefined` or `null is not an object`

**Example**:
```
TypeError: Cannot read property 'id' of undefined
```

**Fix** (after user approval):
- Add missing mock data in test setup
- Ensure test fixtures are complete

#### 3. API Changes

**Detection**: Error message about wrong number of arguments or missing parameters

**Example**:
```
Expected 2 arguments, but got 1.
```

**Fix** (after user approval):
- Update test calls to match new API signature
- Add missing parameters with appropriate test values

---

## Build Error Fixes

### Detecting Build Errors

Run `npm run build` and parse output for error patterns.

### Common Build Errors and Fixes

#### 1. Import Path Issues

**Detection**: Error message contains `Cannot find module` or `Module not found`

**Example**:
```
error: Cannot find module '#core/transactions/index.js'
```

**Fix**:
- Check if file exists at expected path
- Fix import path (relative vs absolute)
- Ensure barrel file exports what's being imported

**Implementation**:
1. Verify file exists using Read tool
2. If missing: Check correct path
3. Update import statement to correct path

#### 2. Missing Exports from Barrel

**Detection**: Build error about module not exporting requested name

**Example**:
```
error: Module '"#core/transactions/index.js"' has no exported member 'getTransactionHistory'.
```

**Fix**:
- Read barrel file (`src/core/[domain]/index.ts`)
- Add missing export statement
- Verify the workflow/type file exists and exports the member

**Implementation**:
1. Read barrel file
2. Check if export exists
3. If missing: Add export statement
4. Format: `export { getTransactionHistory } from "./get-transaction-history.workflow.js"`

#### 3. OpenAPI Generation Errors

**Detection**: Error during OpenAPI spec generation

**Example**:
```
error: Invalid schema at /api/v1/transactions: Property 'example' is not allowed
```

**Fix**:
- Read Zod schema file
- Remove invalid `.example()` calls
- Use `.openapi({ example: "value" })` instead

**Implementation**:
1. Read schema file with error
2. Find `.example()` usage
3. Replace with `.openapi({ example: "value" })`

#### 4. Missing Files

**Detection**: Error about file not found during build

**Example**:
```
error: Could not find file: 'src/core/transactions/types/outputs.ts'
```

**Fix**:
- Verify file should exist
- Check if file was created by previous agents
- Create missing file with appropriate content if needed

---

## Fix Application Workflow

### General Pattern

For each type of error:

1. **Detect**: Parse command output to identify error type
2. **Analyze**: Understand the root cause
3. **Fix**: Apply appropriate fix strategy
4. **Log**: Record what was fixed in design document
5. **Retry**: Re-run all checks from beginning

### Logging Format

When applying fixes, log in design document:

```markdown
**Attempt N**:
- Step X ([Check Name]): ❌ Failed - [error count] errors
  - Fixed: [Description of fix applied]
  - Fixed: [Another fix]
  - Retrying all checks...
```

### Priority of Fixes

When multiple errors detected:

1. **Formatting** - Always fix first (affects lint results)
2. **Imports** - Fix missing/unused imports next
3. **Types** - Fix type errors after imports correct
4. **Logic** - Fix business logic issues last

### When Auto-Fix Fails

If automatic fix strategies don't resolve the issue after 3 attempts:

1. Document the specific error
2. Provide manual fix guidance
3. Mark check as failed in design document
4. Recommend user intervention

---

## Error Pattern Mapping

### Lint → Fix Mapping

| Error Pattern | Fix Strategy |
|---------------|--------------|
| `prettier/prettier` | Run `npm run format` |
| `no-unused-vars` | Remove unused imports/variables |
| `Missing semicolon` | Run `npm run lint:fix` |
| Direct core import | Change to barrel import |
| Any auto-fixable | Run `npm run lint:fix` |

### TypeScript → Fix Mapping

| Error Pattern | Fix Strategy |
|---------------|--------------|
| `Cannot find name` | Add missing import |
| `declared but never read` | Remove or prefix with `_` |
| `not assignable` | Adjust type annotation |
| `lacks return type` | Infer and add return type |
| `Property does not exist` | Fix typo or add property |

### Build → Fix Mapping

| Error Pattern | Fix Strategy |
|---------------|--------------|
| `Cannot find module` | Fix import path |
| `has no exported member` | Add export to barrel |
| OpenAPI `not allowed` | Fix Zod schema syntax |
| `Could not find file` | Create missing file |

---

## Example Fix Sequences

### Example 1: Format + Lint Fix

**Error**:
```
15:10  error  Replace `····` with `··`  prettier/prettier
```

**Fix Sequence**:
1. Run `npm run format`
2. Re-run `npm run lint`
3. Log: "Applied Prettier formatting, fixed 15 errors"

### Example 2: Missing Import Fix

**Error**:
```
src/core/transactions/get-history.workflow.ts(15,10): error TS2304: Cannot find name 'pipe'.
```

**Fix Sequence**:
1. Parse error: missing `pipe` at line 15
2. Determine import: `import { pipe } from "#lib/result/combinators"`
3. Read file
4. Add import at top
5. Log: "Added missing import for 'pipe' in get-history.workflow.ts"
6. Retry all checks

### Example 3: Barrel Export Fix

**Error**:
```
src/routes/transactions/handlers.ts(3,10): Module '"#core/transactions/index.js"' has no exported member 'getTransactionHistory'.
```

**Fix Sequence**:
1. Read `src/core/transactions/index.ts`
2. Check if `getTransactionHistory` is exported
3. If not: Add `export { getTransactionHistory } from "./get-transaction-history.workflow.js"`
4. Log: "Added missing barrel export for getTransactionHistory"
5. Retry all checks

---

## Best Practices

1. **Always run format first** - Formatting changes affect lint results
2. **Fix imports before types** - Type errors often caused by missing imports
3. **Ask user for test fixes** - Tests encode business logic, don't assume
4. **Log every fix** - Full traceability in design document
5. **Retry from beginning** - Ensures fixes don't break previous checks
6. **Limit retries** - Max 10 attempts to prevent infinite loops
7. **Provide context** - Show errors to user when asking for guidance

---

## Integration with Validator Agent

The validator agent uses these strategies during the post-implementation checklist:

1. Runs check
2. If fails: Analyzes error output
3. Identifies error pattern from this guide
4. Applies appropriate fix strategy
5. Logs fix in design document
6. Retries all checks

This ensures systematic, consistent error resolution across all generated code.
