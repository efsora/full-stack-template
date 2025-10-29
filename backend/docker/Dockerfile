# Use Node.js 22 (matching .nvmrc)
FROM node:22

# Set working directory
WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Install dependencies using workspace (skip prepare scripts like husky)
RUN npm ci --workspace=backend --ignore-scripts

# Copy backend source code
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Expose the application port
EXPOSE 3000

# Start the application with hot-reload
CMD ["npm", "run", "dev:docker"]