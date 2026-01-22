# Stage 1: Build Widget
FROM node:20-alpine AS widget-builder
WORKDIR /build

# Copy widget dependencies and build
COPY widget/package*.json ./
RUN npm install
COPY widget/ ./
RUN npm run build

# Stage 2: Setup Backend
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/src ./src

# Copy built widget from Stage 1
# We copy it to ../widget/dist relative to /app/src, which means /app/widget/dist
COPY --from=widget-builder /build/dist ./widget/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server directly
CMD ["node", "src/server.js"]
