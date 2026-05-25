FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
RUN pnpm prisma generate
ENV CRON_RUNNER_AUTOSTART=true
CMD ["pnpm", "exec", "tsx", "src/lib/jobs/cron-runner.ts"]
