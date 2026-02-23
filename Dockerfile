FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS builder
COPY package*.json tsconfig*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
