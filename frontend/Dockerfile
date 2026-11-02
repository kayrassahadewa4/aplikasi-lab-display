# ==========================================
# Multi-stage Dockerfile - Frontend (Vue 3 + Nginx)
# ==========================================

# Stage 1: Build source code Vue 3 menggunakan Node.js
FROM node:22-alpine AS builder

WORKDIR /app

# Salin manifest dependensi
COPY package*.json ./

# Install dependensi
RUN npm ci

# Salin seluruh source code frontend
COPY . .

# Argument build untuk konfigurasi base URL API dan WebSocket
# Default menggunakan reverse proxy internal Nginx (/api)
ARG VITE_API_BASE_URL=/api
ARG VITE_WS_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Kompilasi aplikasi menjadi aset statis produksi di direktori dist/
RUN npm run build-only

# Stage 2: Sajikan aset statis menggunakan Nginx Alpine
FROM nginx:alpine AS runner

# Salin hasil kompilasi Vue ke direktori web server Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Salin konfigurasi Nginx kustom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Buka port 80 untuk lalu lintas HTTP
EXPOSE 80

# Jalankan Nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
