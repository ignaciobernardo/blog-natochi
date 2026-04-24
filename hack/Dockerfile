# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate
WORKDIR /app

# Install deps first (cached unless package.json/lockfile change)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM deps AS builder

# Copy source
COPY . .

# Build-time args for NEXT_PUBLIC_* vars (baked into the client bundle)
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ARCADE_EMBED_DOMAIN
ARG GOOGLE_PHOTOS_ALBUM_URL
ARG POSTGRES_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG SLACK_BOT_TOKEN
ARG GOOGLE_DRIVE_BASE_FOLDER_ID
ARG TEAM_UPLOAD_TRACKING_EXCEL

# Sentry source map upload
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_ARCADE_EMBED_DOMAIN=$NEXT_PUBLIC_ARCADE_EMBED_DOMAIN \
    GOOGLE_PHOTOS_ALBUM_URL=$GOOGLE_PHOTOS_ALBUM_URL \
    POSTGRES_URL=$POSTGRES_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
    GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
    SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN \
    GOOGLE_DRIVE_BASE_FOLDER_ID=$GOOGLE_DRIVE_BASE_FOLDER_ID \
    TEAM_UPLOAD_TRACKING_EXCEL=$TEAM_UPLOAD_TRACKING_EXCEL \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,id=next-build-cache,target=/app/.next/cache,sharing=locked \
    pnpm next build

# Stage 3: Migration runner (for deploy-time DB migrations)
FROM deps AS migrator
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY scripts/db-migrate.mjs ./scripts/db-migrate.mjs
COPY src/lib/db/migrations ./src/lib/db/migrations

CMD ["node", "scripts/db-migrate.mjs"]

# Stage 4: Production app runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# ffmpeg is used by the arcade gameplay preview encoder
RUN apk add --no-cache ffmpeg

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
