import { env } from "#infrastructure/config/env";
import pino from "pino";
/**
 * Pino logger instance configured based on environment
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === "development" && env.LOGGER_PRETTY
    ? {
        transport: {
          options: {
            colorize: true,
            ignore: "pid,hostname",
            singleLine: false,
            translateTime: "HH:MM:ss Z",
          },
          target: "pino-pretty",
        },
      }
    : {}),
  base: {
    env: env.NODE_ENV,
    service: env.OTEL_SERVICE_NAME,
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});