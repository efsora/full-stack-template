# Grouped Execution Guide

This document provides guidance for executing the FCIS Implementation Phase using grouped automation with logical checkpoints.

## Purpose

The Implementation Phase (Phase 4) executes 11 specialist workflows organized into 5 logical groups. This guide explains how groups work, when to checkpoint, how to handle failures, and how to report progress.

---

## The 5 Logical Groups

### Group 1: Foundation (Data Layer)

**Architectural Layer**: Imperative Shell - Database

**Specialists**:
1. schema-designer
2. repository-builder

**What Gets Generated**:
- Database tables with proper types, constraints, and indexes
- Migration files for schema changes
- Repository factory functions with CRUD methods
- Transaction support (`withTransaction` method)

**Dependencies**:
- None (first group, establishes foundation)

**Success Criteria**:
- Schema compiles without errors
- Migrations generate successfully
- Repositories follow factory pattern

**Checkpoint Question**: "Foundation layer complete. Proceed to Domain Core? A) Yes proceed, B) Review files first"

---

### Group 2: Domain Core (Functional Core)

**Architectural Layer**: Functional Core - Pure Business Logic

**Specialists**:
3. external-service-builder
4. value-object-creator
5. operations-builder
6. workflow-composer

**What Gets Generated**:
- External service client interfaces (email, payment, SMS, etc.)
- Value objects with branded types and validation
- Business operations using `command()` pattern
- Workflows using `pipe()` composition (railway-oriented programming)

**Dependencies**:
- Requires Group 1 (repositories used in operations)

**Success Criteria**:
- Value objects validate correctly
- Operations properly use `command()` pattern
- Workflows properly use `pipe()` composition
- No side effects in functional core

**Checkpoint Question**: "Domain Core complete. Proceed to HTTP Shell? A) Yes proceed, B) Review files first"

---

### Group 3: HTTP Shell (Imperative Shell)

**Architectural Layer**: Imperative Shell - API Layer

**Specialists**:
7. route-generator
8. openapi-registrar

**What Gets Generated**:
- Zod schemas with OpenAPI metadata
- Request handlers (import workflows from barrel only)
- Express route definitions with validation middleware
- OpenAPI path registrations

**Dependencies**:
- Requires Group 2 (workflows and types used in handlers)

**Success Criteria**:
- Handlers import from barrel exports only (no direct imports)
- Schemas have proper OpenAPI metadata
- Routes use validation middleware
- OpenAPI spec generates without errors

**Checkpoint Question**: "HTTP Shell complete. Proceed to Quality Assurance? A) Yes proceed, B) Review files first"

---

### Group 4: Quality Assurance (Validation)

**Architectural Layer**: Cross-Cutting - Testing & Validation

**Specialists**:
9. test-generator
10. validator

**What Gets Generated**:
- Unit tests for value objects
- Unit tests for pure functions
- Validation results (architectural + runtime)

**What Gets Validated**:
- Architectural compliance (barrel exports, imports, types, Result usage, repository pattern)
- Runtime readiness (format, lint, type-check, test, build)

**Dependencies**:
- Requires Group 1, 2, 3 (tests all generated code)

**Success Criteria** (BLOCKING):
- ✅ All architectural checks pass
- ✅ Format: Passes (or applied automatically)
- ✅ Lint: 0 errors, 0 warnings
- ✅ Type Check: No TypeScript errors
- ✅ Test: All tests passing (or user approved skip)
- ✅ Build: Production build succeeds

**Checkpoint Question**: "Implementation complete. What would you like to do? A) Approve, B) Request iterations, C) Review code"

**BLOCKING**: This checkpoint must be approved before considering implementation complete.

---

### Group 5: Refinement (Conditional)

**Architectural Layer**: Cross-Cutting - Code Alignment

**Specialists**:
11. refactoring-agent

**What Gets Modified**:
- Existing handlers updated to use new workflows
- Existing routes aligned with new patterns
- Consistency maintained across codebase

**Dependencies**:
- Requires Group 1, 2, 3 (refactors existing code to use new implementations)

**When to Execute**:
- Only if Design phase identified existing code needing updates
- Skip entirely if no refactoring needed

**Success Criteria**:
- Existing code properly integrated with new code
- No breaking changes to existing functionality
- Patterns consistent across old and new code

**Checkpoint Question**: "Refactoring complete. A) Approve implementation, B) Review files first"

---

## Deterministic Execution

### Core Principle

**Implementation Phase Should Not Ask Design Questions**

All design decisions are made in:
- Q&A Session (Phase 1.5): Resolve ambiguities and options
- Design Phase (Phase 2): Specify all implementation details
- Design Validation (Phase 2.5): Ensure specifications are complete

Implementation Phase (Phase 4) executes the plan deterministically.

### Specialist Behavior

**Specialists Should**:
- ✅ Follow Design spec exactly
- ✅ Use pattern learning for minor gaps (naming conventions, file structure)
- ✅ Stop and report if Design spec incomplete
- ✅ Generate consistent code given same Design spec

**Specialists Should NOT**:
- ❌ Ask design questions ("Should I add method X?")
- ❌ Ask for missing specifications ("What validation rule?")
- ❌ Make random choices ("I'll use optimistic locking")
- ❌ Guess at unclear requirements

### When Specialists Stop vs. Continue

**STOP and Report Design Incomplete** (Critical Info Missing):
- Validation rules not defined
- Cascade behavior not specified
- Error codes not provided
- Authentication requirements unclear
- Method signatures not specified

**CONTINUE with Pattern Learning** (Minor Gaps):
- Exact method names not specified (copy from existing repos)
- File naming not specified (use learned conventions)
- Error message format not specified (match existing pattern)
- Import alias style not specified (use project standard)

**The Difference**:
- **Critical**: Affects business logic, security, data integrity
- **Minor**: Affects style, conventions, structure

### Design Validation Prevents Questions

If Design Validation (Phase 2.5) passes:
- All critical information is present in Design spec
- Specialists should NOT encounter missing critical info
- Implementation should flow smoothly without questions

If specialists ask questions during implementation:
- **Root Cause**: Design validation incomplete or Design spec has gaps
- **Solution**: Improve Design validation checklist

---

## Execution Flow

### Within-Group Execution

**Automatic Sequential Execution**:
```
Group Start
  ↓
Execute Specialist 1
  ↓ (no pause)
Update Design Document
  ↓
Provide FCIS Principle Explanation
  ↓
Execute Specialist 2
  ↓ (no pause)
Update Design Document
  ↓
Provide FCIS Principle Explanation
  ↓
[Continue for all specialists in group]
  ↓
Group Complete
  ↓
Show Progress Report
  ↓
Checkpoint (Ask User)
```

**No Pauses**: Specialists within a group execute without interruption

**Real-Time Updates**: Design document updated after each specialist completes

**Educational**: FCIS principles explained as each specialist works

### Between-Group Checkpoints

**After Each Group**:
1. Show progress report
2. Summarize what was generated
3. List file changes
4. Preview next group
5. Ask user to proceed

**User Options**:
- Proceed to next group
- Review files first (pause to inspect code)

**No Design Adjustments**: Design changes happen in Iteration phase (Phase 5), not at checkpoints

### Failure Handling

**If Specialist Fails Within Group**:

Two types of failures:

**Type 1: Design Incompleteness** (missing critical info)
```
Specialist Executing
  ↓
❌ Design Spec Incomplete
  ↓
Stop Group Execution Immediately
  ↓
Report to User: "Design spec incomplete: [specific missing item]"
  ↓
Automatically Return to Design Phase
  ↓
User completes Design spec
  ↓
Re-validate Design
  ↓
Restart Implementation from Group 1
```

**Type 2: Technical Error** (execution issue)
```
Specialist Executing
  ↓
❌ Technical Error (syntax, tools, compilation)
  ↓
Stop Group Execution Immediately
  ↓
Ask User: "Technical error. Retry specialist? A) Yes, B) No (skip)"
  ↓
Based on User Choice:
  A) Retry up to 3 times → If success, continue group
  B) Mark as skipped → Continue to next specialist in group
```

**Key Difference**:
- Design Incompleteness → Automatic return to Design (no user choice)
- Technical Error → Ask user to retry or skip

**Retry Strategy**:
- Attempt 1: Same parameters
- Attempt 2: Adjusted parameters (more context, different approach)
- Attempt 3: Simplified approach
- If all fail: Ask user what to do

---

## Progress Reporting

### After Each Group Completes

**Format**:
```
✅ Group [N]: [Group Name] - Completed

Executed: [specialist-1] ([duration]s), [specialist-2] ([duration]s)

Generated:
  - [Category 1]: [details]
  - [Category 2]: [details]

Files: [N] created, [M] modified

Duration: [total]s
```

**Example for Group 1**:
```
✅ Group 1: Foundation - Completed

Executed: schema-designer (12s), repository-builder (8s)

Generated:
  - Database: 3 tables (users, transactions, wallets)
  - Migrations: 3 new migration files
  - Repositories: UserRepository, TransactionRepository, WalletRepository

Files: 5 created, 2 modified
  Created:
    - src/db/migrations/0005_add_wallets.sql
    - src/infrastructure/repositories/drizzle/WalletRepository.ts
    - src/infrastructure/repositories/drizzle/TransactionRepository.ts
    - src/infrastructure/repositories/drizzle/UserRepository.ts
    - src/core/transactions/types/internal.ts
  Modified:
    - src/db/schema.ts
    - src/infrastructure/repositories/drizzle/index.ts

Duration: 20s
```

### Progress Report Sections

**Executed**: List specialists with durations

**Generated**: Categorized artifacts (database, repositories, value objects, operations, workflows, routes, tests)

**Files**: Counts and specific paths for created/modified files

**Duration**: Total time for group execution

---

## Checkpoint Best Practices

### What to Show at Checkpoints

1. **Completion Confirmation**: "✅ Group [N]: [Name] - Completed"
2. **Execution Summary**: Which specialists ran and how long
3. **Generated Artifacts**: What was created (organized by category)
4. **File Changes**: Specific files created and modified
5. **Next Steps**: What the next group will do

### What to Ask at Checkpoints

**Standard Checkpoints** (Groups 1-3, 5):
```
[Group Name] complete!

Generated: [summary]
Files: [N] created, [M] modified

Next: [Next Group Name] ([what it will do])

Proceed to [Next Group]?
A) Yes, proceed
B) Review files first
```

**Note**: Design adjustments are NOT available at checkpoints. Design changes happen in Iteration phase (Phase 5) after full implementation.

**Blocking Checkpoint** (Group 4):
```
Quality Assurance complete!

Tests: ✅ [N] tests passing
Validation:
  ✅ Lint: Passed
  ✅ Type Check: Passed
  ✅ Test: Passed
  ✅ Build: Passed

Implementation complete. What would you like to do?
A) Approve implementation
B) Request iterations
C) Review generated code
```

### Checkpoint Timing

- **Group 1**: After data layer established
- **Group 2**: After business logic implemented
- **Group 3**: After API layer created
- **Group 4**: After all validation passes (BLOCKING)
- **Group 5**: After refactoring applied (if needed)

---

## Failure Recovery Patterns

### Common Failure Scenarios

#### Scenario 1: Schema Designer Fails

**Error**: Invalid column type or constraint

**Recovery**:
1. Show error: "schema-designer failed: Invalid foreign key reference"
2. Ask user: Retry / Skip / Stop
3. If Retry: Analyze Design phase, adjust schema definition, retry
4. If Skip: Continue without schema (repository-builder will likely fail)
5. If Stop: Return to Design phase to fix schema definition

#### Scenario 2: Operations Builder Fails

**Error**: TypeScript error in generated operation

**Recovery**:
1. Show error: "operations-builder failed: Type 'X' not assignable to 'Y'"
2. Ask user: Retry / Skip / Stop
3. If Retry: Adjust type definitions, retry operations-builder
4. If Skip: Continue (workflows will reference missing operations)
5. If Stop: Return to Design phase to fix type system

#### Scenario 3: Validator Fails

**Error**: Lint errors after code generation

**Recovery**:
1. Validator attempts automatic fix (runs `npm run lint:fix`)
2. Retries lint check
3. If still fails: Shows remaining errors
4. Asks user: "Should I try to fix these manually?"
5. Based on approval: Fixes errors, retries all checks

**Note**: Validator has built-in retry logic, so failures are usually recoverable automatically.

---

## Group Dependencies

Understanding dependencies helps debug failures:

```
Group 1 (Foundation)
  └─ Creates: Database schema, Repositories
     └─ Used by: Group 2 (operations need repositories)

Group 2 (Domain Core)
  └─ Creates: Value objects, Operations, Workflows
     └─ Used by: Group 3 (handlers call workflows)

Group 3 (HTTP Shell)
  └─ Creates: Routes, Handlers, OpenAPI
     └─ Used by: Group 4 (tests validate API behavior)

Group 4 (Quality Assurance)
  └─ Validates: All generated code from Groups 1-3
     └─ Blocks: Implementation cannot proceed until validated

Group 5 (Refinement)
  └─ Updates: Existing code to integrate with Groups 1-3
     └─ Independent: Can be skipped if no existing code to refactor
```

---

## When to Split vs. Combine Groups

### Good Group Splits

**By Architectural Layer**:
- Foundation (Data) separate from Domain Core (Logic) separate from HTTP Shell (API)
- Clear boundaries match FCIS architecture

**By Dependencies**:
- Foundation must complete before Domain Core (operations need repositories)
- Domain Core must complete before HTTP Shell (handlers need workflows)

**By Review Points**:
- Database design should be reviewed before business logic
- Business logic should be reviewed before API design

### Bad Group Splits

**Too Granular**: One specialist per group = too many checkpoints
**Too Coarse**: All 11 specialists in one group = no early feedback
**Dependency Violations**: HTTP Shell before Domain Core = handlers can't import workflows

---

## Troubleshooting

### Problem: Group Takes Too Long

**Symptoms**: Group 2 has been running for 5+ minutes

**Possible Causes**:
- Complex workflows with many operations
- Large number of value objects
- Slow specialist execution

**Solutions**:
- Let it complete (no action needed)
- Check design document for real-time progress
- Wait for group completion report

### Problem: Checkpoint Not Appearing

**Symptoms**: Group completed but no checkpoint shown

**Possible Causes**:
- Orchestrator missed checkpoint instruction
- Error in orchestrator logic

**Solutions**:
- Check orchestrator spec for checkpoint definition
- Verify AskUserQuestion tool is used
- Review design document for group status

### Problem: Specialist Fails Repeatedly

**Symptoms**: Same specialist fails 3 times in retry attempts

**Possible Causes**:
- Design flaw (impossible to generate)
- Missing dependency
- Invalid input from previous specialist

**Solutions**:
- Choose "Stop implementation"
- Return to Design phase
- Fix design flaw
- Restart implementation

---

## Best Practices

1. **Review Each Checkpoint**: Don't rush through approvals, check generated artifacts
2. **Use Retry First**: If specialist fails, try retry before skip (might be transient)
3. **Read Progress Reports**: Understand what each group generated
4. **Trust Validation**: Group 4 catches most issues, but earlier review helps
5. **Skip Refinement If Not Needed**: Group 5 is optional, don't force it
6. **Read Design Document**: Full audit trail available in real-time
7. **Iterate at End**: Save iterations for after full implementation (Group 4 checkpoint)

---

## Example Full Execution

### Group 1: Foundation

**Execution**:
```
🏗️ Group 1: Foundation - Starting...

  ▸ schema-designer
    - Analyzing database design from Design phase...
    - Generating Drizzle schema...
    - Creating migration...
    ✅ Completed (12s)

  ▸ repository-builder
    - Reading generated schema...
    - Creating UserRepository factory...
    - Creating TransactionRepository factory...
    - Adding barrel exports...
    ✅ Completed (8s)

✅ Group 1: Foundation - Completed

Executed: schema-designer (12s), repository-builder (8s)
Generated:
  - Database: 3 tables, 3 migrations
  - Repositories: 3 repositories with CRUD
Files: 5 created, 2 modified
Duration: 20s
```

**Checkpoint**:
```
Foundation layer complete!

Generated:
  - Database tables: users, transactions, wallets
  - Migrations: 3 new files
  - Repositories: UserRepository, TransactionRepository, WalletRepository

Files created: 5
Files modified: 2

Next: Domain Core (business logic implementation)

Proceed to Domain Core?
A) Yes, proceed
B) Review files first

User selects: A) Yes, proceed
```

### Group 2: Domain Core

**Execution**:
```
🧠 Group 2: Domain Core - Starting...

  ▸ external-service-builder
    - Checking for external service requirements...
    - No external services needed, skipping
    ⏭️ Skipped (0s)

  ▸ value-object-creator
    - Creating Email value object...
    - Creating TransactionAmount value object...
    - Creating WalletBalance value object...
    ✅ Completed (10s)

  ▸ operations-builder
    - Creating validateUserCreation operation...
    - Creating saveTransaction operation...
    - Creating updateWalletBalance operation...
    - [12 operations total]
    ✅ Completed (15s)

  ▸ workflow-composer
    - Composing createUser workflow...
    - Composing createTransaction workflow...
    - Composing getWalletBalance workflow...
    - [6 workflows total]
    ✅ Completed (12s)

✅ Group 2: Domain Core - Completed

Executed: external-service-builder (0s, skipped), value-object-creator (10s), operations-builder (15s), workflow-composer (12s)
Generated:
  - Value objects: 5
  - Operations: 12
  - Workflows: 6
Files: 18 created, 4 modified
Duration: 37s
```

**Checkpoint**:
```
Domain Core complete!

Generated:
  - Value objects: Email, TransactionAmount, WalletBalance, CurrencyCode, UserId
  - Operations: 12 business operations with command() pattern
  - Workflows: 6 workflows with pipe() composition

Files created: 18
Files modified: 4

Next: HTTP Shell (API layer implementation)

Proceed to HTTP Shell?
A) Yes, proceed
B) Review files first

User selects: A) Yes, proceed
```

### Group 3: HTTP Shell

**Execution**:
```
🌐 Group 3: HTTP Shell - Starting...

  ▸ route-generator
    - Creating /users routes...
    - Creating /transactions routes...
    - Creating /wallets routes...
    - Creating handlers with barrel imports...
    - Creating Zod schemas with OpenAPI metadata...
    ✅ Completed (18s)

  ▸ openapi-registrar
    - Registering /users paths...
    - Registering /transactions paths...
    - Registering /wallets paths...
    - Regenerating OpenAPI spec...
    ✅ Completed (6s)

✅ Group 3: HTTP Shell - Completed

Executed: route-generator (18s), openapi-registrar (6s)
Generated:
  - Routes: 8 endpoints
  - Handlers: 8 handlers with type-safe validation
  - OpenAPI: All endpoints documented
Files: 10 created, 3 modified
Duration: 24s
```

**Checkpoint**:
```
HTTP Shell complete!

Generated:
  - Routes: POST /users, GET /users/:id, POST /transactions, GET /transactions, POST /wallets, GET /wallets/:id, PATCH /wallets/:id, DELETE /users/:id
  - Handlers: 8 handlers with proper validation
  - OpenAPI: All 8 endpoints documented

Files created: 10
Files modified: 3

Next: Quality Assurance (testing & validation)

Proceed to Quality Assurance?
A) Yes, proceed
B) Review files first

User selects: A) Yes, proceed
```

### Group 4: Quality Assurance

**Execution**:
```
✅ Group 4: Quality Assurance - Starting...

  ▸ test-generator
    - Creating Email.test.ts...
    - Creating TransactionAmount.test.ts...
    - Creating WalletBalance.test.ts...
    - [25 tests total]
    ✅ Completed (8s)

  ▸ validator
    - Checking barrel export compliance...
      ✅ All exports compliant
    - Checking import rules...
      ✅ All imports from barrels
    - Checking type conventions...
      ✅ DTOs use type, contracts use interface
    - Checking Result usage...
      ✅ Workflows use pipe(), operations use command()
    - Checking repository pattern...
      ✅ Factory functions with withTransaction

    - Running post-implementation checklist...

      Attempt 1:
        Step 1 (Lint): Running npm run lint...
          ❌ 15 formatting errors detected
          Running npm run format...
          ✅ Formatting applied
          Re-running npm run lint...
          ✅ Passed (0 errors)

        Step 2 (Type Check): Running npm run type-check...
          ✅ Passed

        Step 3 (Test): Running npm run test:run...
          ✅ Passed (47 tests)

        Step 4 (Build): Running npm run build...
          ✅ Passed

      ✅ All checks passed after 1 attempt
      Fixes applied: 1 (Prettier formatting)

    ✅ Completed (45s)

✅ Group 4: Quality Assurance - Completed

Executed: test-generator (8s), validator (45s)
Generated:
  - Tests: 25 unit tests
Validation:
  ✅ Architectural compliance: Passed
  ✅ Lint: Passed (0 errors)
  ✅ Type Check: Passed
  ✅ Test: Passed (47 tests)
  ✅ Build: Passed
Files: 8 created, 1 modified
Duration: 53s
```

**Checkpoint (BLOCKING)**:
```
Implementation complete!

Quality Assurance Results:
  ✅ Tests: 47 passing
  ✅ Lint: 0 errors, 0 warnings
  ✅ Type Check: No errors
  ✅ Build: Successful

Total Duration: 2 minutes 14 seconds
Total Files: 41 created, 12 modified

What would you like to do?
A) Approve implementation
B) Request iterations (specify changes)
C) Review generated code

User selects: A) Approve implementation
```

---

## Tips for Orchestrator Implementation

### When Executing Groups

1. **Start each group**: Log "🏗️ Group [N]: [Name] - Starting..."
2. **Execute specialists**: Follow specialist spec from agent-specs/
3. **Update after each**: Write specialist results to design document
4. **Show completion**: Log "✅ Group [N]: [Name] - Completed"
5. **Report progress**: Show formatted progress report
6. **Checkpoint**: Use AskUserQuestion for user approval

### When Handling Failures

1. **Stop immediately**: Don't continue to next specialist
2. **Show context**: Specialist name, error, affected files
3. **Ask user**: Use AskUserQuestion with 3 options
4. **Handle choice**: Retry (with adjustments) / Skip / Stop
5. **Log outcome**: Record in design document

### When Reporting Progress

1. **Be concise**: Summarize key artifacts, not every detail
2. **Show counts**: Number of tables, operations, workflows, etc.
3. **List files**: Specific paths help users locate changes
4. **Show duration**: Helps users understand effort
5. **Preview next**: Help users understand what's coming

---

## Integration with Design Document

The design document's Implementation section mirrors the group structure:

```markdown
## Implementation

### Group 1: Foundation (Data Layer)
**Started**: 2025-01-12 14:30:00
**Status**: ✅ Completed

#### 1. schema-designer
[detailed results]

#### 2. repository-builder
[detailed results]

**Group Summary**: [as shown in progress report]
**Checkpoint**: ✅ Approved at 14:30:45

---

### Group 2: Domain Core (Functional Core)
[similar structure]
```

This provides:
- Full traceability of execution
- Clear boundaries between groups
- Checkpoint approval tracking
- Easy navigation of implementation log
