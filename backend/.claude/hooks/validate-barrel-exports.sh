#!/bin/bash
# Validate barrel export compliance for FCIS architecture
# This hook ensures only appropriate exports are present in barrel files

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "❌ ERROR: File not found: $FILE" >&2
  exit 1
fi

# Extract directory to determine domain
DIR=$(dirname "$FILE")
DOMAIN=$(basename "$DIR")

echo "🔍 Validating barrel exports for domain: $DOMAIN" >&2

# Check for operation exports (should NOT be exported)
if grep -q "export.*\.operations" "$FILE"; then
  echo "❌ ERROR: Barrel export contains operations (implementation details)" >&2
  echo "   Operations should remain internal to the domain" >&2
  echo "   File: $FILE" >&2
  exit 1
fi

# Check for internal type exports (should NOT be exported)
if grep -q 'from ['\''"]./types/internal' "$FILE"; then
  echo "❌ ERROR: Barrel export contains internal types" >&2
  echo "   Internal types should not be part of public API" >&2
  echo "   File: $FILE" >&2
  exit 1
fi

# Check for helper/rule exports (should NOT be exported)
if grep -qE "export.*\.(helpers|rules)" "$FILE"; then
  echo "❌ ERROR: Barrel export contains helpers or rules (internal utilities)" >&2
  echo "   These should remain private to the domain" >&2
  echo "   File: $FILE" >&2
  exit 1
fi

# Verify workflow exports (SHOULD be exported)
if ! grep -q "export.*\.workflow" "$FILE"; then
  echo "⚠️  WARNING: No workflow exports found" >&2
  echo "   Domains typically export workflows as entry points" >&2
  echo "   File: $FILE" >&2
fi

# Verify type exports (SHOULD be exported)
if ! grep -qE "export (type|interface)" "$FILE"; then
  echo "⚠️  WARNING: No type exports found" >&2
  echo "   Domains typically export input/output types" >&2
  echo "   File: $FILE" >&2
fi

echo "✅ Barrel exports validated successfully" >&2
exit 0
