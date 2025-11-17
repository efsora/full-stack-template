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
argument-hint: task-description
model: sonnet
---

# FCIS Create - Execute Orchestration

You are now executing the FCIS Orchestrator workflow to implement: **$ARGUMENTS**

## Parse Arguments

```
Arguments: $ARGUMENTS
```

Task description: $ARGUMENTS

## Read Orchestrator Instructions

Read the orchestrator workflow from `.claude/skills/fcis-orchestrator/agent-specs/orchestrator.md` and follow it exactly.

The orchestrator spec defines a 7-phase workflow:

1. **Phase 1: Analysis**
   - Analyze existing domains in `src/core/`
   - Learn patterns (naming, structure, errors, value objects)
   - Identify required components
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

2. **Phase 1.5: Q&A Session**
   - Conduct gap analysis on task requirements
   - Generate clarifying questions in batches (max 4 per batch)
   - Ask about authentication, validation, pagination, error handling, etc.
   - Resolve ambiguities and implementation options
   - Record all Q&A in design document
   - **SKIPPED IF**: No ambiguities detected (shows "No ambiguities detected, proceeding to Design")

3. **Phase 2: Design**
   - Design database schema (informed by Q&A decisions)
   - Design type system
   - Design business logic
   - Design repositories
   - Design HTTP layer
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

4. **Phase 2.5: Design Validation**
   - Validate Design completeness before implementation
   - Check all sections: database, types, business logic, repository, HTTP, external services, tests
   - If incomplete: Return to Design phase with missing items listed
   - If complete: Proceed to Planning
   - **PURPOSE**: Enables deterministic implementation (no questions during specialist execution)

5. **Phase 3: Planning**
   - Create file inventory
   - Detect conflicts
   - Pre-generation validation (feasibility, naming, compliance, dependencies)
   - Create execution plan
   - Update design document
   - **CHECKPOINT**: Use AskUserQuestion for approval

6. **Phase 4: Implementation** (Grouped with Deterministic Execution)
   - Execute 11 specialists in 5 logical groups
   - Group 1: Foundation → Checkpoint
   - Group 2: Domain Core → Checkpoint
   - Group 3: HTTP Shell → Checkpoint
   - Group 4: Quality Assurance (BLOCKING) → Checkpoint
   - Group 5: Refinement (conditional) → Checkpoint
   - Specialists follow Design specs exactly (no design questions)
   - Pattern learning fills minor gaps (naming, structure)
   - If Design incomplete: Specialist stops and reports (returns to Design phase)

7. **Phase 5: Iteration** (if requested)
   - Collect feedback
   - Re-run affected specialists or groups
   - Update design document

## Design Document

The orchestrator will create and manage the design document at: `.claude/temp/fcis-design-[timestamp].md`

**Note**: The orchestrator creates the design document as its first action (before Analysis phase begins). You should update this document throughout execution as each phase completes.

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

Reference these during code generation and Q&A:
- **Templates**: `.claude/skills/fcis-orchestrator/templates/*.tmpl`
  - `qa-questions.tmpl` - Reusable question templates for common scenarios
- **Patterns**: `.claude/skills/fcis-orchestrator/patterns/*.md`
  - `qa-generation-patterns.md` - Gap analysis and question generation methodology

## Remember

- **Interactive**: Stop at each checkpoint for approval
- **Educational**: Explain FCIS principles inline
- **Pattern Learning**: Analyze existing domains first
- **Sequential**: Complete one specialist before starting next
- **Merge**: Add to existing files, don't replace
- **Validate**: Enforce architectural rules (blocking)

---

**Now execute the orchestration following the orchestrator spec exactly!**
