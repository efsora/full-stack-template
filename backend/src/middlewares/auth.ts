import { env } from "#infrastructure/config/env";
import { errorResponse } from "#middlewares/utils/response";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * JWT payload structure
 */
export type JwtPayload = {
  email: string;
  userId: number;
}

/**
 * Extend Express Request to include user
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      isOwner?: boolean;
      resource?: Record<string, unknown>;
      resourceId?: number;
      user?: JwtPayload;
    }
  }
}

/**
 * JWT authentication middleware
 * Verifies JWT token from Authorization header and attaches user to req.user
 */
export function auth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res
        .status(401)
        .json(errorResponse("No authorization token provided", "UNAUTHORIZED"));
      return;
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res
        .status(401)
        .json(errorResponse("Invalid authorization format", "UNAUTHORIZED"));
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res
        .status(401)
        .json(errorResponse("Invalid or expired token", "UNAUTHORIZED"));
      return;
    }

    // Unexpected error
    res
      .status(500)
      .json(
        errorResponse(
          "Internal server error during authentication",
          "INTERNAL_ERROR",
        ),
      );
  }
}
