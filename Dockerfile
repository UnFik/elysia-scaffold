FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3001

COPY --from=builder /app/server ./server
RUN chmod +x ./server

ENTRYPOINT ["./server"]