# ==========================================
# Production Dockerfile - Backend (NestJS + Prisma)
# ==========================================
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Install dependensi sistem yang dibutuhkan Prisma Engine dan dumb-init untuk process signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl dumb-init ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Salin manifest dependensi dan skema prisma
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install seluruh dependensi untuk proses build
RUN npm ci

# Generate Prisma Client (Linux engine)
RUN npx prisma generate

# Salin seluruh source code backend
COPY . .

# Build TypeScript menjadi JavaScript di direktori dist/
RUN npm run build

# Siapkan direktori public upload
RUN mkdir -p /app/public/uploads/avatars

# Normalisasi line-ending script entrypoint (mencegah error CRLF Windows)
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Environment default
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
