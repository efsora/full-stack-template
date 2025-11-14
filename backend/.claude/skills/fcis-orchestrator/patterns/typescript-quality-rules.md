# TypeScript Code Quality Rules

This document defines TypeScript code quality rules that all FCIS-generated code must follow. These rules ensure type safety, maintainability, and consistency across the codebase.

## The 4 Core Rules

### Rule 1: Never Use `any` Type

**Principle**: The `any` type defeats TypeScript's type system and should never be used.

**Violations**:
```typescript
// ❌ Explicit any
const user: any = getUser();
function process(data: any) { }
const items: Array<any> = [];
const map: Record<string, any> = {};

// ❌ Implicit any (no type annotation)
function getValue(key) { } // Parameter has implicit any
const result = JSON.parse(data); // Returns any
```

**Correct Alternatives**:
```typescript
// ✅ Proper types
const user: User = getUser();
function process(data: ProcessInput) { }
const items: Array<Transaction> = [];
const map: Record<string, string> = {};

// ✅ Use unknown for truly unknown values
function getValue(key: string): unknown { }
const result: unknown = JSON.parse(data);
// Then validate: const validated = validateData(result);
```

**Why This Rule**:
- Type safety: Catch errors at compile time
- IDE support: Autocomplete, refactoring, navigation
- Documentation: Types serve as inline documentation
- Refactoring confidence: Changes won't break unexpectedly

**Common Violations and Fixes**:

**Violation**: `any` in function parameters
```typescript
// ❌ BAD
function createUser(input: any) {
  return { id: input.id, email: input.email };
}

// ✅ GOOD
function createUser(input: CreateUserInput) {
  return { id: input.id, email: input.email };
}
```

**Violation**: `any` in return types
```typescript
// ❌ BAD
function getUser(): any {
  return userRepository.findById(id);
}

// ✅ GOOD
function getUser(): Promise<User | null> {
  return userRepository.findById(id);
}
```

**Violation**: `any` in arrays or objects
```typescript
// ❌ BAD
const errors: any[] = [];
const config: Record<string, any> = {};

// ✅ GOOD
const errors: AppError[] = [];
const config: Record<string, string | number> = {};
```

---

### Rule 2: All Values Have Proper Types

**Principle**: Every variable, parameter, and return value should have an explicit type annotation when the type is not obvious from context.

**When Type Annotation is Required**:
- ✅ Function parameters (always)
- ✅ Function return types (always)
- ✅ Variables with non-obvious types
- ✅ Object properties in type definitions
- ✅ Array and object literals that aren't immediately assigned

**When Type Annotation is Optional** (TypeScript can infer):
- ✅ Simple variable assignments: `const x = 5` (clearly number)
- ✅ Object literals with known shape: `const user = { id: '123', name: 'John' }`
- ✅ Array literals with known elements: `const nums = [1, 2, 3]`

**Examples**:

**Function Parameters** (always type):
```typescript
// ❌ BAD - No parameter types
function createUser(email, password, name) {
  // ...
}

// ✅ GOOD - Explicit parameter types
function createUser(
  email: string,
  password: string,
  name?: string
): Result<CreateUserResult> {
  // ...
}
```

**Function Return Types** (always explicit):
```typescript
// ❌ BAD - No return type
function getUserById(id: string) {
  return pipe(validateId(id), findUser);
}

// ✅ GOOD - Explicit return type
function getUserById(id: string): Result<UserData> {
  return pipe(validateId(id), findUser);
}
```

**Variables with Non-Obvious Types**:
```typescript
// ❌ BAD - Type not obvious
const result = await someComplexOperation();

// ✅ GOOD - Explicit type
const result: OperationResult = await someComplexOperation();

// ✅ ALSO GOOD - Type obvious from context
const count = 5; // Clearly number
const name = "John"; // Clearly string
```

**Type Definitions** (all properties typed):
```typescript
// ❌ BAD - Missing types
export type CreateUserInput = {
  email; // No type
  password; // No type
  name?; // No type
};

// ✅ GOOD - All properties typed
export type CreateUserInput = {
  email: string;
  password: string;
  name?: string;
};
```

---

### Rule 3: Minimal Type Casting

**Principle**: Avoid type casting (`as Type`) unless absolutely necessary. Prefer proper typing, type guards, and validation.

**When Type Casting is Acceptable**:

**1. After Runtime Validation**:
```typescript
// ✅ Acceptable - After Zod validation
const input = requestBodySchema.parse(req.body);
const validated = input as ValidatedInput; // Zod confirmed the shape

// ✅ Acceptable - After custom validation
if (isValidUser(data)) {
  const user = data as User; // Validation confirmed type
}
```

**2. Narrowing from `unknown`**:
```typescript
// ✅ Acceptable - External data validated
const json: unknown = JSON.parse(externalData);
const validated = validateApiResponse(json);
const response = validated as ApiResponse; // After validation
```

**3. Type Guard Results**:
```typescript
// ✅ Acceptable - Type guard confirmed
function isTransaction(obj: unknown): obj is Transaction {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

if (isTransaction(record)) {
  const transaction = record as Transaction; // Type guard confirmed
}
```

**When Type Casting is NOT Acceptable**:

**1. Convenience Casting**:
```typescript
// ❌ BAD - Lazy casting
const user = data as User; // Should properly type 'data' instead

// ✅ GOOD - Proper typing
const user: User = await userRepository.findById(id);
```

**2. Suppressing Type Errors**:
```typescript
// ❌ BAD - Hiding type problems
const result = incorrectType as CorrectType; // Just to compile

// ✅ GOOD - Fix the actual type issue
const result: CorrectType = properlyTypedValue;
```

**3. Avoiding Proper Types**:
```typescript
// ❌ BAD - Should define response type
return apiCall() as MyType;

// ✅ GOOD - Define proper return type
async function apiCall(): Promise<MyType> {
  // ...
}
```

**Required: Justification Comments**

All type casts MUST have justification comments:
```typescript
// ✅ GOOD - Justified casting
const validated = input as ValidatedInput; // After Zod schema validation

// ✅ GOOD - Explained necessity
const data = json as ApiResponse; // External API validated with runtime checks

// ❌ BAD - No justification
const user = obj as User;
```

**Alternatives to Type Casting**:

**Alternative 1: Type Guards**
```typescript
// Instead of casting
const user = obj as User;

// Use type guard
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'email' in obj;
}
if (isUser(obj)) {
  const user = obj; // TypeScript knows it's User
}
```

**Alternative 2: Proper Typing**
```typescript
// Instead of casting
const result = apiCall() as MyType;

// Proper typing
async function apiCall(): Promise<MyType> { }
const result = await apiCall(); // Type is MyType
```

**Alternative 3: Runtime Validation**
```typescript
// Instead of unsafe casting
const data = json as MyData;

// Runtime validation
const schema = z.object({ ... });
const data = schema.parse(json); // Validates and narrows type
```

---

### Rule 4: Use Patterns from Existing Domains

**Principle**: Generated code should match type patterns found in existing domains for consistency.

**What Patterns to Match**:

**1. Branded Types for Primitives**:
```typescript
// If existing domains use branded types
export type Email = Branded<string, "Email">;
export type UserId = Branded<string, "UserId">;

// New code should follow same pattern
export type TransactionId = Branded<string, "TransactionId">;
export type WalletAddress = Branded<string, "WalletAddress">;
```

**2. Type File Organization**:
```typescript
// If existing domains organize as:
types/
  ├── inputs.ts    // Request types
  ├── outputs.ts   // Response types
  ├── errors.ts    // Error types
  └── internal.ts  // Implementation types

// New domains should follow same structure
```

**3. Input/Output Type Naming**:
```typescript
// If existing domains use pattern:
export type CreateUserInput = { ... };
export type CreateUserResult = { ... };

// New code should match:
export type CreateTransactionInput = { ... };
export type CreateTransactionResult = { ... };
```

**4. Utility Type Usage**:
```typescript
// If existing domains use utility types for updates:
export type UpdateUserInput = Partial<Pick<User, 'name' | 'email'>>;

// New code should follow:
export type UpdateTransactionInput = Partial<Pick<Transaction, 'amount' | 'status'>>;
```

**5. Error Type Structure**:
```typescript
// If existing domains define errors as:
export type UserNotFoundError = {
  code: "USER_NOT_FOUND";
  message: string;
  userId: string;
};

// New code should match:
export type TransactionNotFoundError = {
  code: "TRANSACTION_NOT_FOUND";
  message: string;
  transactionId: string;
};
```

**6. Result Type Usage**:
```typescript
// If existing workflows return:
export function createUser(input: CreateUserInput): Result<CreateUserResult>

// New code should match:
export function createTransaction(input: CreateTransactionInput): Result<CreateTransactionResult>
```

**Pattern Learning Examples**:

**Learn from Analysis Phase**:
```
Analyzing existing domains...

Type Patterns Found:
- Branded types: Email, Password, UserId (wrapping primitives)
- Input suffix: All input types end with "Input"
- Result suffix: All output types end with "Result"
- Error codes: Domain prefix (USER_*, TRANSACTION_*)
- Utility types: Partial<Pick<>> for update operations
- Type organization: Separate files for inputs/outputs/errors/internal
```

**Apply in Generation**:
```typescript
// Specialist generates matching patterns
export type CreateWalletInput = { ... }; // Matches "Input" suffix
export type CreateWalletResult = { ... }; // Matches "Result" suffix
export type WalletId = Branded<string, "WalletId">; // Matches branded pattern
export type WalletNotFoundError = {
  code: "WALLET_NOT_FOUND"; // Matches DOMAIN_* pattern
  walletId: string;
};
```

---

## Violation Detection

### Detection Method 1: Grep Search

**Search Patterns**:
```bash
# Detect 'any' type usage
grep -rn ": any\|<any>\|as any\|Array<any>\|Record<string, any>" src/core/

# Detect type casting
grep -rn " as [A-Z]" src/core/

# Detect implicit any in function parameters
grep -rn "function.*([^)]*[a-z][a-z]*)" src/core/ | grep -v ": "
```

**Output Parsing**:
```
src/core/users/operations.ts:15:  const data: any = await repository.find();
src/core/transactions/workflow.ts:42:  return result as TransactionResult;
```

### Detection Method 2: TypeScript Compiler

**Command**:
```bash
tsc --noImplicitAny --noEmit
```

**What It Catches**:
- Implicit `any` types
- Parameters without types
- Variables without types when TypeScript can't infer

**Output Parsing**:
```
src/core/users/operations.ts(15,7): error TS7006: Parameter 'input' implicitly has an 'any' type.
```

### Detection Method 3: ESLint Rules

**Rules to Enable**:
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/explicit-function-return-type": "warn"
}
```

**Command**:
```bash
npm run lint -- --rule '@typescript-eslint/no-explicit-any: error'
```

**Output Parsing**:
```
src/core/users/operations.ts
  15:10  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

### Detection Method 4: npm Scripts (Project-Configured)

**Purpose**: Use project-configured npm scripts for holistic TypeScript quality validation.

**Script 1: check:any** (Blocking)
```bash
npm run check:any
```

**What It Does**:
- Searches for all forms of `any` type usage in src/
- Fails with exit code 1 if any `any` types found
- Uses inverted grep (`!`) to fail on matches

**Example Output** (violations found):
```bash
$ npm run check:any

src/core/users/operations.ts:15:  const data: any = await repository.find();
src/core/transactions/workflow.ts:42:  function process(x: any) { }

Command failed with exit code 1
```

**Example Output** (clean):
```bash
$ npm run check:any
✓ No any types found
```

**Script 2: check:types** (Blocking)
```bash
npm run check:types
```

**What It Does**:
- Runs TypeScript compiler with --noImplicitAny --strict --noEmit
- Stricter than regular `type-check` (includes all strict flags)
- Catches implicit any, unsafe operations, missing types

**Example Output** (violations found):
```bash
$ npm run check:types

src/core/users/operations.ts(15,7): error TS7006: Parameter 'input' implicitly has an 'any' type.
src/core/transactions/workflow.ts(42,10): error TS2304: Cannot find name 'pipe'.

Found 2 errors.
```

**Script 3: check:casting** (Informational)
```bash
npm run check:casting
```

**What It Does**:
- Reports all type casting instances (` as Type`)
- Non-failing (uses `|| echo` to always exit 0)
- For review to ensure casts have justification comments

**Example Output** (casts found):
```bash
$ npm run check:casting

src/core/users/value-objects/Email.ts:32:    return success(value as Email);
src/routes/auth/handlers.ts:18:  const validated = input as ValidatedInput; // After Zod validation

2 instances of type casting found
```

**Script 4: check:typescript-quality** (Combined)
```bash
npm run check:typescript-quality
```

**What It Does**:
- Runs all 3 checks in sequence: check:any && check:types && check:casting
- Fails if check:any or check:types fails
- Single command for complete TypeScript quality validation

**Integration with Validator**:
- Methods 1-3 (Grep, tsc, ESLint) provide detailed parsing for automatic fixes
- Method 4 (npm scripts) provides holistic validation with project configuration
- All 4 methods run to ensure comprehensive coverage
- Results aggregated and deduplicated

---

## Automatic Fix Strategies

### Fix Strategy 1: Replace `any` with Proper Type

**Detection**: Found `: any`, `<any>`, or `as any`

**Fix Algorithm**:
1. Read file containing violation
2. Analyze context:
   - If function parameter: Look at how parameter is used in function body
   - If variable: Look at assignment right-hand side
   - If return type: Look at return statements
3. Infer proper type from context
4. Replace `any` with inferred type

**Example Fix 1: Function Parameter**
```typescript
// BEFORE
function processUser(user: any) {
  return user.email.toLowerCase();
}

// Context analysis: user has 'email' property (string)
// Infer: user should be { email: string } or User type

// AFTER
function processUser(user: User) {
  return user.email.toLowerCase();
}
```

**Example Fix 2: Variable Assignment**
```typescript
// BEFORE
const result: any = await userRepository.findById(id);

// Context analysis: userRepository.findById returns Promise<User | null>
// Infer: result should be User | null

// AFTER
const result: User | null = await userRepository.findById(id);
```

**Example Fix 3: Array/Object**
```typescript
// BEFORE
const items: any[] = transactions.map(t => t.id);

// Context analysis: map returns transaction ids (likely strings)
// Infer: items should be string[]

// AFTER
const items: string[] = transactions.map(t => t.id);
```

### Fix Strategy 2: Add Missing Type Annotations

**Detection**: TypeScript compiler reports implicit `any` or ESLint flags missing types

**Fix Algorithm**:
1. Identify location of missing type
2. Analyze usage context
3. Infer proper type
4. Add explicit type annotation

**Example Fix 1: Parameter Type**
```typescript
// BEFORE
function validateEmail(email) {
  return email.includes('@');
}

// AFTER
function validateEmail(email: string): boolean {
  return email.includes('@');
}
```

**Example Fix 2: Return Type**
```typescript
// BEFORE
function createUser(input: CreateUserInput) {
  return pipe(validateUser(input), saveUser);
}

// Analysis: Returns Result<CreateUserResult> based on workflow pattern

// AFTER
function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(validateUser(input), saveUser);
}
```

### Fix Strategy 3: Remove Unnecessary Type Casting

**Detection**: Value is cast to a type it already has

**Fix Algorithm**:
1. Identify type cast location
2. Check actual type of value
3. Check target type of cast
4. If types match: Remove cast
5. If types don't match: Keep cast, add justification comment

**Example Fix**:
```typescript
// BEFORE
const email: string = getEmail();
const lower = email as string; // Unnecessary

// Analysis: email is already string, cast unnecessary

// AFTER
const email: string = getEmail();
const lower = email; // Cast removed
```

### Fix Strategy 4: Add Justification Comments

**Detection**: Type cast found without justification comment

**Fix Algorithm**:
1. Identify type cast
2. Analyze why it's needed
3. Add comment explaining necessity

**Example Fix**:
```typescript
// BEFORE
const validated = input as ValidatedInput;

// AFTER
const validated = input as ValidatedInput; // After Zod schema validation confirms shape
```

---

## Violation Examples with Fixes

### Example 1: `any` in Repository Call

**Violation**:
```typescript
const users: any = await userRepository.findAll();
```

**Fix**:
```typescript
const users: User[] = await userRepository.findAll();
```

**Reasoning**: Repository method returns `User[]`, use proper type.

---

### Example 2: Implicit `any` in Handler

**Violation**:
```typescript
export async function handleCreate(req) {
  const body = req.validated.body;
  // ...
}
```

**Fix**:
```typescript
export async function handleCreate(
  req: ValidatedRequest<{ body: CreateBody }>
): Promise<AppResponse<CreateResult>> {
  const body = req.validated.body;
  // ...
}
```

**Reasoning**: Handler parameters and return types must be explicit.

---

### Example 3: Unnecessary Type Assertion

**Violation**:
```typescript
const result = await run(workflow(input));
const data = result.value as UserData;
```

**Fix**:
```typescript
const result = await run(workflow(input));
if (result.status === "Success") {
  const data = result.value; // Type is already UserData
}
```

**Reasoning**: Type narrowing makes cast unnecessary.

---

### Example 4: Acceptable Casting with Justification

**Before**:
```typescript
const parsed = JSON.parse(externalData) as ApiResponse;
```

**After**:
```typescript
const parsed = JSON.parse(externalData) as ApiResponse; // External API response, validated with runtime schema check
```

**Reasoning**: Casting acceptable after validation, justification added.

---

## ESLint Rule Configuration

Add these rules to project ESLint config:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn"
  }
}
```

**Note**: Some rules are "warn" not "error" to avoid being too strict, but validator should treat warnings seriously.

---

## Integration with FCIS Orchestrator

### During Analysis Phase

Learn type patterns from existing code:
- Type annotation frequency and style
- `any` usage (should be 0 in quality codebases)
- Type casting patterns and justifications
- Branded type usage
- Utility type patterns

### During Design Phase

Design specifications should include:
- Exact types for all inputs, outputs, errors
- Value object types with validation
- No `any` types in design

### During Implementation Phase

**Specialist Guidelines**:
- Never generate `any` types
- Always add explicit types to parameters and returns
- Avoid type casting unless necessary
- Use learned patterns from Analysis

### During Validation Phase

**TypeScript Quality Check** (before post-implementation checklist):
1. Run 3 detection methods (Grep, tsc, ESLint)
2. Aggregate all violations
3. Apply automatic fixes
4. Re-run detection
5. If violations remain: Block and report

---

## Success Metrics

**Quality Code** has:
- ✅ 0 `any` types
- ✅ 100% explicit function signatures (parameters and returns)
- ✅ Type casting only with justification (< 5 instances per domain)
- ✅ Consistent with existing domain patterns

**Validator Output**:
```markdown
### TypeScript Code Quality

**Detection Results**:
- Grep: 0 `any` types found
- tsc --noImplicitAny: 0 errors
- ESLint no-explicit-any: 0 violations

**Type Casting**:
- Found: 2 instances
- With justification: 2
- Without justification: 0

**Status**: ✅ Passed
```

---

## Best Practices for Generated Code

1. **Always prefer proper types over `any`**
2. **Use `unknown` for truly unknown values** (then validate)
3. **Leverage TypeScript's type inference** (don't over-annotate obvious types)
4. **Add return types to all functions** (even if TypeScript can infer)
5. **Use branded types for domain primitives** (Email, UserId, TransactionId)
6. **Validate before casting** (Zod, type guards, runtime checks)
7. **Document rare type casts** (explain why necessary)
8. **Follow existing domain patterns** (be consistent)

---

## Common Patterns in FCIS Code

### Workflow Return Types
```typescript
export function createUser(input: CreateUserInput): Result<CreateUserResult> {
  return pipe(/* ... */);
}
```

### Operation Return Types
```typescript
export function saveUser(input: HashedInput): Result<UserData> {
  return command(/* ... */);
}
```

### Handler Signatures
```typescript
export async function handleCreate(
  req: ValidatedRequest<{ body: CreateBody }>
): Promise<AppResponse<CreateResult>> {
  // ...
}
```

### Value Object Types
```typescript
export type Email = Branded<string, "Email">;

export const Email = {
  create: (value: string): Result<Email> => { /* ... */ }
};
```

### Repository Types
```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User[]>;
  update(id: string, data: Partial<NewUser>): Promise<User[]>;
}
```

---

## Summary

These TypeScript quality rules ensure:
- Type safety throughout the codebase
- No runtime type errors from improper types
- Excellent IDE support (autocomplete, refactoring)
- Easy maintenance and refactoring
- Consistency across all domains
- Professional code quality

Generated code following these rules is production-ready, maintainable, and type-safe.
