# --- build stage ---
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN NODE_ENV=production bun run build
# --- production stage ---
FROM nginx:alpine
RUN printf 'server {\n    listen 3000;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n\n    location /api/ {\n        resolver 127.0.0.11 ipv6=off;\n        rewrite ^/api/?(.*)$ /$1 break;\n        proxy_pass http://backend:8000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n}\n' > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]