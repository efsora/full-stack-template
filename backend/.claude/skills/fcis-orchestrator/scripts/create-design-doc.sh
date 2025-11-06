#!/bin/bash
# Create a new FCIS design document
# Usage: create-design-doc.sh [task-description]

TASK="${1:-New FCIS Implementation}"
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
DESIGN_DOC=".claude/temp/fcis-design-$TIMESTAMP.md"

# Ensure temp directory exists
mkdir -p .claude/temp

# Create design document
cat > "$DESIGN_DOC" <<EOF
# FCIS Implementation Design

**Task**: $TASK
**Domain**: [To be determined]
**Created**: $TIMESTAMP
**Status**: analysis

---

## Analysis

**Primary Domain**: [To be determined]
**Existing Domain**: [Yes/No]

**Pattern Analysis**:
- Naming conventions: [To be analyzed]
- File structure: [To be analyzed]
- Common workflows: [To be analyzed]
- Error codes: [To be analyzed]
- Value objects: [To be analyzed]

**Required Components**:
- Database: [To be determined]
- Workflows: [To be determined]
- Operations: [To be determined]
- Value Objects: [To be determined]
- External Services: [To be determined]
- Routes: [To be determined]
- Types: [To be determined]

**Status**: ⏳ Pending

---

## Design

### Database Schema
[To be designed]

### Type System
**Input Types**: [To be designed]
**Output Types**: [To be designed]
**Error Types**: [To be designed]
**Value Objects**: [To be designed]

### Business Logic
**Operations**: [To be designed]
**Workflows**: [To be designed]

### Repository
[To be designed]

### External Services
[To be designed]

### HTTP Layer
**Routes**: [To be designed]
**Handlers**: [To be designed]
**Schemas**: [To be designed]

### Tests
[To be designed]

**Status**: ⏳ Pending

---

## Planning

### File Inventory
**New Files**: [To be determined]
**Modified Files**: [To be determined]

### Conflict Detection
[To be determined]

### Pre-generation Validation
- [ ] Feasibility check
- [ ] Naming convention check
- [ ] FCIS compliance check
- [ ] Dependency check

### Execution Plan
[To be determined]

**Status**: ⏳ Pending

---

## Implementation

### Agent Execution Log
[Agents will log their execution here]

**Status**: ⏳ Pending

---

## Iteration Log
[Iteration history will be tracked here]

---

## Summary
[Final summary will be added here]
EOF

echo "📝 Design document created: $DESIGN_DOC"
echo "$DESIGN_DOC"
