# Buku Panduan Paket Infrastruktur & Deployment Sistem Display Laboratorium

Dokumen resmi ini merupakan panduan teknis operasional (*DevOps & Infrastructure Manual*) untuk penggelaran, pemeliharaan, serta manajemen database **PostgreSQL 16**, backend **NestJS**, dan frontend **Vue 3** pada **Sistem Informasi Jadwal & Monitoring Penggunaan Laboratorium**.

---

## 1. Ringkasan Ekosistem Infrastruktur

Paket infrastruktur ini dibangun menggunakan teknologi **Containerization (Docker & Docker Compose)**. Seluruh komponen aplikasi telah diisolasi dan diotomatisasi sehingga dapat langsung dijalankan di server lokal sekolah (*On-Premise*) maupun server komputasi awan (*Cloud VPS*) tanpa perlu instalasi runtime manual yang rumit.

```
                                  +---------------------------------------+
                                  |         CLIENT / USER BROWSER         |
                                  |   (TV Kiosk Display / Admin / Guru)   |
                                  +---------------------------------------+
                                                      |
                                           Port 80 (HTTP / WS)
                                                      v
+---------------------------------------------------------------------------------------------------+
|  SERVER HOST (DOCKER ENVIRONMENT: lab_network)                                                    |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | [Frontend Service] (Nginx 1.25 Alpine)                                                       |  |
|  | - Port Eksternal: 80                                                                        |  |
|  | - Menyajikan Static Bundle Vue 3 (SPA with Client-Side Routing)                             |  |
|  | - Reverse Proxy:                                                                            |  |
|  |     • /api/*       ---> http://backend:3000/api/*                                           |  |
|  |     • /socket.io/* ---> http://backend:3000/socket.io/* (WebSocket Upgrade)                 |  |
|  |     • /uploads/*   ---> http://backend:3000/uploads/*                                       |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                  |                                                |
|                                       Internal Docker Network                                     |
|                                                  v                                                |
|  +---------------------------------------------------------------------------------------------+  |
|  | [Backend Service] (Node.js 22 LTS / NestJS API Engine)                                       |  |
|  | - Port Internal: 3000 (Diekspos opsional ke host 3000:3000)                                 |  |
|  | - Otomatisasi Startup (docker-entrypoint.sh):                                                |  |
|  |     1. Cek kesiapan PostgreSQL (Loop retry)                                                 |  |
|  |     2. Migrasi skema Prisma (`npx prisma migrate deploy`)                                   |  |
|  |     3. Inisialisasi data awal / Seeding (`RUN_SEED=true`)                                    |  |
|  | - Persistent Volume: `lab_display_backend_uploads` (/app/public/uploads)                    |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                  |                                                |
|                                       Internal Database Driver                                    |
|                                                  v                                                |
|  +---------------------------------------------------------------------------------------------+  |
|  | [Database Service] (PostgreSQL 16 Alpine)                                                   |  |
|  | - Port Eksternal: 5432 (Untuk remote inspection via DBeaver / pgAdmin)                      |  |
|  | - Healthcheck: `pg_isready -U postgres -d lab_display`                                      |  |
|  | - Persistent Volume: `lab_display_postgres_data` (/var/lib/postgresql/data)                 |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Kebutuhan Spesifikasi Server

Sistem dirancang hemat sumber daya (*lightweight*) dengan *memory footprint* total kontainer di bawah **800 MB RAM**.

### A. Skenario On-Premise (Mini PC / Server Lab / Komputer Sekolah)
Cocok dipasang pada Mini PC (seperti Intel NUC, ASUS Mini PC, atau PC desktop lama yang difungsikan sebagai server lab):
- **Prosesor**: Intel Core i3 / Celeron generasi modern (minimal 2 Core, 2.0 GHz)
- **RAM**: Minimal 4 GB (Rekomendasi 8 GB jika server juga menjalankan browser display TV)
- **Penyimpanan**: SSD 64 GB (Sisa ruang minimal 15 GB untuk OS dan Docker image)
- **Sistem Operasi**: Ubuntu Server 22.04 / 24.04 LTS, Debian 12, atau Windows 10/11 Pro (dengan Docker Desktop WSL2)
- **Konektivitas**: Gigabit LAN / Wi-Fi stabil (IP statis direkomendasikan)

### B. Skenario Cloud VPS (Virtual Private Server)
Cocok jika display TV dan sistem reservasi ingin diakses langsung dari internet / luar sekolah:
- **Paket Minimum**: 1 vCPU, 2 GB RAM, 25 GB SSD (Misal: DigitalOcean \$12/bln, IDCloudHost, Biznet Gio, atau Niagahoster VPS)
- **Paket Rekomendasi**: 2 vCPU, 4 GB RAM, 50 GB SSD

---

## 3. Langkah Instalasi Cepat (Quick Start 3 Langkah)

Pastikan server telah terpasang **Docker Engine** dan **Docker Compose v2**.

### Langkah 1: Kloning Repositori / Ekstrak Berkas
Pindahkan folder proyek ke server:
```bash
cd /opt/display-jadwal-penggunaan-lab
# atau di direktori kerja pilihan Anda
```

### Langkah 2: Buat Berkas Konfigurasi `.env`
Salin template konfigurasi yang sudah disediakan:
```bash
cp .env.example .env
```
*(Opsional)* Buka file `.env` dengan text editor (misal: `nano .env`) jika ingin mengubah password PostgreSQL atau port HTTP:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password_rahasia_sekolah
POSTGRES_DB=lab_display
FRONTEND_PORT=80
```

### Langkah 3: Nyalakan Seluruh Sistem
Cukup jalankan satu perintah berikut:
```bash
docker compose up -d --build
```

Docker akan mengunduh image, melakukan kompilasi otomatis, menyalakan database PostgreSQL, melakukan migrasi skema tabel, dan menyalakan display web.

Akses sistem di browser:
- **Tampilan Display TV Kiosk**: `http://<IP_SERVER>/`
- **Dashboard Admin / Laboran**: `http://<IP_SERVER>/login`
- **Swagger API Documentation**: `http://<IP_SERVER>:3000/api/docs`

---

## 4. Akun & Kredensial Awal (Default Seeding)

Saat sistem pertama kali menyala, database PostgreSQL langsung terisi data laboratorium lengkap dan akun pengguna awal:

| Peran (Role) | Username / Email | Password Default | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sekolah.sch.id` | `Admin#2026!` | Pengaturan sistem, manajemen lab, audit log |
| **Laboran (Petugas)** | `laboran@sekolah.sch.id` | `Laboran#2026!` | Verifikasi & persetujuan booking, operasional lab |
| **Guru / Dosen** | `guru@sekolah.sch.id` | `Guru#2026!` | Pengajuan peminjaman ruang & input jadwal mengajar |
| **Siswa / Mahasiswa** | `siswa@sekolah.sch.id` | `Siswa#2026!` | Melihat ketersediaan lab dan antrean jadwal |

> [!WARNING]
> Sangat disarankan untuk segera mengubah password akun administrator dan laboran setelah sistem berhasil diluncurkan ke tahap produksi melalui menu profil aplikasi.

---

## 5. Prosedur Manajemen Database PostgreSQL

### A. Cara Membuat Cadangan Data (Backup Manual)
Untuk membuat cadangan database secara instan ke berkas SQL:
```bash
docker compose exec -T postgres pg_dump -U postgres -d lab_display > backup_lab_display_$(date +%Y%m%d_%H%M%S).sql
```

### B. Cara Memulihkan Data (Restore Database)
Jika ingin mengembalikan database dari file cadangan `.sql`:
```bash
cat nama_file_backup.sql | docker compose exec -T postgres psql -U postgres -d lab_display
```

### C. Menghubungkan DBeaver / pgAdmin (Remote GUI)
Admin IT sekolah dapat langsung memeriksa data tabel menggunakan software GUI manajemen database dari komputer lain di jaringan lokal:
- **Host**: `<IP_ADDRESS_SERVER>`
- **Port**: `5432`
- **Database**: `lab_display`
- **Username**: `postgres`
- **Password**: *(sesuai dengan yang disetel pada file `.env`)*

---

## 6. Perintah Pemeliharaan Harian (Cheat Sheet)

Berikut ringkasan perintah praktis untuk tim IT:

| Tujuan | Perintah |
| :--- | :--- |
| **Melihat status semua kontainer** | `docker compose ps` |
| **Melihat log real-time aplikasi** | `docker compose logs -f` |
| **Melihat log backend saja** | `docker compose logs -f backend` |
| **Melihat log PostgreSQL saja** | `docker compose logs -f postgres` |
| **Restart seluruh layanan** | `docker compose restart` |
| **Mematikan sistem sementara** | `docker compose stop` |
| **Menghidupkan kembali sistem** | `docker compose start` |
| **Memperbarui kode program (Deploy Update)** | `git pull && docker compose up -d --build` |
| **Reset total database (HATI-HATI: Data hilang)** | `docker compose down -v && docker compose up -d` |

---

## 7. Penanganan Masalah (Troubleshooting)

### Q: Port 80 sudah digunakan oleh web server lain di server sekolah (misal Apache/Nginx bawaan OS)
**Solusi**:
Buka file `.env`, ubah nilai `FRONTEND_PORT`:
```ini
FRONTEND_PORT=8080
```
Lalu jalankan `docker compose up -d`. Sistem sekarang dapat diakses melalui `http://<IP_SERVER>:8080`.

### Q: Tampilan TV Display tidak otomatis berganti saat jadwal diperbarui (WebSocket Disconnect)
**Solusi**:
Pastikan port `80` atau reverse proxy sekolah tidak memblokir header WebSocket. Konfigurasi `nginx.conf` di dalam paket ini sudah menyertakan `proxy_set_header Upgrade $http_upgrade;` dan `Connection "upgrade"` secara default.

### Q: Bagaimana cara mematikan seeding otomatis setelah pertama kali jalan?
**Solusi**:
Buka file `.env`, ubah variabel:
```ini
RUN_SEED=false
```
Dengan begitu, restart berikutnya tidak akan memicu script seed ulang.
