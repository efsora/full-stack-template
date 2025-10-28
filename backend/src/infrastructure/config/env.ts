import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development").transform((val) => val.toLowerCase()),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, "Database URL is required").refine((val) => {
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, { message: "DATABASE_URL must be a valid URL" }),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().min(1, "OTEL_EXPORTER_OTLP_ENDPOINT is required").refine((val) => {
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, { message: "OTEL_EXPORTER_OTLP_ENDPOINT must be a valid URL" }),
    OTEL_SERVICE_NAME: z.string().min(1, "OTEL_SERVICE_NAME is required"),
    ENABLE_TRACING: z.boolean().default(false),
    METRICS_ENABLED: z.boolean().default(false),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    LOGGER_PRETTY: z.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
export const env = envSchema.parse(process.env);