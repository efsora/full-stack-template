/**
 * Result Handler Middleware
 *
 * Wrapper middleware that processes handlers returning AppResponse<T> format.
 * This middleware handles the universal API response format and sends appropriate
 * HTTP responses with correct status codes.
 */

import type { NextFunction, Request, Response } from "express";

import {
  getSuccessStatusCode,
  mapErrorCodeToStatus,
} from "#middlewares/utils/httpStatusMapper";
import type { AppResponse } from "#lib/types/response";

/**
 * Type for handlers that return AppResponse<T>
 *
 * Handlers must return a Promise resolving to AppResponse<T>, which is a discriminated
 * union of SuccessResponse<T> and FailureResponse.
 *
 * Generic type R allows handlers to specify their request type (Request or ValidatedRequest).
 * Defaults to Request for handlers that don't use validation.
 */
export type ResultHandler<R extends Request = Request> = (
  req: R,
  res: Response,
  next: NextFunction,
) => Promise<AppResponse<unknown>>;

/**
 * Wrapper middleware that automatically handles AppResponse<T> returns from handlers
 *
 * This middleware processes the universal AppResponse format and:
 * - Sends success responses with appropriate HTTP status (POST → 201, others → 200)
 * - Sends failure responses with error-code-mapped HTTP status
 * - Handles cases where response was already sent (early returns)
 * - Passes unexpected errors to Express error handler
 *
 * Handler Style:
 * ```ts
 * export async function handleGetUser(req: ValidatedRequest<{ params: IdParams }>) {
 *   const { id } = req.validated.params;
 *   const result = await run(getUser(id));
 *
 *   return matchResponse(result, {
 *     onSuccess: (user) => createSuccessResponse({ id: user.id, email: user.email }),
 *     onFailure: (error) => createFailureResponse(error),
 *   });
 * }
 * ```
 *
 * Route Usage:
 * ```ts
 * router.post("/users", validate(schema), handleResult(handleCreateUser));
 * ```
 *
 * HTTP Status Codes:
 * - POST requests → 201 Created on success
 * - All other methods → 200 OK on success
 * - Error codes mapped to appropriate HTTP status (400, 401, 403, 404, 409, 500)
 *
 * @param handler - Handler function returning AppResponse<T>
 * @returns Express middleware function
 */
export function handleResult<R extends Request = Request>(
  handler: ResultHandler<R>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handler(req as R, res, next);

      // If handler already sent response (e.g., early return), skip processing
      if (res.headersSent) {
        return;
      }

      // Handle discriminated union based on success field
      if (result.success) {
        // Success case - send with appropriate status code
        handleSuccess(res, result, req.method);
      } else {
        // Failure case - send with error-mapped status code
        handleFailure(res, result);
      }
    } catch (error) {
      // Pass unexpected errors to global error handler
      next(error);
    }
  };
}

/**
 * Process a success response
 *
 * Sends the AppResponse with the appropriate HTTP status code:
 * - 201 for POST requests
 * - 200 for all other methods
 *
 * @param res - Express response object
 * @param response - SuccessResponse from handler
 * @param method - HTTP request method
 */
function handleSuccess(
  res: Response,
  response: AppResponse<unknown>,
  method: string,
): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  const statusCode = getSuccessStatusCode(method);
  res.status(statusCode).json(response);
}

/**
 * Process a failure response
 *
 * Maps the error code to an appropriate HTTP status code and sends the
 * AppResponse with error details.
 *
 * @param res - Express response object
 * @param response - FailureResponse from handler
 */
function handleFailure(res: Response, response: AppResponse<unknown>): void {
  // Defensive check - should not happen but prevents double-sends
  if (res.headersSent) {
    return;
  }

  // Type guard ensures we have a FailureResponse
  // When success is false, TypeScript knows response.error exists
  if (!response.success) {
    const statusCode = mapErrorCodeToStatus(response.error);
    res.status(statusCode).json(response);
  }
}
