#!/bin/sh
set -e

echo "🚀 [ENTRYPOINT] Menyiapkan layanan Backend & PostgreSQL..."

# 1. Tunggu database PostgreSQL siap menerima koneksi
echo "⏳ [ENTRYPOINT] Menunggu database PostgreSQL online di $DATABASE_URL..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => { client.end(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   ...Database belum siap, mencoba lagi dalam 2 detik..."
  sleep 2
done
echo "✅ [ENTRYPOINT] Terkoneksi ke database PostgreSQL."

# 2. Jalankan migrasi Prisma ke database
echo "🔄 [ENTRYPOINT] Menjalankan Prisma Database Migration..."
npx prisma migrate deploy

# 3. Jalankan Database Seeding jika diaktifkan (default: true pada inisialisasi)
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 [ENTRYPOINT] RUN_SEED=true terdeteksi. Mengisi data awal (Roles, Users, Laboratories, Schedules)..."
  npx prisma db seed || echo "⚠️ [ENTRYPOINT] Seeding dilewati atau data awal sudah ada."
fi

# 4. Pastikan direktori uploads tersedia
mkdir -p /app/public/uploads/avatars

# 5. Jalankan aplikasi NestJS
echo "✨ [ENTRYPOINT] Memulai NestJS Application pada port ${PORT:-3000}..."
exec "$@"
