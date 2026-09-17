# 🖥️ Laboratory Room Schedule & Real-Time Equipment Display System
### *Sistem Monitoring Jadwal & Ketersediaan Peralatan Laboratorium Komputer Real-Time*
**Fakultas Ilmu Komputer — UPN "Veteran" Jakarta**

---

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

---

## 📌 Ringkasan Proyek

**Sistem Monitoring Jadwal & Ketersediaan Peralatan Laboratorium** adalah aplikasi web *full-stack* berbasis real-time yang dirancang khusus untuk memodernisasi tata kelola, pemantauan okupansi, serta transparansi fasilitas laboratorium komputer di lingkungan kampus.

Aplikasi ini mengintegrasikan portal manajemen operasional laboratorium untuk Staf Laboran/Admin/Dosen dengan **Layar Informasi Publik Kiosk / TV Display** interaktif yang dipasang di lorong laboratorium. Seluruh data jadwal kuliah, status peminjaman ruang, absensi check-in/out, pengumuman akademik, hingga **kelaikan dan ketersediaan peralatan (komputer PC, proyektor, pendingin ruangan/AC, koneksi jaringan LAN/WiFi)** diperbarui secara instan melalui protokol **WebSocket (Socket.IO)** tanpa memerlukan *refresh* halaman manual.

---

## 🚀 Fitur Unggulan

### 1. 📺 Layar Display Publik Real-Time (`/display`)
Dirancang khusus untuk layar Smart TV / Kiosk Display dengan antarmuka sinematik, responsif, dan elegan berstandar identitas visual kampus FIK UPNVJ:
* **Live Occupancy Room Matrix**: Menampilkan kartu status dinamis untuk seluruh laboratorium (`Sedang Aktif / Praktikum Berlangsung`, `Tersedia & Siap Digunakan`, `Sesi Berikutnya / Segera Hadir`, serta `Dalam Pemeliharaan`).
* **Dynamic Urgency Meter & Countdown**: Sesi praktikum yang aktif dilengkapi indikator progres waktu bercahaya (*glowing meter*) dan hitung mundur sisa durasi menit secara akurat.
* **🛠️ Pengecekan Ketersediaan Peralatan Laboratorium Real-Time (*Live Equipment Inspector*)**:
  * Menampilkan indeks kesehatan alat (*readiness rate %*) di bilah informasi utama.
  * Kartu laboratorium menyajikan statistik alat riil dari database (misal: jumlah unit PC aktif, proyektor, AC, dsb.).
  * **Interactive Equipment Modal**: Pengunjung atau mahasiswa dapat mengklik tombol status alat untuk membuka jendela inspeksi rinci:
    * Melihat daftar seluruh inventaris per ruangan beserta kode fasilitas dan kategorinya.
    * Mengetahui kondisi setiap unit: **Siap Pakai (Baik)**, **Dalam Perawatan (Maintenance)**, atau **Rusak (Trouble)**.
    * Dilengkapi tab cepat untuk beralih inspeksi antar laboratorium secara instan.
* **Timetable Stream Jadwal Hari Ini**: Aliran jadwal sesi kuliah dan peminjaman ruang untuk hari aktif yang tersortir kronologis.
* **Pusat Informasi & Layanan Lab (Showcase Widget)**: Panel tab mandiri dengan rotasi otomatis (*auto-rotate*) atau manual yang menyajikan panduan tata tertib lab, prosedur peminjaman, jam operasional, dan kesiapan fasilitas.
* **Running Text / Marquee Berita**: Teks berjalan di bagian bawah layar yang menampilkan pengumuman resmi fakultas secara langsung dari basis data.
* **Mode Kontras Tinggi (Dark & Light Mode)**: Dukungan tema gelap (*FIK Emerald Dark Mode*) dengan aksen emas yang ramah layar TV hemat energi, serta tema terang bersih.
* **Dukungan Mode Layar Penuh (TV Kiosk Mode)**: Tombol layar penuh satu klik (*fullscreen toggle*) yang mulus.

### 2. 📅 Manajemen Jadwal Kuliah & Deteksi Bentrok
* Penyusunan jadwal perkuliahan semesteran per mata kuliah, dosen, kelas, ruang lab, hari, dan rentang jam.
* Algoritma validasi otomatis untuk mencegah bentrok jadwal (*conflict detection*) pada ruangan dan slot waktu yang sama.

### 3. 📝 Peminjaman Ruangan & Alur Persetujuan Bertingkat (*Room Request & Approval*)
* Dosen atau perwakilan mahasiswa dapat mengajukan permohonan penggunaan lab di luar jadwal perkuliahan reguler.
* Dasbor verifikasi bagi Kepala Lab dan Staf Laboran untuk menyetujui (*Approve*) atau menolak (*Reject*) permohonan disertai catatan verifikasi.
* Notifikasi status persetujuan yang terintegrasi.

### 4. ⏱️ Check-In & Check-Out Penggunaan Ruang (*Live Room Usage Tracking*)
* Staf laboran atau dosen pengajar dapat melakukan *check-in* saat kegiatan laboratorium dimulai.
* Status ruangan seketika berubah menjadi `IN_USE` pada Public Display secara *real-time*.
* Tersedia mekanisme *force check-out* dan penutupan sesi otomatis ketika waktu kegiatan telah berakhir.

### 5. 📦 Manajemen Fasilitas & Inventaris Laboratorium
* Master data fasilitas kampus (Komputer PC Client, Komputer PC Server, LCD Proyektor, AC Split, Switch Hub / Router Gigabit, Papan Tulis).
* Pemetaan fasilitas per laboratorium beserta kuantitas unit dan status kondisinya (`GOOD`, `DAMAGED`, `UNDER_MAINTENANCE`).
* Setiap pembaruan status alat oleh staf laboran otomatis menyinkronkan data ke layar display publik.

### 6. 📊 Laporan & Rekapitulasi (*Reporting*)
* Laporan histori penggunaan laboratorium berdasarkan filter rentang tanggal, jenis kegiatan, dan ruangan.
* Fitur ekspor berkas rekapitulasi ke format spreadsheet (Excel) dan cetak PDF.

### 7. 🔐 Keamanan & Kontrol Akses Berbasis Peran (*Role-Based Access Control*)
* Autentikasi berbasis JWT (*JSON Web Token*) dengan enkripsi kata sandi menggunakan `bcrypt`.
* Tiga tingkat hak akses utama:
  1. **Admin**: Hak akses menyeluruh terhadap konfigurasi sistem, peran, pengguna, kalender akademik, dan audit log.
  2. **Laboran**: Pengelolaan operasional harian lab, persetujuan peminjaman, check-in/out, inventaris fasilitas, dan pengumuman.
  3. **Dosen / Pemohon**: Pengajuan peminjaman ruang, pengecekan ketersediaan jadwal, dan riwayat permohonan.

---

## 🏗️ Arsitektur & Teknologi

```
┌───────────────────────────────────────────────────────────┐
│                    KLIEN / PENGGUNA                       │
│  ┌───────────────────────┐     ┌───────────────────────┐  │
│  │   Public Display TV   │     │ Portal Web Manajemen  │  │
│  │    (Layar Kiosk Lab)  │     │  (Admin/Laboran/User) │  │
│  └───────────┬───────────┘     └───────────┬───────────┘  │
└──────────────┼─────────────────────────────┼──────────────┘
               │ WebSocket                   │ REST API
               ▼                             ▼
┌───────────────────────────────────────────────────────────┐
│                 BACKEND SERVICE (NestJS 11)               │
│  ┌─────────────────────────┐ ┌─────────────────────────┐  │
│  │ EventsGateway (WS)      │ │ REST Controllers & DTOs │  │
│  │ - display:sync          │ │ - Auth, Display, Lab,   │  │
│  │ - usage:update          │ │   Facility, Schedule,   │  │
│  │ - schedule:update       │ │   RoomRequest, Report   │  │
│  └───────────┬─────────────┘ └────────────┬────────────┘  │
│              └──────────────┬─────────────┘               │
│                             ▼                             │
│               Prisma ORM & Business Logic                 │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│             DATABASE ENGINE (PostgreSQL 17)               │
│   Laboratories, Facilities, Schedules, Usages, Users...   │
└───────────────────────────────────────────────────────────┘
```

### Rincian Pustaka & Framework

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 11** | Arsitektur backend modular, *enterprise-grade*, berbasis TypeScript |
| **Database ORM** | **Prisma 6** | Pemetaan relasional skema database, migrasi otomatis, dan *type-safe queries* |
| **Database Engine** | **PostgreSQL 17** | RDBMS tangguh untuk transaksi inventaris dan jadwal terstruktur |
| **Real-Time Engine** | **Socket.IO Gateway** | Komunikasi dua arah berbasis event untuk pembaruan instan (*push update*) |
| **Dokumentasi API** | **Swagger / OpenAPI** | Spesifikasi interaktif API yang dapat diuji langsung melalui peramban |
| **Frontend Framework** | **Vue.js 3** | Menggunakan Single File Component (SFC) dengan modern `<script setup>` |
| **Build Tool** | **Vite 6** | *Next generation frontend tooling* dengan kompilasi super cepat |
| **Styling Engine** | **Tailwind CSS v4** | *Utility-first CSS framework* generasi terbaru dengan performa tinggi |
| **State Management** | **Pinia** | Pengelolaan *global state* terpusat yang aman secara tipe (*type-safe*) |
| **Ikonografi** | **Lucide Vue Next** | Kumpulan ikon vektor modern dan konsisten |

---

## 📁 Struktur Direktori Proyek

```
display-jadwal-penggunaan-lab/
├── backend/                               # Server API & WebSocket (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma                  # Definisi skema basis data PostgreSQL
│   │   ├── migrations/                    # Riwayat migrasi Prisma
│   │   └── seed.ts                        # Script seeding data awal (Master lab, fasilitas, user)
│   ├── src/
│   │   ├── common/                        # Shared decorators, guards, filters, interceptors
│   │   ├── config/                        # Konfigurasi aplikasi & environment
│   │   ├── modules/                       # Modul-modul fitur aplikasi:
│   │   │   ├── academic-calendar/         # Manajemen kalender akademik & semester
│   │   │   ├── announcement/              # Manajemen pengumuman & broadcast running text
│   │   │   ├── auth/                      # Otentikasi JWT & registrasi akun
│   │   │   ├── display/                   # Endpoint khusus aggregasi data Display Publik & WS Gateway
│   │   │   ├── facility/                  # Manajemen inventaris peralatan lab & kondisi alat
│   │   │   ├── laboratory/                # Master data laboratorium komputer
│   │   │   ├── notifications/             # Sistem pemberitahuan internal
│   │   │   ├── operational-hour/          # Konfigurasi jam operasional lab
│   │   │   ├── reports/                   # Modul laporan, histori okupansi & ekspor data
│   │   │   ├── role/                      # Pengaturan hak akses peran (RBAC)
│   │   │   ├── room-request/              # Peminjaman ruangan & alur persetujuan
│   │   │   ├── room-usage/                # Check-in, check-out & tracking kehadiran
│   │   │   ├── schedule/                  # Jadwal perkuliahan & deteksi bentrok
│   │   │   ├── settings/                  # Konfigurasi sistem umum
│   │   │   └── user/                      # Manajemen profil & akun pengguna
│   │   ├── app.module.ts                  # Modul utama aplikasi
│   │   └── main.ts                        # Entry point server NestJS & bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                              # Aplikasi Web SPA (Vue 3 + Vite)
│   ├── public/                            # Aset publik statis (Logo UPNVJ, favicon, gambar)
│   ├── src/
│   │   ├── assets/                        # Gambar & aset gaya visual
│   │   ├── components/                    # Komponen antarmuka (UI, modals, cards, navigasi)
│   │   ├── composables/                   # Vue composables (useApi, useTheme, dsb.)
│   │   ├── layouts/                       # Template layout (AdminLayout, LaboranLayout, LecturerLayout)
│   │   ├── router/                        # Konfigurasi rute halaman & navigation guards
│   │   ├── services/                      # Klien HTTP Axios & komunikasi API endpoint
│   │   ├── stores/                        # Store Pinia (auth.store, app.store, dsb.)
│   │   ├── styles/                        # File CSS utama & konfigurasi Tailwind
│   │   ├── types/                         # Definisi tipe TypeScript
│   │   └── views/                         # Komponen halaman:
│   │       ├── auth/                      # Halaman Login & Registrasi
│   │       ├── dashboard/                 # Dasbor Admin, Laboran & Dosen
│   │       ├── laboratories/              # Pengelolaan laboratorium & fasilitas
│   │       ├── public/
│   │       │   └── DisplayPage.vue        # 🌟 Halaman Utama Layar Display Kiosk TV
│   │       ├── requests/                  # Pengajuan & persetujuan peminjaman
│   │       ├── schedules/                 # Penjadwalan perkuliahan
│   │       ├── usages/                    # Riwayat & kontrol check-in penggunaan lab
│   │       └── reports/                   # Laporan statistik penggunaan
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md                              # Dokumentasi lengkap proyek
```

---

## ⚙️ Panduan Instalasi & Menjalankan Sistem

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang perangkat lunak berikut:
* **Node.js**: Versi `20.x` atau `22.x` (LTS direkomendasikan)
* **npm**: Versi `10.x` ke atas
* **PostgreSQL**: Versi `16` atau `17`
* Peramban modern (Google Chrome, Microsoft Edge, atau Firefox)

---

### 2. Konfigurasi Basis Data PostgreSQL
Buat sebuah database baru di PostgreSQL (misal melalui `psql` atau pgAdmin):
```sql
CREATE DATABASE lab_display_db;
```

---

### 3. Menyiapkan Backend

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Salin berkas lingkungan dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```
3. Buka file `.env` dan atur string koneksi basis data:
   ```env
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   DATABASE_URL="postgresql://postgres:password_kamu@localhost:5432/lab_display_db?schema=public"
   JWT_SECRET="kunci_rahasia_jwt_display_lab_upnvj_2026"
   JWT_EXPIRATION="1d"
   ```
4. Pasang seluruh dependensi:
   ```bash
   npm install
   ```
5. Jalankan migrasi basis data Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Jalankan *database seeder* untuk mengisi data laboratorium, akun awal, dan fasilitas:
   ```bash
   npm run seed
   ```
7. Jalankan server backend dalam mode pengembangan:
   ```bash
   npm run start:dev
   ```
   *Backend akan berjalan di `http://localhost:3000`*.
   *Dokumentasi Swagger API aktif di `http://localhost:3000/docs`*.

---

### 4. Menyiapkan Frontend

1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Salin berkas lingkungan:
   ```bash
   cp .env.example .env
   ```
3. Pastikan konfigurasi alamat backend pada `.env` telah sesuai:
   ```env
   VITE_API_BASE_URL="http://localhost:3000/api"
   VITE_WS_URL="http://localhost:3000"
   ```
4. Pasang dependensi frontend:
   ```bash
   npm install
   ```
5. Jalankan server frontend Vite:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di `http://localhost:5173`*.

---

## 🔑 Akun Bawaan Sistem (*Seed Accounts*)

Setelah menjalankan `npm run seed`, Anda dapat langsung masuk ke aplikasi menggunakan akun bawaan berikut:

| Peran (Role) | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@upnvj.ac.id` | `Admin@123` | Akses penuh seluruh sistem, pengaturan, peran, & audit |
| **Staf Laboran** | `laboran@upnvj.ac.id` | `Laboran@123` | Pengelolaan lab, jadwal, persetujuan peminjaman, check-in, inventaris alat |
| **Dosen Pengajar** | `dosen@upnvj.ac.id` | `Dosen@123` | Pengajuan peminjaman lab & pemantauan jadwal mata kuliah |

---

## 🌐 Akses Halaman Penting

| Layanan / Halaman | URL Akses | Deskripsi |
| :--- | :--- | :--- |
| **Public TV Display** | `http://localhost:5173/display` | Layar Kiosk Informasi Real-Time (Tanpa Autentikasi) |
| **Portal Dasbor** | `http://localhost:5173/login` | Halaman login untuk Admin, Laboran, dan Dosen |
| **REST API Server** | `http://localhost:3000/api` | Base URL Backend REST API |
| **Swagger API Docs** | `http://localhost:3000/docs` | Dokumentasi interaktif spesifikasi endpoint API |

---

## 📡 Daftar Event WebSocket (Socket.IO)

Display publik secara otomatis mendengarkan saluran event WebSocket berikut untuk memperbarui tampilan tanpa jeda:

| Nama Event | Pemicu (*Trigger*) | Tindakan Display Publik |
| :--- | :--- | :--- |
| `display:sync` | Perubahan data fasilitas / inventaris alat laboratorium | Memperbarui status ketersediaan & kelaikan alat secara instan |
| `schedule:update` | Perubahan, penambahan, atau pembatalan jadwal perkuliahan | Memperbarui jadwal hari ini & status kartu ruangan |
| `room-request:update` | Persetujuan atau pengajuan peminjaman lab baru | Menyelaraskan sesi peminjaman ke jadwal aktif |
| `usage:update` | Dosen/Laboran melakukan Check-In atau Check-Out | Mengubah status lab menjadi `IN_USE` atau `AVAILABLE` seketika |

---

## 👨‍💻 Kontributor & Penulis

* **Herlambang Sahadewa**
* Fakultas Ilmu Komputer, Universitas Pembangunan Nasional "Veteran" Jakarta

---

## 📄 Lisensi

Proyek ini dikembangkan sebagai karya tugas akhir (*Final Year Thesis*) untuk kemajuan tata kelola fasilitas laboratorium Fakultas Ilmu Komputer UPN "Veteran" Jakarta. Hak Cipta dilindungi.
