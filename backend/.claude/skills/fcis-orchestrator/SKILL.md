---
name: fcis-orchestrator
description: Comprehensive orchestration system for generating FCIS (Functional Core, Imperative Shell) backend implementations with interactive guidance, pattern learning, and specialist agent coordination
version: 1.0.0
---

# FCIS Orchestrator Skill

This skill provides a complete orchestration system for implementing FCIS architecture patterns in backend applications. It coordinates specialist agents through analysis, design, planning, and implementation phases with interactive developer checkpoints.

## What is FCIS Architecture?

**Functional Core, Imperative Shell** separates:

- **Functional Core**: Pure business logic with no side effects (workflows, operations, value objects)
- **Imperative Shell**: Infrastructure and I/O (repositories, services, HTTP routes)

Benefits:

- Testable business logic without mocks
- Clear separation of concerns
- Type-safe domain modeling
- Automatic observability

## When This Skill Activates

This skill automatically activates when you:

- Ask to create new backend features or domains
- Request FCIS-compliant implementations
- Need to refactor existing code to FCIS patterns
- Want to add endpoints, workflows, or business logic

Or manually invoke with: `/fcis:create [task description]`

## How It Works

### 7 Phases with Interactive Checkpoints

```
1. ANALYSIS → Checkpoint (approval required)
   ↓
2. Q&A SESSION (resolves ambiguities)
   ↓
3. DESIGN → Checkpoint (approval required)
   ↓
3.5. DESIGN VALIDATION (ensures completeness)
   ↓
4. PLANNING → Checkpoint (approval required)
   ↓
5. IMPLEMENTATION (5 groups with checkpoints between each)
   ↓
6. ITERATION (if requested)
```

### Deterministic Implementation

**Key Feature**: Implementation phase executes deterministically without asking design questions.

**How**:
- Q&A Session resolves all ambiguities upfront
- Design phase specifies all implementation details
- **Design Validation** ensures completeness before implementation
- Specialists follow Design specs exactly
- Pattern learning fills minor gaps (naming, structure)
- Only ask if Design spec genuinely unclear (very rare)

### Q&A Session (Phase 2)

**Purpose**: Bridge Analysis and Design by resolving gaps, ambiguities, and implementation options through interactive questioning.

**How It Works**:
- Conducts gap analysis comparing task description against learned patterns
- Generates clarifying questions in batches (max 4 per batch)
- Asks about authentication, validation, pagination, error handling, performance, etc.
- Dynamically generates follow-up questions based on previous answers
- Detects contradictions and asks for clarification
- Skips entirely if no ambiguities detected

**Question Categories**:
- Database Design (schema, relationships, constraints, indexes)
- Business Logic (validation, error handling, state transitions)
- API Design (endpoints, authentication, pagination, rate limiting)
- External Services (providers, fallbacks, timeouts)
- Testing (coverage, edge cases, test data)
- Performance (caching, optimization, scalability)

**Benefits**:
- Ensures complete requirements before Design phase
- Reduces back-and-forth during implementation
- Captures architectural decisions with reasoning
- Provides educational context for each option
- Full traceability in design document

### Design Validation (Phase 3.5)

**Purpose**: Ensure Design specifications are complete before implementation begins, preventing specialists from asking uncertain questions.

**What Gets Validated**:
- Database schema completeness (tables, columns, types, constraints, indexes, cascades)
- Type system completeness (inputs, outputs, errors with codes, value objects with validation)
- Business logic completeness (operations, workflows, error handling, validation rules)
- Repository completeness (methods specified, transaction support)
- HTTP layer completeness (routes, handlers, schemas, auth requirements)
- External services completeness (providers, interfaces, timeouts if applicable)
- Test completeness (coverage scope, scenarios)

**Validation Result**:
- ✅ **Complete**: Proceed to Planning phase
- ❌ **Incomplete**: Return to Design phase with specific missing items listed

**Why This Matters**:
- Prevents specialists from encountering gaps during implementation
- Enables deterministic execution (same Design → same code)
- Eliminates uncertain questions during implementation
- Ensures smooth execution from Group 1 through Group 5

### Pattern Learning

Before designing, the orchestrator analyzes ALL existing domains in `src/core/` to learn:

- Naming conventions
- File organization patterns
- Common workflows
- Error handling patterns
- Value object usage

This ensures generated code matches your codebase style.

### Grouped Automation (5 Logical Groups)

11 specialist agents execute in **5 logical groups** with automatic execution within groups and checkpoints between groups:

#### Group 1: Foundation (Data Layer)
- **schema-designer**: Database schemas + migrations
- **repository-builder**: Repository factory functions
- **Checkpoint**: Review database design

#### Group 2: Domain Core (Functional Core)
- **external-service-builder**: External API clients (email, payment, etc.)
- **value-object-creator**: Type-safe domain primitives
- **operations-builder**: Pure business operations
- **workflow-composer**: Railway-oriented workflows
- **Checkpoint**: Review business logic

#### Group 3: HTTP Shell (Imperative Shell)
- **route-generator**: HTTP layer (routes, handlers, schemas)
- **openapi-registrar**: API documentation
- **Checkpoint**: Review API design

#### Group 4: Quality Assurance (Validation)
- **test-generator**: Unit tests for pure functions
- **validator**: Comprehensive validation (architectural + runtime checks)
- **Checkpoint (BLOCKING)**: Must pass all validation checks

#### Group 5: Refinement (Conditional)
- **refactoring-agent**: Align existing code (only if needed)
- **Checkpoint**: Approve refactoring

**Execution Strategy**:
- Specialists execute automatically within each group
- Checkpoints between groups for user review and approval
- Stop-on-failure within groups (ask user: Retry/Skip/Stop)
- Progress reported after each group completes

### Educational Explanations

As agents work, you'll see inline explanations of FCIS principles:

- Why certain patterns are used
- How components fit together
- Best practices and conventions

### State Management

All work is tracked in `.claude/temp/fcis-design-[timestamp].md`:

- Analysis findings
- Q&A session (questions, answers, reasoning)
- Design specifications
- Execution plan
- Implementation log (organized by groups)
- Group checkpoints and approvals
- Iteration history

This document serves as communication between agents and provides full traceability.

**Grouped Implementation Log**: The implementation section is organized by the 5 logical groups (Foundation, Domain Core, HTTP Shell, Quality Assurance, Refinement), with each group showing its specialists, execution results, and checkpoint status.

## Usage Examples

### Create New Domain

```
/fcis:create "Add user profile management with avatar upload"
```

### Add Feature to Existing Domain

```
/fcis:create "Add password reset functionality to users domain"
```

### Refactor Existing Code

```
/fcis:create "Refactor authentication to use FCIS patterns"
```

## What Gets Generated

For a typical feature, you'll get:

**Database Layer**:

- Schema definitions (Drizzle ORM)
- Migration files

**Infrastructure Layer** (Imperative Shell):

- Repository factory functions
- External service clients
- Barrel exports

**Core Layer** (Functional Core):

- Value objects (branded types)
- Operations (business logic with `command()`)
- Workflows (composition with `pipe()`)
- Type definitions (inputs, outputs, errors, internal)
- Barrel exports

**HTTP Layer** (Imperative Shell):

- Zod schemas with OpenAPI metadata
- Request handlers (barrel imports only)
- Route definitions
- OpenAPI path registrations

**Tests**:

- Unit tests for value objects
- Unit tests for pure functions

## Architectural Guarantees

The **validator** agent enforces:

✅ **Barrel Export Compliance**

- Only workflows, public types, and value objects exported
- No operations, internal types, or helpers in public API

✅ **Import Rules**

- Handlers import workflows ONLY from barrel exports
- No direct operation or internal type imports

✅ **Type Conventions**

- DTOs use `type`
- Contracts use `interface`

✅ **Result Usage**

- Workflows use `pipe()` for composition
- Operations use `command()` for side effects
- Proper error handling with `fail()`

✅ **Repository Pattern**

- Factory functions for dependency injection
- `withTransaction` support for all repositories

✅ **TypeScript Code Quality**

The validator enforces TypeScript quality rules with multi-method detection and automatic fixes:

**Rule 1: Never Use `any` Type**
- All values have proper types (User, string, CreateInput)
- Use `unknown` for truly unknown values, then validate
- Detection: Grep + tsc + ESLint + npm scripts (check:any, check:types)

**Rule 2: All Values Properly Typed**
- Function parameters: Always explicitly typed
- Function return types: Always explicit
- Variables: Typed when not obvious from context

**Rule 3: Minimal Type Casting**
- Avoid `as Type` unless absolutely necessary
- Only allowed after: Runtime validation (Zod), type guards, external data validation
- Required: Justification comment explaining necessity

**Rule 4: Pattern Consistency**
- Use type patterns learned from existing domains
- Branded types for domain primitives (Email, UserId, TransactionId)
- Utility types for updates (Partial<Pick<>>)
- Consistent type file organization

**Detection**: 4 methods (Grep + tsc + ESLint + npm scripts)
**Enforcement**: Multi-layer (pattern learning + specialist guidelines + validator checks)
**Auto-Fix**: Replaces `any`, adds type annotations, removes unnecessary casts
**Blocking**: Unfixable violations block implementation

**npm Scripts Available**:
- `npm run check:any` - Detect any type usage
- `npm run check:types` - Strict type checking
- `npm run check:casting` - Report type casting instances
- `npm run check:typescript-quality` - All checks combined

✅ **Code Pattern Quality**

The validator enforces layer-specific code patterns with tiered severity:

**Critical Patterns** (Blocking):
- Zod deprecated APIs: Auto-fix `z.string().uuid()` → `z.uuid()` (ZODB001)
- Use current API versions (Zod v4+)

**Important Patterns** (Warning):
- Handler response explicitness: Prefer explicit field mapping over implicit data returns (HTTP001)
- Infrastructure types: Use Drizzle schema types, not inline types `Promise<{ ... }>` (INFR001)

**Layer-Specific Documentation**:
- Core patterns: Workflows, operations, value objects, type organization
- Infrastructure patterns: Repositories, services, database schemas
- HTTP patterns: Zod schemas, handlers, routes, OpenAPI

**Enforcement**: Tiered (Critical blocks, Important warns, Style informs)
**Extensible**: Pattern detection registry allows easy addition of new patterns
**Auto-Fix**: Safe replacements (deprecated APIs), reports for structural issues

✅ **Code Quality**

- ESLint passes
- TypeScript type checking passes

✅ **Runtime Readiness** (Post-Implementation Checklist)

- Format check with automatic Prettier application
- Lint check with auto-fix capability
- Type check with automatic error correction
- Test execution with user-guided fixes
- Build verification with automatic issue resolution

The validator includes a comprehensive post-implementation checklist that ensures generated code is production-ready:

1. **Format (Conditional)**: Runs Prettier only if lint detects formatting issues
2. **Lint**: Checks code quality, auto-fixes violations (unused imports, formatting, barrel exports)
3. **Type Check**: Verifies TypeScript types, auto-fixes common errors (missing imports, type mismatches)
4. **Test**: Runs test suite, asks user for guidance on failures
5. **Build**: Verifies production build, auto-fixes build errors (import paths, OpenAPI issues)

**Stop-on-Failure Strategy**: If any check fails, the validator automatically fixes the issue and retries ALL checks from the beginning. This continues until all checks pass or maximum retry limit (10) is reached.

**Automatic Fixes Include**:
- Formatting corrections (Prettier)
- Unused import removal
- Missing import additions
- Type annotation adjustments
- Import path corrections
- Barrel export fixes
- OpenAPI schema corrections

Validation is **fully blocking** - all checks must pass before implementation is considered complete.

## Hooks Integration

Project-level hooks in `.claude/settings.json` provide:

**PostToolUse** (after file edits):

- Auto-formatting with Prettier
- ESLint auto-fix
- Barrel export validation

**PreToolUse** (before file edits):

- Import rule checking
- Architectural compliance

**Stop** (after completion):

- Type checking
- Final validation

## Iteration Support

After implementation, you can request changes:

- "Make email validation stricter"
- "Add rate limiting to the endpoint"
- "Change password requirements"

The orchestrator:

1. Analyzes your feedback
2. Identifies affected agents
3. Re-runs only necessary agents
4. Updates design document
5. Returns to checkpoint

## Error Handling

If an agent fails:

1. Error logged to design document
2. Failure reason analyzed
3. Parameters adjusted (different approach)
4. Retry (max 3 attempts)
5. If still fails, stop and report

## File Organization

Generated files follow FCIS structure:

```
src/
├── core/[domain]/              # Functional Core
│   ├── value-objects/
│   ├── types/
│   │   ├── inputs.ts
│   │   ├── outputs.ts
│   │   ├── errors.ts
│   │   └── internal.ts
│   ├── *.operations.ts
│   ├── *.workflow.ts
│   └── index.ts                # Barrel export
├── infrastructure/             # Imperative Shell
│   ├── repositories/drizzle/
│   └── services/
├── routes/[domain]/            # HTTP Layer
│   ├── schemas.ts
│   ├── handlers.ts
│   └── routes.ts
├── openapi/paths/
└── db/
    ├── schema.ts
    └── migrations/
```

## Best Practices

1. **Be Specific**: Detailed task descriptions get better results
2. **Review Checkpoints**: Each phase builds on the previous
3. **Iterate Freely**: Request changes until it's right
4. **Learn Patterns**: Watch the explanations to understand FCIS
5. **Trust Validation**: The validator catches architectural issues

## FCIS Principles Reference

**Railway-Oriented Programming**: Use `pipe()` to compose operations. Errors automatically short-circuit.

**Command Pattern**: Wrap side effects in `command()` for automatic observability (tracing, metrics, logging).

**Barrel Exports**: Define public API boundaries. Only expose what consumers need.

**Repository Pattern**: Use factory functions for dependency injection and testing.

**Value Objects**: Prevent primitive obsession with type-safe domain primitives.

**Result Type**: Explicit success/failure handling without exceptions.

## Troubleshooting

**Q: Specialists asking questions during implementation?**
A: Design spec is incomplete. This should not happen if Design Validation (Phase 3.5) passed. The specialist will report what's missing and return to Design phase.

**Q: Agent keeps failing?**
A: Check design document for error details. May need to adjust task description.

**Q: Generated code doesn't match my style?**
A: Ensure existing domains follow patterns you want. Orchestrator learns from them.

**Q: Validation blocking implementation?**
A: Review validation errors in design document. Indicates architectural issue.

**Q: Design validation failed?**
A: Complete the missing Design specifications listed in the validation report, then proceed to Planning.

## Support

For issues or feature requests:

- Check design document: `.claude/temp/fcis-design-*.md`
- Review agent logs in design document
- Check hook outputs in terminal
- Consult CLAUDE.md in backend folder

## Version

**1.5.0** - Code Pattern Quality System

- Extensible code pattern quality system with layer-specific documentation
- 3 layer-specific pattern files: core-layer, infrastructure, http-layer
- Pattern detection registry for easy addition of new patterns
- Tiered enforcement: Critical (blocking), Important (warning), Style (info)
- Initial patterns: Zod deprecated APIs, handler explicitness, infrastructure type preferences
- Auto-fix for safe replacements (Zod APIs), reports for structural issues
- Multi-layer integration: Templates + Guidelines + Validator

**1.4.0** - TypeScript Code Quality Rules

- Integrated TypeScript quality rules enforcement (no `any`, proper types, minimal casting, pattern consistency)
- Multi-layer strategy: Pattern learning (Analysis) + Guidelines (Specialists) + Enforcement (Validator)
- Multi-method detection: Grep + tsc --noImplicitAny + ESLint + npm scripts
- Automatic fixes for violations (replace `any`, add annotations, remove unnecessary casts)
- Blocking enforcement: Unfixable violations block implementation
- Type pattern learning from existing domains

**1.3.0** - Deterministic Implementation

- Added Design Validation checkpoint (Phase 3.5) to ensure spec completeness
- Deterministic specialist execution (no design questions during implementation)
- Simplified group checkpoints (Proceed/Review only, no design adjustments)
- Specialist failure handling distinguishes Design incompleteness from technical errors
- Design incompleteness automatically returns to Design phase

**1.2.0** - Grouped Automation & Post-Implementation Checklist

- 5 logical groups for implementation phase (Foundation, Domain Core, HTTP Shell, QA, Refinement)
- Automatic execution within groups, checkpoints between groups
- Stop-on-failure with user interaction (Retry/Skip/Stop)
- Grouped progress reporting after each group
- Comprehensive post-implementation checklist in validator (format, lint, type-check, test, build)
- Automatic fixes with retry-all logic

**1.1.0** - Q&A Session Feature

- 6-phase orchestration (added Q&A session)
- Interactive gap analysis and clarifying questions
- Dynamic question generation based on answers
- Contradiction detection and resolution
- Full Q&A traceability in design documents

**1.0.0** - Initial release

- 5-phase orchestration
- 11 specialist agents
- Interactive checkpoints
- Pattern learning
- Iteration support
