# Backend Dockerfile
FROM node:18-alpine

# Install curl for health checks and postgresql-client for database operations
RUN apk add --no-cache curl postgresql-client openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies as root
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Change ownership of entire app directory to node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Generate Prisma client as node user
RUN npx prisma generate

# Create wait script for database
USER root
RUN echo '#!/bin/sh\nset -e\nuntil pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER"; do\n  echo "Waiting for PostgreSQL..."\n  sleep 2\ndone\necho "PostgreSQL is ready!"\nexec "$@"' > /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

# Switch back to non-root user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
