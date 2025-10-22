#!/bin/bash

set -e

echo "🔄 Generating TypeScript types from OpenAPI contracts..."

# Generate TypeScript types
cd shared
npm run generate:ts-types

echo "✅ TypeScript types generated successfully!"

# Generate Python types for AI service
echo "🔄 Generating Python types from backend-ai-api.yaml..."

if command -v datamodel-codegen &> /dev/null; then
    datamodel-codegen \
        --input contracts/backend-ai-api.yaml \
        --output ../ai-service/src/generated_types.py \
        --input-file-type openapi \
        --output-model-type pydantic_v2.BaseModel
    echo "✅ Python types generated successfully!"
else
    echo "⚠️  datamodel-code-generator not found. Skipping Python type generation."
    echo "   Install it with: pip install datamodel-code-generator"
fi

echo ""
echo "✨ Type generation complete!"
