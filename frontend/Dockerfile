# ───────────────────────────────────────────
# Stage 1: Build
# ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first so Docker layer cache is used efficiently
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

COPY . .

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ───────────────────────────────────────────
# Stage 2: Serve
# ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
