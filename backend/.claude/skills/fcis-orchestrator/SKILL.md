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

### 5 Phases with Interactive Checkpoints

```
1. ANALYSIS → Checkpoint (approval required)
   ↓
2. DESIGN → Checkpoint (approval required)
   ↓
3. PLANNING → Checkpoint (approval required)
   ↓
4. IMPLEMENTATION → Checkpoint (approval required, ask for iterations)
   ↓
5. ITERATION (if requested)
```

### Pattern Learning

Before designing, the orchestrator analyzes ALL existing domains in `src/core/` to learn:

- Naming conventions
- File organization patterns
- Common workflows
- Error handling patterns
- Value object usage

This ensures generated code matches your codebase style.

### Specialist Agents (Sequential Execution)

11 specialist agents execute in order:

1. **schema-designer**: Database schemas + migrations
2. **repository-builder**: Repository factory functions
3. **external-service-builder**: External API clients (email, payment, etc.)
4. **value-object-creator**: Type-safe domain primitives
5. **operations-builder**: Pure business operations
6. **workflow-composer**: Railway-oriented workflows
7. **route-generator**: HTTP layer (routes, handlers, schemas)
8. **openapi-registrar**: API documentation
9. **test-generator**: Unit tests for pure functions
10. **validator**: Architectural compliance (blocking)
11. **refactoring-agent**: Align existing code (conditional)

### Educational Explanations

As agents work, you'll see inline explanations of FCIS principles:

- Why certain patterns are used
- How components fit together
- Best practices and conventions

### State Management

All work is tracked in `.claude/temp/fcis-design-[timestamp].md`:

- Analysis findings
- Design specifications
- Execution plan
- Implementation log
- Iteration history

This document serves as communication between agents and provides full traceability.

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

✅ **Code Quality**

- ESLint passes
- TypeScript type checking passes

Validation is **blocking** - failures must be resolved before proceeding.

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

**Q: Agent keeps failing?**
A: Check design document for error details. May need to adjust task description.

**Q: Generated code doesn't match my style?**
A: Ensure existing domains follow patterns you want. Orchestrator learns from them.

**Q: Validation blocking implementation?**
A: Review validation errors in design document. Indicates architectural issue.

## Support

For issues or feature requests:

- Check design document: `.claude/temp/fcis-design-*.md`
- Review agent logs in design document
- Check hook outputs in terminal
- Consult CLAUDE.md in backend folder

## Version

**1.0.0** - Initial release

- 5-phase orchestration
- 11 specialist agents
- Interactive checkpoints
- Pattern learning
- Iteration support
