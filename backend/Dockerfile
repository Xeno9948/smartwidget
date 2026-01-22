# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy backend source code
COPY backend/src ./src

# Copy widget dist files
# Note: widget must be built before Docker build
COPY widget/dist ./widget/dist/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server
CMD ["sh", "-c", "node src/utils/migrate.js && node src/server.js"]
