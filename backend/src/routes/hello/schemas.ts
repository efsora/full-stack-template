import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Hello response schema
 */
export const helloResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Hello from API" }),
  })
  .openapi("HelloResponse");

export type HelloResponse = z.infer<typeof helloResponseSchema>;
