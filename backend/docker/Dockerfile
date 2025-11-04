# Use Node.js 22 (matching .nvmrc)
FROM node:22

# Install PostgreSQL client for database wait script
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (includes dev deps for tsx, drizzle-kit, etc.)
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Copy and set permissions for entrypoint script
COPY backend/scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the application port
EXPOSE 3000

# Use the entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]