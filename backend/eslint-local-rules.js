// Custom ESLint rules for enforcing barrel imports

/**
 * Rule: no-direct-core-imports
 * Prevents handlers from importing directly from core domain files
 */
export const noDirectCoreImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Handlers must import workflows from domain barrels, not directly from files",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      workflow:
        "Import workflows from domain barrel instead: #core/{{domain}} (not #core/{{domain}}/{{file}})",
      operation:
        "Handlers cannot import operations. Import workflows from domain barrel: #core/{{domain}}",
      composition:
        "Handlers cannot import compositions. Import workflows from domain barrel: #core/{{domain}}",
      rule: "Handlers cannot import rules. Import workflows from domain barrel: #core/{{domain}}",
      helper:
        "Handlers cannot import helpers. Import workflows from domain barrel: #core/{{domain}}",
      internalType:
        "Handlers cannot import internal types. Import public types from domain barrel: #core/{{domain}}",
    },
    schema: [],
  },
  create(context) {
    // Only apply in src/routes/**/*.ts files
    const filename = context.filename || context.getFilename();
    if (!filename.includes("/routes/")) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Check if importing from #core/
        if (!source.startsWith("#core/")) {
          return;
        }

        // Extract parts: #core/domain/file.type.js
        const match = source.match(/#core\/([^/]+)\/(.+)$/);
        if (!match) {
          // Importing from barrel (#core/domain) is OK
          return;
        }

        const [, domain, file] = match;

        // Check for forbidden file types (with or without .js extension)
        if (file.endsWith(".workflow.js") || file.endsWith(".workflow")) {
          context.report({
            node: node.source,
            messageId: "workflow",
            data: { domain, file },
          });
        } else if (
          file.endsWith(".operations.js") ||
          file.endsWith(".operations")
        ) {
          context.report({
            node: node.source,
            messageId: "operation",
            data: { domain, file },
          });
        } else if (
          file.endsWith(".compositions.js") ||
          file.endsWith(".compositions")
        ) {
          context.report({
            node: node.source,
            messageId: "composition",
            data: { domain, file },
          });
        } else if (file.endsWith(".rules.js") || file.endsWith(".rules")) {
          context.report({
            node: node.source,
            messageId: "rule",
            data: { domain, file },
          });
        } else if (file.endsWith(".helpers.js") || file.endsWith(".helpers")) {
          context.report({
            node: node.source,
            messageId: "helper",
            data: { domain, file },
          });
        } else if (
          file.includes("/types/internal.js") ||
          file.includes("/types/internal")
        ) {
          context.report({
            node: node.source,
            messageId: "internalType",
            data: { domain, file },
          });
        }
      },
    };
  },
};
