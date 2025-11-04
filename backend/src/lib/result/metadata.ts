/**
 * Result Metadata Auto-Generation Utilities
 *
 * Pure functions for extracting metadata from runtime context.
 * Used by command() when metadata parameter is omitted.
 */

import StackTrace from "stacktrace-js";

/**
 * Extracts both function name and file path from the call stack using stacktrace-js.
 * Returns null for both if extraction fails.
 *
 * Uses stacktrace-js for reliable cross-platform stack trace parsing instead of manual regex.
 * Fallback to null values if extraction fails.
 *
 * @returns Object with functionName and filePath, or null values if extraction fails
 *
 * @example
 * ```ts
 * function myFunction() {
 *   const info = extractCallerInfo();
 *   // => { functionName: "myFunction", filePath: "/path/to/file.ts" }
 * }
 * ```
 */
export function extractCallerInfo(): {
  filePath: null | string;
  functionName: null | string;
} {
  try {
    // Use stacktrace-js to get structured stack frames (synchronous API)
    // Note: We use the synchronous getSync() which works in Node.js
    const stackFrames = StackTrace.getSync();

    if (stackFrames.length === 0) {
      return { filePath: null, functionName: null };
    }

    // Look for the first non-internal frame after extractCallerInfo and command
    // Stack typically looks like:
    // 0: extractCallerInfo
    // 1: command (when metadata is omitted)
    // 2+: actual caller frames
    for (let i = 2; i < stackFrames.length; i++) {
      const frame = stackFrames[i];

      const filePath = frame.fileName ?? null;
      let functionName = frame.functionName ?? null;

      // Skip if no file path available
      if (!filePath) {
        continue;
      }

      // Filter out internal/generic names
      if (functionName) {
        if (
          functionName === "anonymous" ||
          functionName === "<anonymous>" ||
          functionName === ""
        ) {
          functionName = null;
        }
        // Skip test framework internal functions
        else if (
          functionName.startsWith("test") ||
          functionName === "run" ||
          functionName === "runTest"
        ) {
          continue;
        }
      }

      return { filePath, functionName };
    }

    return { filePath: null, functionName: null };
  } catch {
    // Graceful degradation if stacktrace-js fails
    return { filePath: null, functionName: null };
  }
}

/**
 * Extracts the domain from a file path.
 * Looks for common patterns in both src/ and dist/ directories:
 * - src/core/{domain} or dist/core/{domain}
 * - src/services/{domain} or dist/services/{domain}
 * - src/routes/{domain} or dist/routes/{domain}
 *
 * @param filePath - Absolute file path (from stacktrace-js)
 * @returns Domain name or "unknown" if pattern not found
 *
 * @example
 * ```ts
 * extractDomainFromFilePath("/path/src/core/users/find.ts") // => "users"
 * extractDomainFromFilePath("/path/dist/core/users/login.js") // => "users"
 * extractDomainFromFilePath("/path/src/services/redis/client.ts") // => "redis"
 * extractDomainFromFilePath("/path/src/routes/posts/handlers.ts") // => "posts"
 * ```
 */
export function extractDomainFromFilePath(filePath: string): string {
  // Normalize path separators to forward slashes
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Match patterns in both src/ and dist/ directories
  // Capture group [2] contains the domain name
  const patterns = [
    /\/(src|dist)\/core\/([^/]+)/,
    /\/(src|dist)\/services\/([^/]+)/,
    /\/(src|dist)\/routes\/([^/]+)/,
  ];

  for (const pattern of patterns) {
    const match = normalizedPath.match(pattern);
    if (match?.[2]) {
      return match[2];
    }
  }

  return "unknown";
}

/**
 * Extracts the filename stem (without extension) from a file path.
 *
 * @param filePath - Absolute file path
 * @returns Filename without extension
 *
 * @example
 * ```ts
 * extractFilenameStem("/path/to/find.ts") // => "find"
 * extractFilenameStem("/path/to/create.js") // => "create"
 * ```
 */
export function extractFilenameStem(filePath: string): string {
  // Normalize path separators to forward slashes
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Extract filename from path
  const filename = normalizedPath.split("/").pop() ?? "";

  // Remove extension (.ts or .js)
  return filename.replace(/\.(ts|js)$/, "");
}

/**
 * Infers the action tag from a function name.
 * Uses common naming conventions to determine the operation type.
 *
 * @param functionName - Name of the function
 * @returns Action tag (read, create, update, delete, validate, hash, unknown)
 *
 * @example
 * ```ts
 * inferActionFromFunctionName("findUserById") // => "read"
 * inferActionFromFunctionName("createPost") // => "create"
 * inferActionFromFunctionName("updateUser") // => "update"
 * inferActionFromFunctionName("deleteComment") // => "delete"
 * inferActionFromFunctionName("validateEmail") // => "validate"
 * inferActionFromFunctionName("verifyPassword") // => "validate"
 * inferActionFromFunctionName("hashPassword") // => "hash"
 * ```
 */
export function inferActionFromFunctionName(functionName: string): string {
  const lowerName = functionName.toLowerCase();

  // Read operations
  if (lowerName.startsWith("find") || lowerName.startsWith("get")) {
    return "read";
  }

  // Create operations
  if (lowerName.startsWith("create") || lowerName.startsWith("save")) {
    return "create";
  }

  // Update operations
  if (lowerName.startsWith("update")) {
    return "update";
  }

  // Delete operations
  if (lowerName.startsWith("delete") || lowerName.startsWith("remove")) {
    return "delete";
  }

  // Validation operations
  if (
    lowerName.startsWith("validate") ||
    lowerName.startsWith("check") ||
    lowerName.startsWith("verify")
  ) {
    return "validate";
  }

  // Hash operations
  if (lowerName.startsWith("hash")) {
    return "hash";
  }

  return "unknown";
}
