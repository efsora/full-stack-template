#!/bin/bash
# Analyze a domain for patterns
# Usage: analyze-domain.sh <domain-name>

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: analyze-domain.sh <domain-name>"
  echo "Example: analyze-domain.sh users"
  exit 1
fi

DOMAIN_PATH="src/core/$DOMAIN"

if [ ! -d "$DOMAIN_PATH" ]; then
  echo "❌ Domain not found: $DOMAIN_PATH"
  exit 1
fi

echo "🔍 Analyzing domain: $DOMAIN"
echo ""

echo "📁 Files:"
find "$DOMAIN_PATH" -type f -name "*.ts" | sort
echo ""

echo "🔄 Workflows:"
if ls "$DOMAIN_PATH"/*.workflow.ts 1> /dev/null 2>&1; then
  grep -r "export function" "$DOMAIN_PATH"/*.workflow.ts 2>/dev/null | sed 's/.*export function /  - /' | sed 's/(.*$//'
else
  echo "  (none)"
fi
echo ""

echo "📦 Barrel exports:"
if [ -f "$DOMAIN_PATH/index.ts" ]; then
  cat "$DOMAIN_PATH/index.ts"
else
  echo "  ❌ No barrel export file (index.ts)"
fi
echo ""

echo "⚠️  Error codes:"
ERROR_CODES=$(grep -rh "code: \"" "$DOMAIN_PATH" 2>/dev/null | grep -o '"[A-Z_]*"' | sort -u | tr '\n' ' ')
if [ -n "$ERROR_CODES" ]; then
  echo "  $ERROR_CODES"
else
  echo "  (none)"
fi
echo ""

echo "🏷️  Value objects:"
if [ -d "$DOMAIN_PATH/value-objects" ]; then
  ls "$DOMAIN_PATH/value-objects"/*.ts 2>/dev/null | xargs -n 1 basename | sed 's/\.ts$//' | sed 's/^/  - /'
else
  echo "  (none)"
fi
echo ""

echo "📊 File structure:"
tree -L 2 "$DOMAIN_PATH" 2>/dev/null || find "$DOMAIN_PATH" -type d | sed 's|'"$DOMAIN_PATH"'||' | sed 's|^/|  |'
echo ""

echo "✅ Analysis complete"
