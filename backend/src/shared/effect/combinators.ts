/**
 * Effect Composition Utilities (Combinators)
 *
 * Pure functions for composing and chaining effects.
 * These combinators allow building complex workflows from simpler effects.
 */

import type { CommandEffect, Effect, Failure } from "./types";

import { commandEffect, failure, success } from "./factories";
import { runEffect } from "./interpreter";
import { AppError } from "./types/errors";

/**
 * Combines multiple effects into a single effect that produces an array of results.
 * Similar to Promise.all() - if any effect fails, the whole operation fails.
 * All effects are executed sequentially in order.
 *
 * @param effects - Array of effects to combine
 * @returns Single effect producing array of all results
 *
 * @example
 * ```ts
 * const result = await runEffect(
 *   all([
 *     Email.create("user@example.com"),
 *     Password.create("secure123"),
 *     validateAge(25)
 *   ])
 * );
 * // result.value = [email, password, age]
 * ```
 */
export function all<T extends readonly Effect<unknown>[]>(
  effects: [...T],
): Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }> {
  // Base case: empty array
  if (effects.length === 0) {
    return success([]) as Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }>;
  }

  // Recursive case: process first effect, then rest
  const [first, ...rest] = effects;

  return chain(first, (firstValue) => {
    if (rest.length === 0) {
      // Last effect - return single-element array
      return success([firstValue]) as Effect<{
        [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
      }>;
    }

    // Recursively process remaining effects
    return chain(all(rest as [...Effect<unknown>[]]), (restValues) => {
      return success([firstValue, ...restValues]) as Effect<{
        [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
      }>;
    });
  });
}

/**
 * Combines multiple effects into a single effect that produces an array of results,
 * executing all effects concurrently (in parallel).
 * Similar to Promise.all() - if any effect fails, the whole operation fails with the first failure.
 * Effects are executed in parallel using Promise.all for better performance.
 *
 * @param effects - Array of effects to combine
 * @returns Single effect producing array of all results
 *
 * @example
 * ```ts
 * // Execute multiple independent queries concurrently
 * const result = await runEffect(
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
export function allConcurrent<T extends readonly Effect<unknown>[]>(
  effects: [...T],
): Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }> {
  // Base case: empty array
  if (effects.length === 0) {
    return success([]) as Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }>;
  }

  // Return a CommandEffect that executes all effects concurrently
  return commandEffect<
    Effect<unknown>[],
    { [K in keyof T]: T[K] extends Effect<infer U> ? U : never }
  >(
    async () => {
      // Execute all effects concurrently using Promise.all
      const results = await Promise.all(effects.map((effect) => runEffect(effect)));
      return results;
    },
    (
      results: Effect<unknown>[],
    ): Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }> => {
      // Check if any effect failed
      const firstFailure = results.find((result) => result.status === "Failure");

      if (firstFailure) {
        // Return the first failure (type assertion needed for proper type narrowing)
        return firstFailure as Effect<{
          [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
        }>;
      }

      // All succeeded - extract values
      const values = results.map((result) => {
        if (result.status === "Success") {
          return result.value;
        }
        // This should never happen as we checked for failures above
        throw new Error("Unexpected effect status");
      });

      return success(values) as Effect<{
        [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
      }>;
    },
  );
}

/**
 * Combines multiple named effects into a single effect that produces an object of results.
 * Similar to Promise.all() but with named properties instead of array indices.
 * This is more readable when combining multiple validations or operations.
 *
 * @param effects - Object of named effects to combine
 * @returns Single effect producing object with all results
 *
 * @example
 * ```ts
 * const result = await runEffect(
 *   allNamed({
 *     email: Email.create("user@example.com"),
 *     password: Password.create("secure123"),
 *     age: validateAge(25)
 *   })
 * );
 * // result.value = { email: Email, password: Password, age: number }
 * ```
 */
export function allNamed<T extends Record<string, Effect<unknown>>>(
  effects: T,
): Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }> {
  const keys = Object.keys(effects) as (keyof T)[];

  // Base case: empty object
  if (keys.length === 0) {
    return success({}) as Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }>;
  }

  // Convert object to array of [key, effect] pairs
  const entries = keys.map((key) => [key, effects[key]] as const);

  // Process all effects using the all() function
  const effectsArray = entries.map(([, effect]) => effect);

  return chain(all(effectsArray), (values) => {
    // Reconstruct object from keys and values
    const result = {} as { [K in keyof T]: T[K] extends Effect<infer U> ? U : never };

    keys.forEach((key, index) => {
      result[key] = values[index] as {
        [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
      }[keyof T];
    });

    return success(result);
  });
}

/**
 * Combines multiple named effects into a single effect that produces an object of results,
 * executing all effects concurrently (in parallel).
 * Similar to Promise.all() but with named properties instead of array indices.
 * Effects are executed in parallel using Promise.all for better performance.
 *
 * @param effects - Object of named effects to combine
 * @returns Single effect producing object with all results
 *
 * @example
 * ```ts
 * // Execute multiple validations concurrently
 * const result = await runEffect(
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
export function allNamedConcurrent<T extends Record<string, Effect<unknown>>>(
  effects: T,
): Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }> {
  const keys = Object.keys(effects) as (keyof T)[];

  // Base case: empty object
  if (keys.length === 0) {
    return success({}) as Effect<{ [K in keyof T]: T[K] extends Effect<infer U> ? U : never }>;
  }

  // Convert object to array of effects
  const entries = keys.map((key) => [key, effects[key]] as const);
  const effectsArray = entries.map(([, effect]) => effect);

  // Use allConcurrent to execute in parallel, then reconstruct object
  return chain(allConcurrent(effectsArray), (values) => {
    const result = {} as { [K in keyof T]: T[K] extends Effect<infer U> ? U : never };

    keys.forEach((key, index) => {
      result[key] = values[index] as {
        [K in keyof T]: T[K] extends Effect<infer U> ? U : never;
      }[keyof T];
    });

    return success(result);
  });
}

/**
 * The "bind" operator for the Effect system (monadic bind).
 * Chains two effectful computations together.
 *
 * @param effect - The first effect to execute
 * @param fn - Function to apply to the success value, producing the next effect
 * @returns Combined effect
 *
 * @example
 * ```ts
 * const effect = chain(
 *   validateInput(data),
 *   (validData) => saveToDatabase(validData)
 * );
 * ```
 */
export function chain<T, U>(effect: Effect<T>, fn: (value: T) => Effect<U>): Effect<U> {
  switch (effect.status) {
    case "CommandEffect":
      // If the first effect is a command, compose the continuations
      return {
        command: effect.command,
        continuation: (commandResult: unknown) => {
          const result = effect.continuation(commandResult);
          return chain(result, fn);
        },
        metadata: effect.metadata, // Preserve metadata through chain
        status: "CommandEffect",
      } as CommandEffect<U>;

    case "Failure":
      // If the first effect is a failure, short-circuit the chain
      return effect;

    case "Success":
      // If the first effect is a success, apply the next function to its value
      return fn(effect.value);
  }
}

/**
 * Filters the success value of an effect by a predicate.
 * If the predicate returns true, the value passes through.
 * If the predicate returns false, returns a Failure with the provided error.
 *
 * This is useful for validation guards, authorization checks, and conditional logic
 * where you want to fail the effect if a condition is not met.
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
): (value: T) => Effect<T> {
  return (value: T) => {
    if (predicate(value)) {
      return success(value);
    }
    return failure(errorFn(value));
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
 * @param fns - Effect-producing functions to compose
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
 * const result1 = await runEffect(processUser(userData1));
 * const result2 = await runEffect(processUser(userData2));
 * ```
 *
 * @example
 * ```ts
 * // Compare with pipe() - direct transformation
 * const result = pipe(
 *   validateUser(userData),  // ← Start with an Effect
 *   enrichUserData,
 *   saveToDatabase
 * );
 * ```
 */
// Overloads for different arities with proper type inference
export function flow<A, B>(fn1: (a: A) => Effect<B>): (initial: A) => Effect<B>;
export function flow<A, B, C>(
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
): (initial: A) => Effect<C>;
export function flow<A, B, C, D>(
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
): (initial: A) => Effect<D>;

export function flow<A, B, C, D, E>(
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
  fn4: (d: D) => Effect<E>,
): (initial: A) => Effect<E>;

export function flow<A, B, C, D, E, F>(
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
  fn4: (d: D) => Effect<E>,
  fn5: (e: E) => Effect<F>,
): (initial: A) => Effect<F>;

// Implementation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flow(...fns: ((value: any) => Effect<any>)[]): (initial: any) => Effect<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (initialValue: any): Effect<any> =>
    fns.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (effect: Effect<any>, fn: (value: any) => Effect<any>) => chain(effect, fn),
      success(initialValue),
    );
}

/**
 * Transforms the success value of an effect from one type to another.
 * This is the fundamental functor operation - it maps over the success value
 * while preserving the Effect wrapper and passing through failures unchanged.
 *
 * The key difference from `chain()`:
 * - `map()` transforms the value and keeps it wrapped in Success
 * - `chain()` transforms the value into a new Effect (can change Success/Failure)
 *
 * Use `map()` when you want to transform data without changing the effect structure.
 * Use `chain()` when the transformation itself can succeed or fail.
 *
 * @param mapper - Pure function to transform the success value
 * @returns Function that takes a value and returns Effect with mapped value
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
export function map<T, U>(mapper: (value: T) => U): (value: T) => Effect<U> {
  return (value: T) => success(mapper(value));
}

/**
 * Pattern matches on an Effect to explicitly handle Success and Failure cases.
 * Returns raw data on success or throws AppError on failure.
 *
 * This combinator enables explicit field mapping in handlers while maintaining
 * type safety. It's particularly useful for transforming Effect results into
 * plain data objects for HTTP responses.
 *
 * Key behaviors:
 * - Success: Applies onSuccess mapper and returns plain data
 * - Failure: Applies onFailure handler (typically throws the error)
 * - CommandEffect: Chains handlers into the continuation (enables composition)
 *
 * The onFailure handler must have a `never` return type, enforcing that it
 * throws the error rather than returning a value.
 *
 * @param effect - The Effect to pattern match on
 * @param handlers - Object with onSuccess and onFailure handlers
 * @returns The mapped value from onSuccess, or throws from onFailure
 *
 * @example
 * ```ts
 * // In a handler - explicit field mapping
 * export async function handleCreateUser(req: Request) {
 *   const result = await runEffect(createUser(body));
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
  effect: Effect<T>,
  handlers: {
    onFailure: (error: AppError) => unknown;
    onSuccess: (value: T) => U;
  },
): U {
  switch (effect.status) {
    case "Failure":
      // Failure case: throw the error (caught by middleware)
      return handlers.onFailure(effect.error) as U;

    case "Success":
      // Success case: apply mapper and return plain data
      return handlers.onSuccess(effect.value);

    case "CommandEffect": {
      // CommandEffect case: we need to execute the effect first
      // This shouldn't happen in practice since handlers call runEffect() first,
      // but we handle it for composability
      throw new Error(
        "match() called on unexecuted CommandEffect. Call runEffect() first, or use match() in a chain.",
      );
    }
  }
}

/**
 * Pattern matches on an Effect for HTTP response handlers, returning inlined data or Failure.
 * This combinator eliminates response wrapping boilerplate by returning a discriminated union
 * that the middleware can handle automatically.
 *
 * Key differences from match():
 * - Returns U | Failure (discriminated union) instead of U
 * - Success: Returns inlined data directly (no wrapping)
 * - Failure: Returns original Failure effect (middleware converts to HTTP error)
 * - Optional onFailure handler for custom error handling
 *
 * The middleware (effectHandler) detects the discriminated union and:
 * - Wraps success data U in successResponse()
 * - Converts Failure to errorResponse()
 *
 * @param effect - The executed Effect (must call runEffect() first)
 * @param handlers - Object with onSuccess mapper and optional onFailure handler
 * @returns Inlined data U on success, or Failure effect on failure
 *
 * @example
 * ```ts
 * // Simple usage - automatic error handling
 * export async function handleGetUser(req: Request) {
 *   const result = await runEffect(getUser(userId));
 *
 *   return matchResponse(result, {
 *     onSuccess: (user) => ({
 *       id: user.id,
 *       email: user.email,
 *       name: user.name
 *     })
 *   });
 * }
 * // Success → returns { id, email, name } (middleware wraps in successResponse)
 * // Failure → returns Failure effect (middleware converts to errorResponse)
 * ```
 *
 * @example
 * ```ts
 * // Custom error handling
 * return matchResponse(result, {
 *   onSuccess: (user) => ({ id: user.id }),
 *   onFailure: (error) => {
 *     logger.error({ userId, error }, "Failed to fetch user");
 *     return failure({ code: "INTERNAL_ERROR", message: "Custom message" });
 *   }
 * });
 * ```
 *
 * @example
 * ```ts
 * // Array mapping
 * return matchResponse(result, {
 *   onSuccess: (users) => users.map(user => ({
 *     id: user.id,
 *     email: user.email,
 *     name: user.name
 *   }))
 * });
 * ```
 */
export function matchResponse<T, U>(
  effect: Effect<T>,
  handlers: {
    onFailure?: (error: AppError) => unknown;
    onSuccess: (value: T) => U;
  },
): Failure | U {
  switch (effect.status) {
    case "Failure": {
      // Use custom error handler if provided, otherwise return original Failure
      if (handlers.onFailure) {
        return handlers.onFailure(effect.error) as Failure;
      }
      return effect;
    }

    case "Success": {
      // Return inlined data directly (no wrapping)
      return handlers.onSuccess(effect.value);
    }

    case "CommandEffect": {
      throw new Error(
        "matchResponse() called on unexecuted CommandEffect. Call runEffect() first.",
      );
    }
  }
}

/**
 * Pipes an effect through a series of transformation functions.
 * More readable than nested chains for linear transformations.
 *
 * This is the direct-value version of `flow()` - it takes an initial effect
 * instead of returning a function.
 *
 * The key difference from `flow()`:
 * - `pipe()` starts with an Effect and RETURNS AN EFFECT
 * - `flow()` composes functions and RETURNS A FUNCTION
 *
 * @param effect - Initial effect to pipe
 * @param fns - Transformation functions to apply
 * @returns Final effect after all transformations
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
export function pipe<A>(effect: Effect<A>): Effect<A>;

export function pipe<A, B>(effect: Effect<A>, fn1: (a: A) => Effect<B>): Effect<B>;

export function pipe<A, B, C>(
  effect: Effect<A>,
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
): Effect<C>;

export function pipe<A, B, C, D>(
  effect: Effect<A>,
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
): Effect<D>;

export function pipe<A, B, C, D, E>(
  effect: Effect<A>,
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
  fn4: (d: D) => Effect<E>,
): Effect<E>;

export function pipe<A, B, C, D, E, F>(
  effect: Effect<A>,
  fn1: (a: A) => Effect<B>,
  fn2: (b: B) => Effect<C>,
  fn3: (c: C) => Effect<D>,
  fn4: (d: D) => Effect<E>,
  fn5: (e: E) => Effect<F>,
): Effect<F>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pipe(effect: Effect<any>, ...fns: ((value: any) => Effect<any>)[]): Effect<any> {
  if (fns.length === 0) {
    return effect;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fns.reduce((acc: Effect<any>, fn: (value: any) => Effect<any>) => chain(acc, fn), effect);
}

/**
 * Executes an effect for its side effects while preserving the original input value.
 * Also known as "chainFirst" in fp-ts or "tapEffect" in other FP libraries.
 *
 * This combinator is useful for:
 * - Running validation checks that don't transform the data
 * - Performing logging or caching operations
 * - Executing side effects in a pipeline without changing the flow
 *
 * The effect's result is discarded, and the original input is returned.
 * If the effect fails, the failure propagates (input is not returned).
 *
 * @param fn - Effect-producing function that receives the input
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
export function tap<T, R>(fn: (input: T) => Effect<R>): (input: T) => Effect<T> {
  return (input: T) => chain(fn(input), () => success(input));
}