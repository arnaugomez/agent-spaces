# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/policy/package.json ./packages/policy/
COPY packages/sandbox/package.json ./packages/sandbox/
COPY packages/core/package.json ./packages/core/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps/server ./apps/server
COPY tsconfig.json ./

# Build
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directories
RUN mkdir -p /app/data/workspaces

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run
CMD ["bun", "run", "apps/server/src/index.ts"]

