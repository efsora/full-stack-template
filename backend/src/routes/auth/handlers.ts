import type { Request } from "express";

import { runEffect } from "#shared/effect/index.js";
import { login } from "#core/users/login.workflow.js";
import { register } from "#core/users/register.workflow.js";

import { LoginBody, RegisterBody } from "./schemas.js";

/**
 * POST /auth/login
 * Login with email and password
 */
export async function handleLogin(req: Request) {
  const body = req.body as LoginBody;
  return await runEffect(login(body));
}

/**
 * POST /auth/register
 * Register a new user
 */
export async function handleRegister(req: Request) {
  const body = req.body as RegisterBody;
  return await runEffect(register(body));
}