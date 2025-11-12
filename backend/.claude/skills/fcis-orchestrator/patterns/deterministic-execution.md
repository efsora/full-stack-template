# Deterministic Execution Principles

This document defines principles for deterministic execution during the FCIS Implementation Phase, ensuring specialists generate consistent code without asking uncertain questions.

## Core Principle

**Same Input → Same Output**

Given the same:
- Task description
- Q&A session answers
- Design specifications

The Implementation Phase should generate the same code every time, without asking questions or making random choices.

---

## Why Deterministic Execution Matters

### Problems with Non-Deterministic Implementation

**Issue 1: Uncertain Questions During Implementation**
```
❌ BAD: operations-builder asks "Should I add retry logic to this operation?"
```
This question should have been answered in Q&A or Design phase, not during implementation.

**Issue 2: Inconsistent Code Generation**
```
❌ BAD: Same task generates different code on different runs
```
Implementation should be reproducible and predictable.

**Issue 3: Design Gaps Discovered Too Late**
```
❌ BAD: Specialist asks "What validation rule for email?" during implementation
```
Design validation should catch this before implementation starts.

### Benefits of Deterministic Execution

✅ **Predictable**: Same specs always generate same code
✅ **Fast**: No waiting for user answers during implementation
✅ **Traceable**: Design spec fully documents what will be generated
✅ **Debuggable**: If output wrong, fix Design spec and regenerate
✅ **Professional**: Execution flows smoothly from Design to completion

---

## When Questions Are Allowed (By Phase)

### Phase 1: Analysis
**Questions**: ❌ NO - Pattern learning is observation, not questioning

### Phase 1.5: Q&A Session
**Questions**: ✅ YES - This is THE phase for asking about gaps, ambiguities, options

### Phase 2: Design
**Questions**: ⚠️ RARE - Only if Q&A missed something critical (should be rare)

### Phase 2.5: Design Validation
**Questions**: ❌ NO - Validation is checking, not asking. If incomplete, report and return to Design.

### Phase 3: Planning
**Questions**: ❌ NO - Planning is deterministic based on Design

### Phase 4: Implementation
**Questions**: ❌ ALMOST NEVER - Only for truly unclear/contradictory Design specs (should not happen if Design validation worked)

**Exception**: Validator test failures (asks user: Fix/Skip/Show) - This is appropriate human judgment

### Phase 5: Iteration
**Questions**: ✅ YES - Gathering feedback for improvements

---

## Specialist Question Policy

### NEVER Ask These Questions

❌ **Design Decisions**:
- "Should I create method X?"
- "What should the validation rule be?"
- "How should I handle this error?"
- "Which approach should I use?"
- "What should the default value be?"

**Why**: These are design decisions made in Q&A/Design phases.

❌ **Missing Design Info**:
- "Design doesn't specify cascade behavior, what should I use?"
- "Error codes not defined, should I create them?"
- "Validation rules not specified, what's acceptable?"

**Why**: Design spec should be complete (validated in Phase 2.5). If incomplete, STOP and report, don't ask.

### Rarely Ask (Only If Truly Unclear)

⚠️ **Contradictory Design Specs**:
- "Design says 'cascade delete' in one place and 'set null' in another. Which is correct?"

**Why**: This is genuinely unclear, not missing. Design validation should catch this but might miss contradictions.

### Pattern Learning (Instead of Asking)

When Design has minor gaps, use pattern learning:

✅ **Repository Method Names**:
- Design says "Create UserRepository" but doesn't list all methods
- Solution: Look at existing repositories, copy their method pattern (findById, create, update, delete, findAll)

✅ **File Naming**:
- Design says "Create value objects" but doesn't specify file names
- Solution: Use learned naming conventions (Email.ts, Password.ts based on existing pattern)

✅ **Error Code Format**:
- Design says "Define error types" but doesn't specify error code format
- Solution: Use existing domain pattern (USER_NOT_FOUND, USER_EMAIL_ALREADY_EXISTS)

✅ **Import Aliases**:
- Design doesn't specify import style
- Solution: Use project's import alias pattern (#core, #infrastructure, #lib)

---

## Design Validation: The Gate

### Purpose

Design validation (Phase 2.5) is the **gate** that prevents incomplete designs from reaching Implementation.

If Design validation passes, specialists should NEVER encounter missing information.

### What Design Validation Checks

**Complete Specifications For**:
1. Database schema (all tables, columns, types, constraints, indexes, cascades)
2. Type system (all inputs, outputs, errors with codes, value objects with validation)
3. Business logic (all operations with purposes, workflows with sequences, error handling)
4. Repository (all methods, query functions, transaction support)
5. HTTP layer (all routes with methods/paths, handlers, schemas, auth requirements)
6. External services (providers, interfaces, timeouts, retries)
7. Tests (coverage scope, scenarios)

### What Happens If Validation Fails

```
❌ Design Validation Failed

Missing: Database schema cascade behavior, Error code definitions

Action: Returning to Design phase

User must complete Design spec before implementation can begin.
```

**No Proceeding**: Implementation cannot start with incomplete Design.

---

## Specialist Behavior Flowchart

```
Specialist Starts
  ↓
Read Design Spec from Design Document
  ↓
Check: Is Design info complete for this specialist?
  ├─ YES → Proceed with code generation
  │   ↓
  │   Generate code following Design spec exactly
  │   ↓
  │   Use pattern learning for minor gaps (naming, structure)
  │   ↓
  │   Update design document with results
  │   ↓
  │   Specialist Complete ✅
  │
  └─ NO → Design spec incomplete
      ↓
      Report: "Design spec incomplete: [specific missing item]"
      ↓
      STOP and return to Design phase
      ↓
      Specialist Failed ❌ (Design bug, not implementation bug)
```

---

## Examples

### Example 1: Complete Design → Smooth Execution

**Design Spec Says**:
```
Database Schema:
- Table: users
  - id: uuid, primary key
  - email: text, not null, unique
  - password: text, not null
  - created_at: timestamp, default now
  - user_id foreign key references users(id) onDelete: cascade

Value Objects:
- Email: Branded type, validation: RFC 5322 regex, max 255 chars

Operations:
- validateUserCreation: Check email format using Email.create()
```

**Specialist Behavior**:
- schema-designer: Generates exact schema specified ✅
- value-object-creator: Creates Email with specified validation ✅
- operations-builder: Uses Email.create() as specified ✅

**Questions Asked**: 0
**Implementation**: Smooth, deterministic

---

### Example 2: Incomplete Design → Stops and Reports

**Design Spec Says**:
```
Database Schema:
- Table: users
  - id: uuid, primary key
  - email: text, not null, unique
  - user_id foreign key references users(id)  ← CASCADE BEHAVIOR MISSING

Value Objects:
- Email: Branded type  ← VALIDATION RULES MISSING
```

**Specialist Behavior**:
- schema-designer encounters missing cascade behavior
- **STOPS and reports**:
  ```
  ❌ Design Spec Incomplete

  Specialist: schema-designer
  Missing: Cascade behavior for user_id foreign key (onDelete: ?)

  Returning to Design phase to complete specifications.
  ```
- **NO question asked** (like "What cascade behavior should I use?")
- Automatically returns to Design phase

**Design Phase** (resumed):
- User adds: "onDelete: cascade"
- Re-validates Design
- Proceeds to Implementation again

---

### Example 3: Minor Gap → Pattern Learning

**Design Spec Says**:
```
Repository:
- UserRepository with CRUD operations  ← METHOD NAMES NOT SPECIFIED
```

**Specialist Behavior**:
- repository-builder reads Design spec
- Recognizes CRUD is standard pattern
- Looks at existing repositories (from Analysis phase)
- Finds pattern: findById, create, update, delete, findAll
- **Uses same pattern** without asking
- Generates UserRepository with same 5 methods ✅

**Questions Asked**: 0
**Pattern Learning**: Filled the gap automatically

---

### Example 4: Technical Error → Ask User

**Design Spec**: Complete and valid

**Specialist Behavior**:
- operations-builder generates code
- Runs TypeScript compile check
- **Syntax error** (tool bug, not Design issue)

**Asks User**:
```
❌ Technical Error in Specialist

Specialist: operations-builder
Error: TypeScript compilation failed: Unexpected token '}'

This is a technical error (not a Design spec issue).

Retry specialist?
A) Yes, retry (will fix syntax and retry)
B) No, skip operations-builder
```

**User chooses A**: Specialist fixes syntax, retries, succeeds ✅

---

## Design Validation Examples

### Complete Design (Passes Validation)

```markdown
## Design

### Database Schema

**Tables**:

1. **users**
   - id: uuid, primary key, default random
   - email: text, not null, unique
   - password: text, not null
   - created_at: timestamp, not null, default now
   - updated_at: timestamp, not null, default now, auto-update

2. **password_reset_tokens**
   - id: uuid, primary key, default random
   - user_id: uuid, not null, references users(id) onDelete: cascade
   - token: text, not null, unique
   - expires_at: timestamp, not null
   - created_at: timestamp, not null, default now

**Indexes**:
- users.email (unique, for lookup)
- password_reset_tokens.token (unique, for validation)
- password_reset_tokens.user_id (for joins)

### Type System

**Input Types**:
- RequestPasswordResetInput: { email: string }
- ResetPasswordInput: { token: string, newPassword: string }

**Output Types**:
- RequestPasswordResetResult: { success: boolean, message: string }
- ResetPasswordResult: { success: boolean, userId: string }

**Error Types**:
- UserNotFoundError: code "USER_NOT_FOUND"
- InvalidTokenError: code "INVALID_RESET_TOKEN"
- TokenExpiredError: code "RESET_TOKEN_EXPIRED"

**Value Objects**:
- Email: Branded type, validation: RFC 5322 regex, max 255 chars
- Password: Branded type, validation: min 12 chars, must include uppercase, lowercase, number, special char
- ResetToken: Branded type, validation: exactly 64 chars, alphanumeric

### Business Logic

**Operations**:
1. validateResetRequest(input) - Validates email format using Email.create()
2. findUserByEmail(email) - Finds user by email using userRepository.findByEmail()
3. generateResetToken() - Generates secure random 64-char token
4. saveResetToken(userId, token) - Saves token with 1-hour expiration
5. validateResetToken(token) - Checks token exists and not expired
6. hashNewPassword(password) - Validates and hashes password

**Workflows**:
1. requestPasswordReset(input) - pipe(validateResetRequest, findUserByEmail, generateResetToken, saveResetToken, sendResetEmail)
2. resetPassword(input) - pipe(validateResetToken, findTokenOwner, hashNewPassword, updateUserPassword, deleteToken)

**Error Handling**:
- Email not found → Return UserNotFoundError
- Token invalid → Return InvalidTokenError
- Token expired → Return TokenExpiredError

### Repository

**Methods**:
- PasswordResetTokenRepository.create(data) - Create new token
- PasswordResetTokenRepository.findByToken(token) - Find token by value
- PasswordResetTokenRepository.deleteByToken(token) - Delete after use
- PasswordResetTokenRepository.deleteExpired() - Cleanup old tokens

### HTTP Layer

**Routes**:
1. POST /auth/reset-request
   - Body: { email }
   - Response: { success, message }
   - Auth: Public (no auth required)
   - Validation: Email format

2. POST /auth/reset-password
   - Body: { token, newPassword }
   - Response: { success, userId }
   - Auth: Public (no auth required)
   - Validation: Token format, password strength

### Tests

**Coverage**:
- Email value object (format validation, edge cases)
- Password value object (strength validation, edge cases)
- ResetToken value object (format validation)

**Scenarios**:
- Valid email format
- Invalid email format
- Password too short
- Password missing required characters
- Token correct length
- Token incorrect length
```

**Validation Result**: ✅ All sections complete, proceeding to Planning

---

### Incomplete Design (Fails Validation)

```markdown
## Design

### Database Schema

**Tables**:

1. **users**
   - id: uuid, primary key
   - email: text, not null, unique
   - password: text, not null

2. **password_reset_tokens**
   - id: uuid, primary key
   - user_id: uuid, references users(id)  ← MISSING: onDelete behavior
   - token: text, not null
   - expires_at: timestamp, not null

← MISSING: Indexes not specified

### Type System

**Input Types**:
- RequestPasswordResetInput: { email: string }

**Output Types**:
- RequestPasswordResetResult: { success: boolean }

**Error Types**:
← MISSING: Error codes not specified

**Value Objects**:
- Email: Branded type  ← MISSING: Validation rules not specified
- Password: Branded type  ← MISSING: Validation rules not specified

[etc...]
```

**Validation Result**: ❌ Failed

**Missing**:
- Database: Cascade behavior for foreign keys, indexes not specified
- Types: Error codes missing
- Value Objects: Validation rules not defined

**Action**: Return to Design phase

---

## Pattern Learning vs. Asking

### When to Use Pattern Learning (Good)

Pattern learning fills **minor gaps** by looking at existing code:

✅ **Method Naming**:
- Gap: Design says "CRUD operations" without listing exact method names
- Pattern: Look at existing repositories → findById, create, update, delete
- Action: Use same names

✅ **File Structure**:
- Gap: Design says "Create operations" without specifying file organization
- Pattern: Look at existing domain → one file per operation vs. grouped
- Action: Match existing structure

✅ **Error Message Format**:
- Gap: Design specifies error codes but not message format
- Pattern: Look at existing errors → "User not found" vs. "User with ID {id} not found"
- Action: Match existing format

✅ **Import Style**:
- Gap: Design doesn't specify import aliases
- Pattern: Project uses #core, #infrastructure, #lib
- Action: Use same aliases

### When to Stop and Report (Good)

Stop and report when **critical info** is missing:

🛑 **Validation Rules**:
- Gap: Value object defined but no validation rules
- Action: STOP - "Design incomplete: Email validation rules not specified"
- Reason: Validation rules are business logic, not patterns

🛑 **Foreign Key Behavior**:
- Gap: Foreign key defined but cascade behavior not specified
- Action: STOP - "Design incomplete: Cascade behavior for user_id not specified"
- Reason: Cascade affects data integrity, not a pattern choice

🛑 **Error Codes**:
- Gap: Error types listed but codes not defined
- Action: STOP - "Design incomplete: Error codes not defined"
- Reason: Error codes are API contract, not patterns

🛑 **Authentication Requirements**:
- Gap: Routes defined but auth requirements not specified
- Action: STOP - "Design incomplete: Authentication requirements not specified"
- Reason: Security decisions, not patterns

### When to Ask (Rare)

Ask ONLY if Design spec is **contradictory or genuinely unclear**:

⚠️ **Contradictory Specs**:
```
Design says:
- Database: "user_id references users(id) onDelete: cascade"
- HTTP Layer: "Users cannot be deleted if they have transactions"

These contradict! Cascade delete would delete user, but HTTP layer prevents deletion.

Ask: "Design spec contradictory. Should users be deletable with cascade or not?"
```

⚠️ **Genuinely Unclear**:
```
Design says: "Email validation: strict"

What does "strict" mean exactly? RFC 5322? DNS check? Disposable email check?

Ask: "Design spec unclear. What does 'strict' email validation mean?"
```

**Note**: Design validation (Phase 2.5) should catch these, so this should be VERY rare.

---

## Technical vs. Design Failures

### Design Failure (Incomplete Spec)

**Symptom**: Specialist can't proceed because Design doesn't specify something

**Example**:
```
Specialist: value-object-creator
Task: Create Email value object
Design says: "Email: Branded type"
Missing: Validation rules

Error: Cannot create Email value object without validation rules
```

**Action**:
- Report: "Design spec incomplete: Email validation rules not specified"
- Return to Design phase
- **NO user question** - This is a Design bug

### Technical Failure (Execution Issue)

**Symptom**: Specialist has complete Design info but encounters tool/syntax error

**Example**:
```
Specialist: schema-designer
Design: Complete schema specified
Error: "Drizzle kit generate failed: Syntax error in schema.ts"
```

**Action**:
- Ask user: "Technical error. Retry? A) Yes, B) Skip"
- If retry: Fix syntax, retry up to 3 times
- If skip: Mark specialist as skipped

---

## Deterministic Execution Checklist

Before Implementation Phase starts:

- [x] Analysis complete (patterns learned)
- [x] Q&A session complete (ambiguities resolved)
- [x] Design complete (all specifications written)
- [x] **Design validation passed** (all sections complete)
- [x] Planning complete (execution plan ready)

If all checkboxes checked: Implementation will be deterministic ✅

If Design validation not passed: Implementation will ask questions ❌

---

## Best Practices for Orchestrator

1. **Run Design Validation**: Always run Phase 2.5 before Planning
2. **Trust the Process**: If Design validated, specialists have everything they need
3. **Stop on Gaps**: If specialist finds missing info, stop and report (don't ask)
4. **Use Pattern Learning**: For minor gaps (naming, structure, format)
5. **Ask Only for Contradictions**: Very rare, indicates Design phase bug
6. **Report Technical Errors**: Distinguish from Design issues clearly

---

## Expected Behavior

### Typical Successful Run

```
Design Validation: ✅ Passed
  ↓
Planning: ✅ Complete
  ↓
Implementation Group 1: ✅ Complete (0 questions)
  ↓
Checkpoint: User proceeds
  ↓
Implementation Group 2: ✅ Complete (0 questions)
  ↓
Checkpoint: User proceeds
  ↓
Implementation Group 3: ✅ Complete (0 questions)
  ↓
Checkpoint: User proceeds
  ↓
Implementation Group 4: ✅ Complete (validator asks about test failures - appropriate)
  ↓
Final Checkpoint: User approves
  ↓
Done! 🎉
```

**Questions During Implementation**: 0 (except validator test handling)

### If Design Validation is Skipped (Bad)

```
Design: ✅ Approved (but not validated)
  ↓
Planning: ✅ Complete
  ↓
Implementation Group 1:
  - schema-designer asks: "Should cascade delete or set null?" ❌
  ↓
Implementation Group 2:
  - value-object-creator asks: "What validation rules?" ❌
  ↓
[Many questions, slow execution, frustrating experience]
```

**Questions During Implementation**: Many ❌

**Solution**: Always run Design validation (Phase 2.5)

---

## Summary

**Deterministic Execution = No Questions During Implementation**

Achieved through:
1. ✅ Comprehensive Q&A session (resolve ambiguities upfront)
2. ✅ Complete Design specifications (all details documented)
3. ✅ Design validation checkpoint (catch incomplete specs)
4. ✅ Pattern learning (fill minor gaps automatically)
5. ✅ Clear failure protocol (stop and report, don't ask)

**Result**: Implementation flows smoothly Group 1 → Checkpoint → Group 2 → Checkpoint → Group 3 → Checkpoint → Group 4 → Done!
