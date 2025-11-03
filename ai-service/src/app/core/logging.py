from __future__ import annotations

import logging
import sys

import structlog

from app.core.settings import Settings


def setup_logging(settings: Settings) -> None:
    """Configure structlog with appropriate handlers and processors.

    Args:
        settings: Application settings containing LOG_LEVEL and LOG_FORMAT
    """
    log_level = getattr(logging, settings.LOG_LEVEL, logging.INFO)
    use_json = settings.LOG_FORMAT.lower() == "json"

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Processors for structlog
    shared_processors = [
        # Add log level and a timestamp to the event dict
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        # Add the request context if available
        structlog.contextvars.merge_contextvars,
        # Optimize the event dict and call processors
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if use_json:
        # Production: JSON structured logging using structlog's built-in JSON renderer
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.processors.dict_tracebacks,
                structlog.processors.JSONRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Development/Console: Pretty-printed output
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.dev.ConsoleRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=False,
        )


def get_logger(name: str = __name__) -> structlog.BoundLogger:
    """Get a configured structlog logger.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured structlog logger instance
    """
    return structlog.get_logger(name)
