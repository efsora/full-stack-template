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

# FCIS Create - Execute Orchestration

You are now executing the FCIS Orchestrator workflow to implement: **$ARGUMENTS**

## Parse Arguments

```
Arguments: $ARGUMENTS
```

- If starts with `--plan-only`: Extract flag and task
- Task description: Everything after flag (or entire string if no flag)

## Read Orchestrator Instructions

Read the orchestrator workflow from `.claude/skills/fcis-orchestrator/agent-specs/orchestrator.md` and follow it exactly.

The orchestrator spec defines a 5-phase workflow:

1. **Phase 1: Analysis**
   - Analyze existing domains in `src/core/`
   - Learn patterns (naming, structure, errors, value objects)
   - Identify required components
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

2. **Phase 2: Design**
   - Design database schema
   - Design type system
   - Design business logic
   - Design repositories
   - Design HTTP layer
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

3. **Phase 3: Planning**
   - Create file inventory
   - Detect conflicts
   - Pre-generation validation (feasibility, naming, compliance, dependencies)
   - Create execution plan
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

4. **Phase 4: Implementation** (skip if --plan-only)
   - Execute 11 specialist workflows sequentially
   - For each specialist, read its spec from `.claude/skills/fcis-orchestrator/agent-specs/[name].md`
   - Follow the specialist's instructions to generate code
   - Update design document after each
   - Provide FCIS principle explanations
   - **CHECKPOINT**: Use AskUserQuestion for iterations

5. **Phase 5: Iteration** (if requested)
   - Collect feedback
   - Re-run affected specialists
   - Update design document

## Design Document

Create design document first:

```bash
!`.claude/skills/fcis-orchestrator/scripts/create-design-doc.sh "$TASK"`
```

Update this document throughout execution at: `.claude/temp/fcis-design-[timestamp].md`

## Specialist Sequence (Phase 4 only)

When in implementation phase, execute these specialists in order by reading their specs:

1. `.claude/skills/fcis-orchestrator/agent-specs/schema-designer.md`
2. `.claude/skills/fcis-orchestrator/agent-specs/repository-builder.md`
3. `.claude/skills/fcis-orchestrator/agent-specs/external-service-builder.md`
4. `.claude/skills/fcis-orchestrator/agent-specs/value-object-creator.md`
5. `.claude/skills/fcis-orchestrator/agent-specs/operations-builder.md`
6. `.claude/skills/fcis-orchestrator/agent-specs/workflow-composer.md`
7. `.claude/skills/fcis-orchestrator/agent-specs/route-generator.md`
8. `.claude/skills/fcis-orchestrator/agent-specs/openapi-registrar.md`
9. `.claude/skills/fcis-orchestrator/agent-specs/test-generator.md`
10. `.claude/skills/fcis-orchestrator/agent-specs/validator.md`
11. `.claude/skills/fcis-orchestrator/agent-specs/refactoring-agent.md` (if needed)

For each specialist:
- Read its spec file
- Follow its Process section
- Use its templates from `.claude/skills/fcis-orchestrator/templates/`
- Update design document
- Provide FCIS education
- Handle errors with retry (max 3)

## Templates and Patterns

Reference these during code generation:
- **Templates**: `.claude/skills/fcis-orchestrator/templates/*.tmpl`
- **Patterns**: `.claude/skills/fcis-orchestrator/patterns/*.md`

## Remember

- **Interactive**: Stop at each checkpoint for approval
- **Educational**: Explain FCIS principles inline
- **Pattern Learning**: Analyze existing domains first
- **Sequential**: Complete one specialist before starting next
- **Merge**: Add to existing files, don't replace
- **Validate**: Enforce architectural rules (blocking)

---

**Now execute the orchestration following the orchestrator spec exactly!**
