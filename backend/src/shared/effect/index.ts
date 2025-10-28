/**
 * Effect System - Barrel Export
 *
 * Maintains backward compatibility by re-exporting all public APIs from submodules.
 * Existing code can continue to import from `#core/effect.js` without breaking.
 *
 * Module Organization:
 * - types.ts: Core type definitions (CommandEffect, Effect, Success, Failure, EffectMetadata)
 * - factories.ts: Effect factory functions (success, failure, commandEffect)
 * - combinators.ts: Composition utilities (chain, pipe, all, allNamed, allConcurrent, allNamedConcurrent, flow, tap, map, filter, match, matchResponse)
 * - interpreter.ts: Effect executor (runEffect)
 * - metadata.ts: Auto-metadata generation utilities (extractCallerInfo, etc.)
 *
 * Instrumentation (Imperative Shell):
 * - src/infrastructure/effect/instrumentation.ts: Logging, metrics, tracing integration
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
  } from "#shared/effect/combinators.js";
  
  // --- Factories ---
  export { commandEffect, failure, success } from "#shared/effect/factories";
  
  // --- Interpreter ---
  export { runEffect } from "#shared/effect/interpreter";
  
  // --- Metadata Utilities (Advanced Usage) ---
  export {
    extractCallerInfo,
    extractDomainFromFilePath,
    extractFilenameStem,
    inferActionFromFunctionName,
  } from "#shared/effect/metadata";
  
  // --- Types ---
  export type { CommandEffect, Effect, EffectMetadata, Failure, Success } from "#shared/effect/types";