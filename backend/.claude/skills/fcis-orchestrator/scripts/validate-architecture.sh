#!/bin/bash
# Validate FCIS architecture compliance
# Usage: validate-architecture.sh

echo "🔍 Validating FCIS Architecture..."
echo ""

ERRORS=0

# Check barrel exports
echo "📦 Checking barrel exports..."
for barrel in src/core/*/index.ts; do
  if [ ! -f "$barrel" ]; then
    continue
  fi

  DOMAIN=$(dirname "$barrel" | xargs basename)

  # Check for operation exports (should NOT be exported)
  if grep -q "export.*\.operations" "$barrel" 2>/dev/null; then
    echo "  ❌ Operations exported in $barrel"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for internal type exports (should NOT be exported)
  if grep -q 'from.*types/internal' "$barrel" 2>/dev/null; then
    echo "  ❌ Internal types exported in $barrel"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for helper exports (should NOT be exported)
  if grep -qE "export.*\.(helpers|rules)" "$barrel" 2>/dev/null; then
    echo "  ❌ Helpers or rules exported in $barrel"
    ERRORS=$((ERRORS + 1))
  fi

  # Positive check: workflow exports should exist
  if ! grep -q "export.*\.workflow" "$barrel" 2>/dev/null; then
    echo "  ⚠️  WARNING: No workflow exports in $barrel"
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "  ✅ All barrel exports compliant"
fi
echo ""

# Check handler imports
echo "🔗 Checking handler imports..."
for handler in src/routes/*/handlers.ts; do
  if [ ! -f "$handler" ]; then
    continue
  fi

  # Check for direct workflow imports (should use barrel)
  if grep -q 'from ['\''"]#core/.*/.*\.workflow' "$handler" 2>/dev/null; then
    echo "  ❌ Direct workflow import in $handler"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for operation imports (should NEVER import)
  if grep -q 'from ['\''"]#core/.*/.*\.operations' "$handler" 2>/dev/null; then
    echo "  ❌ Operation import in $handler"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for internal type imports (should NOT import)
  if grep -q 'from ['\''"]#core/.*/types/internal' "$handler" 2>/dev/null; then
    echo "  ❌ Internal type import in $handler"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "  ✅ All handler imports compliant"
fi
echo ""

# Run ESLint
echo "🔧 Running ESLint..."
if npm run lint --silent 2>/dev/null; then
  echo "  ✅ ESLint passed"
else
  echo "  ❌ ESLint failed"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Run type check
echo "📘 Running TypeScript type check..."
if npm run type-check --silent 2>/dev/null; then
  echo "  ✅ Type check passed"
else
  echo "  ❌ Type check failed"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed - FCIS architecture is compliant"
  exit 0
else
  echo "❌ $ERRORS error(s) found - please fix architectural violations"
  exit 1
fi
