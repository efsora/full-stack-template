import type { Request } from "express";

import { runEffect } from "#lib/effect/index";
import { login, register } from "#core/users/index";

import { LoginBody, RegisterBody } from "./schemas";

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