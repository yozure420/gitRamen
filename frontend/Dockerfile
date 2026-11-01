# --- build stage ---
FROM oven/bun:1-alpine AS builder
WORKDIR /app
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN NODE_ENV=production bun run build
# --- production stage ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
