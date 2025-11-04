/**
 * Result System - Barrel Export
 *
 * Maintains backward compatibility by re-exporting all public APIs from submodules.
 * Existing code can continue to import from `#lib/result` without breaking.
 *
 * Module Organization:
 * - types.ts: Core type definitions (Command, Result, Success, Failure, ResultMetadata)
 * - factories.ts: Result factory functions (success, fail, command)
 * - combinators.ts: Composition utilities (chain, pipe, all, allNamed, allConcurrent, allNamedConcurrent, flow, tap, map, filter, match, matchResponse)
 * - interpreter.ts: Result executor (run)
 * - metadata.ts: Auto-metadata generation utilities (extractCallerInfo, etc.)
 *
 * Instrumentation (Imperative Shell):
 * - src/infrastructure/result/instrumentation.ts: Logging, metrics, tracing integration
 */

// --- Combinators (Composition) ---
export {
  all,
  allConcurrent,
  allNamed,
  allNamedConcurrent,
  chain,
  filter,
  flow,
  map,
  match,
  matchResponse,
  pipe,
  tap,
} from "#lib/result/combinators";

// --- Factories ---
export { command, fail, success } from "#lib/result/factories";

// --- Interpreter ---
export { run } from "#lib/result/interpreter";

// --- Metadata Utilities (Advanced Usage) ---
export {
  extractCallerInfo,
  extractDomainFromFilePath,
  extractFilenameStem,
  inferActionFromFunctionName,
} from "#lib/result/metadata";

// --- Types ---
export type {
  Command,
  Failure,
  Result,
  ResultMetadata,
  Success,
} from "#lib/result/types";
