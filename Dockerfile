# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_BASE=/
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_EVAL_URL=/eval

ENV VITE_BASE=${VITE_BASE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_EVAL_URL=${VITE_EVAL_URL}

RUN pnpm build

# ---- Runtime stage ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1