-- Initialize database schemas

-- Create backend schema
CREATE SCHEMA IF NOT EXISTS backend_schema;

-- Create AI schema
CREATE SCHEMA IF NOT EXISTS ai_schema;

-- Grant permissions
-- AI service can read from backend schema but not write
GRANT USAGE ON SCHEMA backend_schema TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA backend_schema TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA backend_schema GRANT SELECT ON TABLES TO postgres;

-- AI service has full access to its own schema
GRANT ALL PRIVILEGES ON SCHEMA ai_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_schema TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_schema GRANT ALL PRIVILEGES ON TABLES TO postgres;

-- Backend service has full access to its own schema
GRANT ALL PRIVILEGES ON SCHEMA backend_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA backend_schema TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA backend_schema GRANT ALL PRIVILEGES ON TABLES TO postgres;
