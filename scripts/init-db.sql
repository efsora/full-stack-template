-- Initialize databases and users for backend and AI services

-- Create backend database and user
CREATE DATABASE backend_db;
CREATE USER backend_user WITH PASSWORD 'backend_password';
GRANT ALL PRIVILEGES ON DATABASE backend_db TO backend_user;

-- Connect to backend_db to grant schema permissions
\c backend_db;
GRANT ALL ON SCHEMA public TO backend_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO backend_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO backend_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO backend_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO backend_user;

-- Create backend schema for future use
CREATE SCHEMA IF NOT EXISTS backend_schema;
GRANT ALL PRIVILEGES ON SCHEMA backend_schema TO backend_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA backend_schema TO backend_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA backend_schema GRANT ALL PRIVILEGES ON TABLES TO backend_user;

-- Switch back to default database for AI setup
\c postgres;

-- Create AI schema in the main database
CREATE SCHEMA IF NOT EXISTS ai_schema;

-- Grant permissions for cross-service access
-- AI service can read from backend schema but not write
GRANT USAGE ON SCHEMA backend_schema TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA backend_schema TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA backend_schema GRANT SELECT ON TABLES TO postgres;

-- AI service has full access to its own schema
GRANT ALL PRIVILEGES ON SCHEMA ai_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_schema TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_schema GRANT ALL PRIVILEGES ON TABLES TO postgres;
