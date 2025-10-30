import type { Result } from "#lib/result/index";
import type { AppError } from "#lib/result/types/errors";
import type { NextFunction, Request, Response } from "express";

import { errorResponse, successResponse } from "#middlewares/utils/response";

import { getSuccessStatusCode, mapErrorCodeToStatus } from "#middlewares/utils/httpStatusMapper";
import { isAppError, isResult } from "#middlewares/utils/typeGuards";

/**
 * Type for handlers that can return:
 * 1. Result values (old style, for backward compatibility)
 * 2. Raw data directly (new style, for explicit returns)
 * 3. U | Failure (matchResponse style, for automatic response wrapping)
 * 4. Undefined if handler manages response itself (early return)
 *
 * Handlers that throw AppError will be caught and converted to error responses.
 */
export type ResultHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
) => Promise<Result<unknown> | undefined | unknown>;

/**
 * Wrapper middleware that automatically handles Effect, raw data, and matchResponse returns
 *
 * Supports three handler styles:
 *
 * **1. Old Style: Returns Effect objects (Success/Failure) - for backward compatibility**
 * ```ts
 * export async function handleGetUser(req: Request) {
 *   const result = getUser(userId);
 *   const result = await run((result));
 *   return result; // Returns Result<User>
 * }
 * // Middleware detects Effect, extracts value, wraps in successResponse()
 * ```
 *
 * **2. match() Style: Returns raw data directly, throws AppError on failures**
 * ```ts
 * export async function handleGetUser(req: Request) {
 *   const result = await run(getUser(userId));
 *   return match(result, {
 *     onSuccess: (user) => ({ id: user.id, email: user.email }),
 *     onFailure: (error) => { throw error; }
 *   });
 * }
 * // Middleware catches thrown AppError, converts to errorResponse()
 * // Success returns raw data, middleware wraps in successResponse()
 * ```
 *
 * **3. matchResponse() Style: Returns U | Failure discriminated union**
 * ```ts
 * export async function handleGetUser(req: Request) {
 *   const result = await run(getUser(userId));
 *   return matchResponse(result, {
 *     onSuccess: (user) => ({ id: user.id, email: user.email })
 *   });
 * }
 * // Success: Returns raw data U, middleware wraps in successResponse()
 * // Failure: Returns Failure (result), middleware converts to errorResponse()
 * ```
 *
 * The matchResponse style eliminates boilerplate by:
 * - Automatically wrapping success data U in successResponse()
 * - Automatically converting Failure to errorResponse()
 *
 * HTTP Status Codes:
 * - POST requests → 201 Created on success
 * - All other methods → 200 OK on success
 * - Error codes mapped to appropriate HTTP status (400, 401, 403, 404, 409, 500)
 *
 * @param handler - Handler function returning Effect, raw data, or U | Failure
 * @returns Express middleware function
 */
export function handleResult(handler: ResultHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handler(req, res, next);

      // If handler already sent response (e.g., early return), skip processing
      if (res.headersSent || !result) {
        return;
      }

      // Check if result is an Effect (old style or matchResponse Failure)
      // This handles:
      // 1. Old style: Result<T> (Success/Failure from run)
      // 2. matchResponse: Failure part of U | Failure discriminated union
      if (isResult(result)) {
        handleResultResult(res, result, req.method);
        return;
      }

      // New style: Raw data returned directly
      // This handles:
      // 1. match() style: Raw data with explicit field mapping
      // 2. matchResponse style: U part of U | Failure discriminated union
      handleRawData(res, result, req.method);
    } catch (error) {
      // Check if error is an AppError (thrown by new-style handlers)
      if (isAppError(error)) {
        handleFailure(res, error);
        return;
      }

      // Pass other errors to global error handler
      next(error);
    }
  };
}

/**
 * Process an Effect result (Success, Failure, or Command)
 *
 * This handles both:
 * - Old style handlers returning Result<T> from run()
 * - matchResponse handlers returning Failure part of U | Failure union
 *
 * @param res - Express response object
 * @param result - Effect to process
 * @param method - HTTP request method
 * @throws Error if Command is detected (programming error)
 */
function handleResultResult(res: Response, result: Result<unknown>, method: string): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  switch (result.status) {
    case "Command":
      // This should never happen - handlers must call run() before returning
      // If we reach here, it's a programming error
      throw new Error(
        "Unexecuted Command detected in (result)Handler. " +
          "Handlers must call run() to execute (result)s before returning them. " +
          "Ensure all handler functions await run((result)) before returning.",
      );

    case "Failure":
      handleFailure(res, result.error);
      return;

    case "Success":
      handleSuccess(res, result.value, method);
      return;
  }
}

/**
 * Process a failed Effect result or thrown AppError
 *
 * Maps the error code to an appropriate HTTP status code and sends an
 * errorResponse with the error details.
 *
 * @param res - Express response object
 * @param error - AppError to send
 */
function handleFailure(res: Response, error: AppError): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  const statusCode = mapErrorCodeToStatus(error);
  res.status(statusCode).json(errorResponse(error.message, error.code, error));
}

/**
 * Process raw data returned directly from handlers
 *
 * This handles:
 * - match() style: Raw data with explicit field mapping
 * - matchResponse() style: U part of U | Failure discriminated union
 *
 * Wraps the data in a successResponse and sends it with the appropriate
 * HTTP status code (201 for POST, 200 for others).
 *
 * @param res - Express response object
 * @param data - Raw data to send
 * @param method - HTTP request method
 */
function handleRawData(res: Response, data: unknown, method: string): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  const statusCode = getSuccessStatusCode(method);
  res.status(statusCode).json(successResponse(data));
}

/**
 * Process a successful Effect result
 *
 * Wraps the success value in a successResponse and sends it with the appropriate
 * HTTP status code (201 for POST, 200 for others).
 *
 * @param res - Express response object
 * @param value - Success value to send
 * @param method - HTTP request method
 */
function handleSuccess(res: Response, value: unknown, method: string): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  const statusCode = getSuccessStatusCode(method);
  res.status(statusCode).json(successResponse(value));
}