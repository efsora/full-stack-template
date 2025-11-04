/**
 * Result Composition Utilities (Combinators)
 *
 * Pure functions for composing and chaining results.
 * These combinators allow building complex workflows from simpler results.
 */

import type { Command, Result } from "./types";

import { command, fail, success } from "./factories";
import { run } from "./interpreter";
import { invariant } from "#lib/result/invariant";
import { AppError } from "./types/errors";
import {
  createFailureResponse,
  type AppResponse,
  type FailureResponse,
  type SuccessResponse,
} from "#lib/types/response";

/**
 * Combines multiple results into a single result that produces an array of results.
 * Similar to Promise.all() - if any result fails, the whole operation fails.
 * All results are executed sequentially in order.
 *
 * @param results - Array of results to combine
 * @returns Single result producing array of all results
 *
 * @example
 * ```ts
 * const result = await run(
 *   all([
 *     Email.create("user@example.com"),
 *     Password.create("secure123"),
 *     validateAge(25)
 *   ])
 * );
 * // result.value = [email, password, age]
 * ```
 */
export function all<T extends readonly Result<unknown>[]>(
  results: [...T],
): Result<{ [K in keyof T]: T[K] extends Result<infer U> ? U : never }> {
  // Base case: empty array
  if (results.length === 0) {
    return success([]) as Result<{
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    }>;
  }

  // Recursive case: process first result, then rest
  const [first, ...rest] = results;

  return chain(first, (firstValue) => {
    if (rest.length === 0) {
      // Last result - return single-element array
      return success([firstValue]) as Result<{
        [K in keyof T]: T[K] extends Result<infer U> ? U : never;
      }>;
    }

    // Recursively process remaining results
    return chain(all(rest as [...Result<unknown>[]]), (restValues) => {
      return success([firstValue, ...restValues]) as Result<{
        [K in keyof T]: T[K] extends Result<infer U> ? U : never;
      }>;
    });
  });
}

/**
 * Combines multiple results into a single result that produces an array of results,
 * executing all results concurrently (in parallel).
 * Similar to Promise.all() - if any result fails, the whole operation fails with the first failure.
 * Effects are executed in parallel using Promise.all for better performance.
 *
 * @param results - Array of results to combine
 * @returns Single result producing array of all results
 *
 * @example
 * ```ts
 * // Execute multiple independent queries concurrently
 * const result = await run(
 *   allConcurrent([
 *     findUserById(1),
 *     findPostById(2),
 *     findCommentById(3)
 *   ])
 * );
 * // result.value = [user, post, comment]
 * // All queries executed in parallel
 * ```
 */
export function allConcurrent<T extends readonly Result<unknown>[]>(
  results: [...T],
): Result<{ [K in keyof T]: T[K] extends Result<infer U> ? U : never }> {
  // Base case: empty array
  if (results.length === 0) {
    return success([]) as Result<{
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    }>;
  }

  // Return a Command that executes all results concurrently
  return command<
    Result<unknown>[],
    { [K in keyof T]: T[K] extends Result<infer U> ? U : never }
  >(
    async () => {
      // Execute all results concurrently using Promise.all
      const resultValues = await Promise.all(
        results.map((result) => run(result)),
      );
      return resultValues;
    },
    (
      resultValues: Result<unknown>[],
    ): Result<{ [K in keyof T]: T[K] extends Result<infer U> ? U : never }> => {
      const firstFailure = resultValues.find(
        (result) => result.status === "Failure",
      );

      if (firstFailure) {
        // Return the first failure (type assertion needed for proper type narrowing)
        return firstFailure as Result<{
          [K in keyof T]: T[K] extends Result<infer U> ? U : never;
        }>;
      }

      const values = resultValues.map((result) => {
        if (result.status === "Success") {
          return result.value;
        }
        // This should never happen as we checked for failures above
        throw new Error("Unexpected effect status");
      });

      return success(values) as Result<{
        [K in keyof T]: T[K] extends Result<infer U> ? U : never;
      }>;
    },
  );
}

/**
 * Combines multiple named results into a single result that produces an object of results.
 * Similar to Promise.all() but with named properties instead of array indices.
 * This is more readable when combining multiple validations or operations.
 *
 * @param results - Object of named results to combine
 * @returns Single result producing object with all results
 *
 * @example
 * ```ts
 * const result = await run(
 *   allNamed({
 *     email: Email.create("user@example.com"),
 *     password: Password.create("secure123"),
 *     age: validateAge(25)
 *   })
 * );
 * // result.value = { email: Email, password: Password, age: number }
 * ```
 */
export function allNamed<T extends Record<string, Result<unknown>>>(
  results: T,
): Result<{ [K in keyof T]: T[K] extends Result<infer U> ? U : never }> {
  const keys = Object.keys(results) as (keyof T)[];

  // Base case: empty object
  if (keys.length === 0) {
    return success({}) as Result<{
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    }>;
  }

  const entries = keys.map((key) => [key, results[key]] as const);

  const resultsArray = entries.map(([, result]) => result);

  return chain(all(resultsArray), (values) => {
    const result = {} as {
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    };

    keys.forEach((key, index) => {
      result[key] = values[index] as {
        [K in keyof T]: T[K] extends Result<infer U> ? U : never;
      }[keyof T];
    });

    return success(result);
  });
}

/**
 * Combines multiple named results into a single result that produces an object of results,
 * executing all results concurrently (in parallel).
 * Similar to Promise.all() but with named properties instead of array indices.
 * Effects are executed in parallel using Promise.all for better performance.
 *
 * @param results - Object of named results to combine
 * @returns Single result producing object with all results
 *
 * @example
 * ```ts
 * // Execute multiple validations concurrently
 * const result = await run(
 *   allNamedConcurrent({
 *     user: findUserById(userId),
 *     post: findPostById(postId),
 *     permissions: checkPermissions(userId)
 *   })
 * );
 * // result.value = { user: User, post: Post, permissions: Permissions }
 * // All operations executed in parallel
 * ```
 */
export function allNamedConcurrent<T extends Record<string, Result<unknown>>>(
  results: T,
): Result<{ [K in keyof T]: T[K] extends Result<infer U> ? U : never }> {
  const keys = Object.keys(results) as (keyof T)[];

  // Base case: empty object
  if (keys.length === 0) {
    return success({}) as Result<{
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    }>;
  }

  const entries = keys.map((key) => [key, results[key]] as const);
  const resultsArray = entries.map(([, result]) => result);

  return chain(allConcurrent(resultsArray), (values) => {
    const result = {} as {
      [K in keyof T]: T[K] extends Result<infer U> ? U : never;
    };

    keys.forEach((key, index) => {
      result[key] = values[index] as {
        [K in keyof T]: T[K] extends Result<infer U> ? U : never;
      }[keyof T];
    });

    return success(result);
  });
}

/**
 * The "bind" operator for the Result system (monadic bind).
 * Chains two operations that return results computations together.
 *
 * @param result - The first result to execute
 * @param fn - Function to apply to the success value, producing the next result
 * @returns Combined result
 *
 * @example
 * ```ts
 * const result = chain(
 *   validateInput(data),
 *   (validData) => saveToDatabase(validData)
 * );
 * ```
 */
export function chain<T, U>(
  result: Result<T>,
  fn: (value: T) => Result<U>,
): Result<U> {
  switch (result.status) {
    case "Command":
      // If the first result is a command, compose the continuations
      return {
        command: result.command,
        continuation: (commandResult: unknown) => {
          const nextResult = result.continuation(commandResult);
          return chain(nextResult, fn);
        },
        metadata: result.metadata, // Preserve metadata through chain
        status: "Command",
      } as Command<U>;

    case "Failure":
      // If the first result is a failure, short-circuit the chain
      return result;

    case "Success":
      // If the first result is a success, apply the next function to its value
      return fn(result.value);
  }
}

/**
 * Filters the success value of a result by a predicate.
 * If the predicate returns true, the value passes through.
 * If the predicate returns false, returns a Failure with the provided error.
 *
 * This is useful for validation guards, authorization checks, and conditional logic
 * where you want to fail the result if a condition is not met.
 *
 * @param predicate - Function that tests the success value
 * @param errorFn - Function that creates an error if predicate fails
 * @returns Function that takes a value and returns Success or Failure
 *
 * @example
 * ```ts
 * // Authentication guard
 * pipe(
 *   success(userId),
 *   filter(
 *     (id) => id !== undefined,
 *     () => ({ code: "UNAUTHORIZED", message: "User not authenticated" })
 *   )
 * );
 * ```
 *
 * @example
 * ```ts
 * // Ownership verification
 * pipe(
 *   findPostById(postId),
 *   filter(
 *     (post) => post.userId === userId,
 *     (post) => ({
 *       code: "FORBIDDEN",
 *       message: "You can only modify your own posts",
 *       resourceId: post.id,
 *       resourceType: "post"
 *     })
 *   )
 * );
 * ```
 *
 * @example
 * ```ts
 * // Validation check
 * pipe(
 *   findUser(userId),
 *   filter(
 *     (user) => user.isActive,
 *     (user) => ({
 *       code: "FORBIDDEN",
 *       message: `User ${user.id} is inactive`,
 *       resourceId: user.id,
 *       resourceType: "user"
 *     })
 *   )
 * );
 * ```
 */
export function filter<T>(
  predicate: (value: T) => boolean,
  errorFn: (value: T) => AppError,
): (value: T) => Result<T> {
  return (value: T) => {
    if (predicate(value)) {
      return success(value);
    }
    return fail(errorFn(value));
  };
}
/**
 * Composes effect-producing functions into a reusable pipeline function.
 * This is function composition - it creates a new function that you can call later.
 *
 * The key difference from `pipe()`:
 * - `flow()` composes functions and RETURNS A FUNCTION
 * - `pipe()` transforms an effect and RETURNS AN EFFECT
 *
 * Use `flow()` when you want to create a reusable pipeline.
 * Use `pipe()` when you want to transform an existing effect immediately.
 *
 * Named `flow` following fp-ts and Effect-TS conventions.
 *
 * @param fns - Result-returning functions to compose
 * @returns A function that takes initial input and returns an Effect
 *
 * @example
 * ```ts
 * // Creating a reusable pipeline
 * const processUser = flow(
 *   validateUser,
 *   enrichUserData,
 *   saveToDatabase
 * );
 *
 * // Use it multiple times
 * const result1 = await run(processUser(userData1));
 * const result2 = await run(processUser(userData2));
 * ```
 *
 * @example
 * ```ts
 * // Compare with pipe() - direct transformation
 * const result = pipe(
 *   validateUser(userData),  // ← Start with a Result
 *   enrichUserData,
 *   saveToDatabase
 * );
 * ```
 */
// Overloads for different arities with proper type inference
export function flow<A, B>(fn1: (a: A) => Result<B>): (initial: A) => Result<B>;
export function flow<A, B, C>(
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
): (initial: A) => Result<C>;
export function flow<A, B, C, D>(
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
): (initial: A) => Result<D>;

export function flow<A, B, C, D, E>(
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
  fn4: (d: D) => Result<E>,
): (initial: A) => Result<E>;

export function flow<A, B, C, D, E, F>(
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
  fn4: (d: D) => Result<E>,
  fn5: (e: E) => Result<F>,
): (initial: A) => Result<F>;

// Implementation

export function flow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...fns: ((value: any) => Result<any>)[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (initial: any) => Result<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (initialValue: any): Result<any> =>
    fns.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: Result<any>, fn: (value: any) => Result<any>) =>
        chain(result, fn),
      success(initialValue),
    );
}

/**
 * Transforms the success value of a result from one type to another.
 * This is the fundamental functor operation - it maps over the success value
 * while preserving the Result wrapper and passing through failures unchanged.
 *
 * The key difference from `chain()`:
 * - `map()` transforms the value and keeps it wrapped in Success
 * - `chain()` transforms the value into a new Result (can change Success/Failure)
 *
 * Use `map()` when you want to transform data without changing the result structure.
 * Use `chain()` when the transformation itself can succeed or fail.
 *
 * @param mapper - Pure function to transform the success value
 * @returns Function that takes a value and returns Result with mapped value
 *
 * @example
 * ```ts
 * // Transform User[] to UserData[]
 * pipe(
 *   queryAllUsers(),
 *   map((users) => users.map(mapUserToUserData))
 * );
 * ```
 *
 * @example
 * ```ts
 * // Add field to object
 * pipe(
 *   findUser(userId),
 *   map((user) => ({
 *     ...user,
 *     displayName: user.email.split('@')[0]
 *   }))
 * );
 * ```
 *
 * @example
 * ```ts
 * // Chain multiple transformations
 * pipe(
 *   findUser(userId),
 *   map((user) => ({ id: user.id, email: user.email })), // Select fields
 *   map((user) => ({ ...user, timestamp: new Date() }))  // Add metadata
 * );
 * ```
 */
export function map<T, U>(mapper: (value: T) => U): (value: T) => Result<U> {
  return (value: T) => success(mapper(value));
}

/**
 * Pattern matches on a Result to explicitly handle Success and Failure cases.
 * Returns raw data on success or throws AppError on failure.
 *
 * This combinator enables explicit field mapping in handlers while maintaining
 * type safety. It's particularly useful for transforming Effect results into
 * plain data objects for HTTP responses.
 *
 * Key behaviors:
 * - Success: Applies onSuccess mapper and returns plain data
 * - Failure: Applies onFailure handler (typically throws the error)
 * - Command: Chains handlers into the continuation (enables composition)
 *
 * The onFailure handler must have a `never` return type, enforcing that it
 * throws the error rather than returning a value.
 *
 * @param result - The Result to pattern match on
 * @param handlers - Object with onSuccess and onFailure handlers
 * @returns The mapped value from onSuccess, or throws from onFailure
 *
 * @example
 * ```ts
 * // In a handler - explicit field mapping
 * export async function handleCreateUser(req: Request) {
 *   const result = await run(createUser(body));
 *
 *   return match(result, {
 *     onSuccess: (user) => ({
 *       id: user.id,
 *       email: user.email,
 *       name: user.name,
 *       createdAt: user.createdAt
 *     }),
 *     onFailure: (error) => { throw error; }
 *   });
 * }
 *
 * // The middleware catches thrown AppError and converts to HTTP response
 * // Success case returns plain data which middleware wraps in { status: "success", data: ... }
 * ```
 *
 * @example
 * ```ts
 * // Composing with other effects (before execution)
 * const effect = pipe(
 *   validateInput(data),
 *   (validated) => match(saveToDatabase(validated), {
 *     onSuccess: (saved) => ({ id: saved.id, createdAt: saved.createdAt }),
 *     onFailure: (error) => { throw error; }
 *   })
 * );
 * ```
 */
export function match<T, U>(
  result: Result<T>,
  handlers: {
    onFailure: (error: AppError) => unknown;
    onSuccess: (value: T) => U;
  },
): U {
  switch (result.status) {
    case "Failure":
      // Failure case: throw the error (caught by middleware)
      return handlers.onFailure(result.error) as U;

    case "Success":
      // Success case: apply mapper and return plain data
      return handlers.onSuccess(result.value);

    case "Command": {
      // Command case: we need to execute the effect first
      // This shouldn't happen in practice since handlers call run() first,
      // but we handle it for composability
      throw new Error(
        "match() called on unexecuted Command. Call run() first, or use match() in a chain.",
      );
    }
  }
}

/**
 * Pattern matches on a Result for HTTP response handlers, returning universal AppResponse.
 * This combinator constructs the complete API response format with proper type safety
 * using discriminated unions.
 *
 * Key features:
 * - Returns AppResponse<T> (SuccessResponse<T> | FailureResponse)
 * - Success: Handler constructs full SuccessResponse with all required fields
 * - Failure: Handler constructs full FailureResponse with all required fields
 * - Enforces exhaustive type safety via discriminated unions
 * - Both handlers are required
 *
 * @param result - The executed Result (must call run() first)
 * @param handlers - Object with onSuccess and onFailure handlers
 * @returns Universal AppResponse (discriminated union)
 *
 * @example
 * ```ts
 * // Handler with explicit response construction
 * export async function handleGetUser(req: Request) {
 *   const result = await run(getUser(userId));
 *
 *   return matchResponse(result, {
 *     onSuccess: (user) => ({
 *       success: true,
 *       data: {
 *         id: user.id,
 *         email: user.email,
 *         name: user.name,
 *         createdAt: user.createdAt,
 *         updatedAt: user.updatedAt
 *       },
 *       traceId: getTraceId(),
 *       message: null,
 *       meta: null,
 *       error: null,
 *     }),
 *     onFailure: (error) => ({
 *       success: false,
 *       error: error,
 *       message: error.message,
 *       traceId: getTraceId(),
 *       data: null,
 *       meta: null,
 *     }),
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using helper functions for cleaner code
 * import { createSuccessResponse, createFailureResponse } from "#lib/types/response";
 *
 * return matchResponse(result, {
 *   onSuccess: (user) => createSuccessResponse({
 *     id: user.id,
 *     email: user.email,
 *     name: user.name,
 *   }),
 *   onFailure: (error) => createFailureResponse(error),
 * });
 * ```
 */
export function matchResponse<T>(
  result: Result<T>,
  handlers: {
    onFailure?: (error: AppError) => FailureResponse;
    onSuccess: (value: T) => SuccessResponse<T>;
  },
): AppResponse<T> {
  switch (result.status) {
    case "Failure": {
      if (handlers.onFailure) {
        // Return failure response constructed by handler
        return handlers.onFailure(result.error);
      }
      return createFailureResponse(result.error);
    }

    case "Success": {
      // Return success response constructed by handler
      return handlers.onSuccess(result.value);
    }

    case "Command": {
      invariant(
        false,
        "matchResponse() called on unexecuted Command. Call run() first.",
      );
    }
  }
}

/**
 * Pipes a result through a series of transformation functions.
 * More readable than nested chains for linear transformations.
 *
 * This is the direct-value version of `flow()` - it takes an initial result
 * instead of returning a function.
 *
 * The key difference from `flow()`:
 * - `pipe()` starts with a Result and RETURNS A Result
 * - `flow()` composes functions and RETURNS A FUNCTION
 *
 * @param result - Initial result to pipe
 * @param fns - Transformation functions to apply
 * @returns Final result after all transformations
 *
 * @example
 * ```ts
 * // ❌ Nested chains (hard to read)
 * return chain(validate(input), (validated) =>
 *   chain(transform(validated), (transformed) =>
 *     save(transformed)
 *   )
 * );
 *
 * // ✅ Using pipe() (readable, flat)
 * return pipe(
 *   validate(input),
 *   transform,
 *   save
 * );
 * ```
 */
export function pipe<A>(result: Result<A>): Result<A>;

export function pipe<A, B>(
  result: Result<A>,
  fn1: (a: A) => Result<B>,
): Result<B>;

export function pipe<A, B, C>(
  result: Result<A>,
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
): Result<C>;

export function pipe<A, B, C, D>(
  result: Result<A>,
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
): Result<D>;

export function pipe<A, B, C, D, E>(
  result: Result<A>,
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
  fn4: (d: D) => Result<E>,
): Result<E>;

export function pipe<A, B, C, D, E, F>(
  result: Result<A>,
  fn1: (a: A) => Result<B>,
  fn2: (b: B) => Result<C>,
  fn3: (c: C) => Result<D>,
  fn4: (d: D) => Result<E>,
  fn5: (e: E) => Result<F>,
): Result<F>;

export function pipe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Result<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...fns: ((value: any) => Result<any>)[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Result<any> {
  if (fns.length === 0) {
    return result;
  }

  return fns.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: Result<any>, fn: (value: any) => Result<any>) => chain(acc, fn),
    result,
  );
}

/**
 * Executes a result for its side effects while preserving the original input value.
 * Also known as "chainFirst" in fp-ts or "tapEffect" in other FP libraries.
 *
 * This combinator is useful for:
 * - Running validation checks that don't transform the data
 * - Performing logging or caching operations
 * - Executing side effects in a pipeline without changing the flow
 *
 * The result's value is discarded, and the original input is returned.
 * If the result fails, the failure propagates (input is not returned).
 *
 * @param fn - Result-returning function that receives the input
 * @returns Function that executes the effect and returns the original input
 *
 * @example
 * ```ts
 * // Validation guards in flow
 * const pipeline = flow(
 *   validateCreateAccountRequest,
 *   tap((input) => validateOwnerExists(input.owner_id)),
 *   tap((input) => assertMaxAccounts(input.owner_id, 3)),
 *   tap((input) => validateUniqueAccountName(input.owner_id, input.name)),
 *   createAccount
 * );
 *
 * // Cache write without transforming data
 * pipe(
 *   findPostById(postId),
 *   tap((post) => setCacheWithExpiry({
 *     key: `post:${post.id}`,
 *     value: JSON.stringify(post)
 *   })),
 *   processPost  // receives post, not cache write result
 * );
 * ```
 */
export function tap<T, R>(
  fn: (input: T) => Result<R>,
): (input: T) => Result<T> {
  return (input: T) => chain(fn(input), () => success(input));
}
