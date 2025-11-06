---
description: Create FCIS backend implementation with guided orchestration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-hint: [--plan-only] task-description
model: sonnet
---

# FCIS Create Command

Create a new FCIS backend implementation with interactive guidance through analysis, design, planning, and implementation phases.

## Usage

```bash
/fcis:create "Add password reset feature"
/fcis:create --plan-only "Add payment processing"
/fcis:create "Add email verification to user registration"
```

## Arguments

- `--plan-only`: Optional flag to stop after planning phase (don't implement)
- `task-description`: Natural language description of what to build (required)

## What This Command Does

This command activates the **FCIS Orchestrator Skill** and invokes the main orchestrator agent to:

1. **Analyze Phase**: Learn patterns from existing domains, identify requirements
2. **Design Phase**: Design all components (schema, types, logic, routes, tests)
3. **Planning Phase**: Create execution plan and validate feasibility
4. **Implementation Phase**: Sequential execution of 11 specialist agents
5. **Iteration Phase**: Handle developer feedback and refinements

## Process Flow

### Step 1: Parse Arguments

Extract `--plan-only` flag and task description from arguments.

### Step 2: Create Design Document

Generate a timestamped design document at `.claude/temp/fcis-design-[timestamp].md` to track all phases and decisions.

### Step 3: Invoke Orchestrator

Use the Task tool to invoke the `fcis-orchestrator` agent with:
- Task description
- Plan-only flag (if provided)
- Design document path

The orchestrator will coordinate all phases with interactive checkpoints for approval.

### Step 4: Display Summary

After orchestrator completes, display:
- Design document location
- Files generated/modified
- Validation results
- Next steps (run dev server, tests, migrations)

## Example Output

```
🎯 FCIS Orchestrator Starting...

Task: Add password reset feature
Mode: Full implementation
Design Document: .claude/temp/fcis-design-2025-01-06-14-30-45.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing existing domains...
Found patterns:
  - Naming: camelCase functions, PascalCase types
  - Error codes: USER_* prefix for user domain
  - Value objects: Email, Password

Primary domain: users (existing)

Required components:
  - Database: password_reset_tokens table
  - Workflows: requestPasswordReset, resetPassword
  - Operations: 4 operations
  - Value Objects: ResetToken
  - External Services: EmailService
  - Routes: 2 new endpoints
  - Tests: ResetToken unit tests

📚 FCIS Principle: "Database schema is infrastructure (Imperative Shell)"

[CHECKPOINT] Review analysis and approve to continue?
  ✓ Yes, proceed with design
  ○ No, adjust requirements
  ○ Modify task description

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 2: DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Designing database schema...
  ✓ password_reset_tokens table (id, user_id, token, expires_at)
  ✓ Indexes for performance

Designing type system...
  ✓ RequestResetInput, ResetPasswordInput
  ✓ ResetResult output type
  ✓ ResetToken value object

Designing business logic...
  ✓ 4 operations (validate, generate, send, update)
  ✓ 2 workflows (request, reset)

Designing HTTP layer...
  ✓ POST /auth/reset-request
  ✓ POST /auth/reset

📚 FCIS Principle: "Workflows compose operations with pipe()"

[CHECKPOINT] Review design and approve to continue?
  ✓ Yes, proceed with planning
  ○ No, adjust design
  ○ Show more details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 3: PLANNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File inventory:
  8 new files
  6 files to modify

Conflict detection:
  ✓ No conflicts detected

Pre-generation validation:
  ✅ Feasibility: All components implementable
  ✅ Naming: Follows camelCase/PascalCase conventions
  ✅ Compliance: Uses pipe(), command(), barrel exports
  ✅ Dependencies: EmailService needs creation

Execution plan: 10 agents sequential

[CHECKPOINT] Review plan and approve to continue?
  ✓ Yes, start implementation
  ○ No, adjust plan
  ○ Show file list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 4: IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/10] schema-designer
  ✅ Generated schema + migration
  📚 "Database schema is infrastructure (Imperative Shell)"

[2/10] repository-builder
  ✅ Added 3 methods to UserRepository
  📚 "Repository uses factory pattern for dependency injection"

[3/10] external-service-builder
  ✅ Created EmailService
  📚 "External services wrapped for Functional Core consumption"

[4/10] value-object-creator
  ✅ Created ResetToken value object
  📚 "Value objects prevent primitive obsession"

[5/10] operations-builder
  ✅ Created 4 operations in password-reset.operations.ts
  📚 "Operations wrap side effects in command()"

[6/10] workflow-composer
  ✅ Created 2 workflows in password-reset.workflow.ts
  📚 "Workflows compose with pipe() for railway-oriented programming"

[7/10] route-generator
  ✅ Added routes, handlers, schemas to /auth
  📚 "HTTP layer is Imperative Shell"

[8/10] openapi-registrar
  ✅ Registered 2 API paths
  📚 "API docs derived from type-safe schemas"

[9/10] test-generator
  ✅ Generated ResetToken.test.ts
  📚 "Pure functions easily testable without mocks"

[10/10] validator
  ✅ All architectural checks passed
    ✅ Barrel exports compliant
    ✅ Import rules compliant
    ✅ Type conventions compliant
    ✅ Result usage compliant
    ✅ ESLint passed
    ✅ Type check passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IMPLEMENTATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated Files:
  ✓ src/db/schema.ts (modified)
  ✓ src/db/migrations/0003_add_password_reset_tokens.sql (new)
  ✓ src/infrastructure/repositories/drizzle/UserRepository.ts (modified)
  ✓ src/infrastructure/services/EmailService.ts (new)
  ✓ src/core/users/value-objects/ResetToken.ts (new)
  ✓ src/core/users/password-reset.operations.ts (new)
  ✓ src/core/users/password-reset.workflow.ts (new)
  ✓ src/core/users/index.ts (modified)
  ✓ src/routes/auth/schemas.ts (modified)
  ✓ src/routes/auth/handlers.ts (modified)
  ✓ src/routes/auth/routes.ts (modified)
  ✓ src/openapi/paths/auth.ts (modified)
  ✓ tests/value-objects/ResetToken.test.ts (new)

Design Document:
  📄 .claude/temp/fcis-design-2025-01-06-14-30-45.md

Validation:
  ✅ All architectural checks passed

[CHECKPOINT] Request iterations or complete?
  ✓ Complete (no changes needed)
  ○ Make changes (describe what to modify)
  ○ Show generated code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Apply database migration:
   npx drizzle-kit migrate

2. Start development server:
   npm run dev

3. Test new endpoints:
   POST http://localhost:3000/api/v1/auth/reset-request
   POST http://localhost:3000/api/v1/auth/reset

4. Run tests:
   npm run test

5. Check implementation:
   Review design document for detailed information
```

## Plan-Only Mode

When using `--plan-only`, the command stops after the Planning phase without implementing:

```
/fcis:create --plan-only "Add payment processing"

... (Analysis, Design, Planning phases) ...

[CHECKPOINT] Plan complete. Review plan?
  ✓ Looks good
  ○ Show file list
  ○ Show detailed design

Plan saved to: .claude/temp/fcis-design-2025-01-06-15-00-00.md

To implement this plan, run:
/fcis:create "Add payment processing"
```

## Error Handling

If an agent fails during execution:
- Error is logged to design document
- Orchestrator analyzes failure reason
- Retry with adjusted parameters (max 3 attempts)
- If still fails, stops and reports error

## Notes

- Always reads CLAUDE.md for project-specific guidance
- Design document persists for reference and debugging
- Hooks run automatically during implementation (formatting, validation)
- Validation is blocking - architectural violations must be resolved
- Full audit trail maintained in design document
