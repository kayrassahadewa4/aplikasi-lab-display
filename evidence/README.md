# 📁 Repositori Bukti Pengujian Sistem (Test Evidence Master)
**Sistem Monitoring Jadwal & Ketersediaan Peralatan Laboratorium Komputer Real-Time**  
*Fakultas Ilmu Komputer — UPN "Veteran" Jakarta*

---

Dokumen ini merupakan repositori resmi bukti hasil pengujian **User Acceptance Testing (UAT)** untuk klien. Seluruh 12 kasus uji telah diverifikasi dan dinyatakan **100% PASS (Lolos)**.

## 📑 Daftar Cepat Kasus Uji
* [TC-CL-01: Login Akun Sah (Admin / Laboran) dengan Autentikasi JWT](#tc-cl-01)
* [TC-CL-02: Pencegahan Akses Ilegal Antar Role (RBAC Security Guard)](#tc-cl-02)
* [TC-CL-03: Validasi Deteksi Bentrok Jadwal Perkuliahan (Conflict Detection)](#tc-cl-03)
* [TC-CL-04: Pengajuan Peminjaman Lab dengan Berkas Lampiran Sah (PDF)](#tc-cl-04)
* [TC-CL-05: Validasi Ukuran dan Tipe Ekstensi Berkas Unggahan (> 5MB / Ilegal)](#tc-cl-05)
* [TC-CL-06: Alur Peninjauan & Persetujuan Permohonan Ruang (Approval Workflow)](#tc-cl-06)
* [TC-CL-07: Pencatatan Sesi Check-In & Tracking Status Ruangan Real-Time](#tc-cl-07)
* [TC-CL-08: Pelaporan Tiket Kendala Kerusakan Fasilitas Laboratorium (Ticketing)](#tc-cl-08)
* [TC-CL-09: Transmisi Pembaruan Data Layar Display TV Zero-Reload (< 500 ms)](#tc-cl-09)
* [TC-CL-10: Interaktivitas Jendela Inspeksi Peralatan Laboratorium (Equipment Modal)](#tc-cl-10)
* [TC-CL-11: Penyaringan Histori & Ekspor Rekapitulasi Laporan ke Spreadsheet Excel](#tc-cl-11)
* [TC-CL-12: Ketahanan Operasional Kiosk 24/7 & Auto-Reconnect Gangguan Jaringan](#tc-cl-12)

---

## <a id="tc-cl-01"></a>🧪 TC-CL-01: Login Akun Sah (Admin / Laboran) dengan Autentikasi JWT

* **ID Kasus Uji**: `TC-CL-01`
* **Kebutuhan Terkait**: `FR-01, NFR-05`
* **Modul / Komponen**: `backend/src/modules/auth & frontend/src/views/auth`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Akun pengguna berstatus ACTIVE telah terdaftar pada database PostgreSQL dengan password terenkripsi bcrypt.

### 2. Langkah Pengujian (Test Steps)
1. Buka antarmuka login pada URL /login.
2. Masukkan alamat email valid (laboran@upnvj.ac.id) dan password yang benar.
3. Klik tombol "Masuk".

### 3. Hasil Pengujian
* **Expected Result**: Server merespons kode HTTP 200 OK, menghasilkan accessToken JWT berisi klaim peran, dan mengarahkan pengguna ke dasbor peran terkait.
* **Actual Result**: Sistem berhasil mengautentikasi pengguna, menerbitkan JWT token yang disimpan pada state auth, dan pengguna diarahkan ke dasbor laboran.
* **Catatan Teknis**: Token JWT terverifikasi memiliki masa berlaku 24 jam dengan algoritma HS256.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/auth/login
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_9912a7bf-811c-4b92",
      "full_name": "Staf Laboran Komputer FIK",
      "email": "laboran@upnvj.ac.id",
      "role": { "code": "LABORAN", "name": "Staf Laboran" },
      "status": "ACTIVE"
    }
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-02"></a>🧪 TC-CL-02: Pencegahan Akses Ilegal Antar Role (RBAC Security Guard)

* **ID Kasus Uji**: `TC-CL-02`
* **Kebutuhan Terkait**: `FR-01, NFR-05`
* **Modul / Komponen**: `backend/src/modules/auth/guards/roles.guard.ts`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Pengguna telah berhasil login sebagai akun dengan peran Dosen / Mahasiswa.

### 2. Langkah Pengujian (Test Steps)
1. Dalam keadaan login sebagai Dosen, akses langsung URL khusus administrator (/admin/users).
2. Kirim request REST API ke endpoint administratif: POST /api/users dengan Authorization Bearer token milik Dosen.

### 3. Hasil Pengujian
* **Expected Result**: Sistem menolak request dengan status HTTP 403 Forbidden dan menampilkan pesan penolakan hak akses.
* **Actual Result**: RolesGuard NestJS memblokir request dan mengembalikan response error 403 Forbidden.
* **Catatan Teknis**: Prinsip least-privilege RBAC berjalan dengan aman mencegah eskalasi hak akses ilegal.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/users (dengan token Dosen)
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource: User role 'DOSEN' does not have permission to access this endpoint"
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-03"></a>🧪 TC-CL-03: Validasi Deteksi Bentrok Jadwal Perkuliahan (Conflict Detection)

* **ID Kasus Uji**: `TC-CL-03`
* **Kebutuhan Terkait**: `FR-03`
* **Modul / Komponen**: `backend/src/modules/schedule/schedule.service.ts`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Laboratorium Komputasi A telah terjadwal untuk Matakuliah Algoritma Pemrograman pada hari Senin pukul 08:00 - 10:30 WIB.

### 2. Langkah Pengujian (Test Steps)
1. Masuk ke menu "Jadwal Perkuliahan" sebagai Admin/Laboran.
2. Tambah jadwal baru pada laboratorium yang sama (Lab Komputasi A) pada hari Senin.
3. Masukkan rentang waktu yang beririsan: 09:00 - 11:30 WIB.
4. Klik tombol "Simpan Jadwal".

### 3. Hasil Pengujian
* **Expected Result**: Sistem membatalkan transaksi penyimpanan dan menampilkan peringatan konflik jadwal dengan rincian matakuliah yang bertabrakan.
* **Actual Result**: Sistem melempar ConflictException (HTTP 409) dan jadwal yang bentrok berhasil dicegah dari database.
* **Catatan Teknis**: Algoritma pengecekan interval (newStart < existingEnd && newEnd > existingStart) berjalan presisi.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/schedules
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Schedule conflicts with existing schedule 'Algoritma Pemrograman' (08:00 - 10:30)"
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-04"></a>🧪 TC-CL-04: Pengajuan Peminjaman Lab dengan Berkas Lampiran Sah (PDF)

* **ID Kasus Uji**: `TC-CL-04`
* **Kebutuhan Terkait**: `FR-04`
* **Modul / Komponen**: `backend/src/modules/room-request & frontend/src/views/room-requests`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Dosen / Pemohon telah terautentikasi pada portal permohonan ruang.

### 2. Langkah Pengujian (Test Steps)
1. Buka form "Pengajuan Peminjaman Laboratorium".
2. Lengkapi formulir: nama kegiatan, tanggal peminjaman, jam mulai/selesai, jumlah peserta.
3. Lampirkan berkas permohonan resmi dalam format PDF (ukuran 2.4 MB).
4. Klik "Kirim Pengajuan".

### 3. Hasil Pengujian
* **Expected Result**: Permohonan tersimpan di basis data dengan status PENDING dan berkas lampiran tersimpan aman pada storage.
* **Actual Result**: Data permohonan berhasil terbit dengan ID unik dan berkas PDF tersimpan.
* **Catatan Teknis**: MIME-type application/pdf terverifikasi aman.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/room-requests
{
  "statusCode": 201,
  "message": "Room request created successfully",
  "data": {
    "id": "req_881a2f1c-9921-4d1a",
    "activity_name": "Workshop Artificial Intelligence",
    "status": "PENDING",
    "attachment_url": "/uploads/room-requests/proposal-ai-workshop.pdf",
    "file_size_bytes": 2516582
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-05"></a>🧪 TC-CL-05: Validasi Ukuran dan Tipe Ekstensi Berkas Unggahan (> 5MB / Ilegal)

* **ID Kasus Uji**: `TC-CL-05`
* **Kebutuhan Terkait**: `FR-04, NFR-05`
* **Modul / Komponen**: `backend/src/common/interceptors/file-upload.interceptor.ts`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Pengguna berada pada form pengajuan peminjaman laboratorium.

### 2. Langkah Pengujian (Test Steps)
1. Coba unggah berkas berekstensi ilegal (.exe / .sh) atau berkas dokumen berukuran 12 MB (> batas maksimal 5MB).
2. Klik tombol kirim form.

### 3. Hasil Pengujian
* **Expected Result**: Sistem memblokir proses unggah dan menampilkan pesan kesalahan validasi berkas.
* **Actual Result**: Sistem menolak request dan mengembalikan respon HTTP 400 Bad Request.
* **Catatan Teknis**: Batas kuota berkas 5MB dan whitelist ekstensi PDF/JPG/PNG ditegakkan pada layer middleware.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/room-requests/upload
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "File size exceeds the allowed limit of 5MB or invalid MIME-type"
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-06"></a>🧪 TC-CL-06: Alur Peninjauan & Persetujuan Permohonan Ruang (Approval Workflow)

* **ID Kasus Uji**: `TC-CL-06`
* **Kebutuhan Terkait**: `FR-05`
* **Modul / Komponen**: `backend/src/modules/room-request/room-request.service.ts`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Terdapat permohonan peminjaman dengan status PENDING pada antrian laboran.

### 2. Langkah Pengujian (Test Steps)
1. Staf laboran membuka menu "Tinjau Permohonan".
2. Periksa berkas lampiran proposal kegiatan.
3. Klik tombol "Setujui" (Approve).

### 3. Hasil Pengujian
* **Expected Result**: Status permohonan berubah menjadi APPROVED dan jadwal peminjaman otomatis disinkronkan ke kalender operasional lab.
* **Actual Result**: Status permohonan diperbarui menjadi APPROVED, catatan review tersimpan, dan slot waktu terkunci.
* **Catatan Teknis**: Slot waktu yang telah APPROVED otomatis memblokir permohonan lain pada jam yang sama.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: PATCH /api/room-requests/req_881a2f1c/review
{
  "statusCode": 200,
  "message": "Room request approved successfully",
  "data": {
    "id": "req_881a2f1c-9921-4d1a",
    "status": "APPROVED",
    "approved_by": "usr_9912a7bf",
    "approved_at": "2026-10-14T08:15:00.000Z"
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-07"></a>🧪 TC-CL-07: Pencatatan Sesi Check-In & Tracking Status Ruangan Real-Time

* **ID Kasus Uji**: `TC-CL-07`
* **Kebutuhan Terkait**: `FR-06, FR-09`
* **Modul / Komponen**: `backend/src/modules/room-usage/room-usage.service.ts`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Jadwal praktikum aktif terdaftar untuk jam berjalan.

### 2. Langkah Pengujian (Test Steps)
1. Laboran mengklik tombol "Mulai Sesi (Check-In)".
2. Amati perubahan status ruangan pada dasbor internal dan layar display TV.

### 3. Hasil Pengujian
* **Expected Result**: Status ruangan seketika berubah menjadi IN_USE, timestamp check-in riil tercatat, dan indikator TV Display berubah menjadi merah berdenyut.
* **Actual Result**: Sesi RoomUsage terbuat dengan status IN_USE, dan WebSocket broadcast terkirim ke layar display.
* **Catatan Teknis**: Sinkronisasi instan tanpa memerlukan refresh halaman.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/room-usage/check-in
{
  "statusCode": 201,
  "message": "Laboratory session checked in successfully",
  "data": {
    "usage_id": "usg_10294bce-391a-4f81",
    "laboratory_id": "lab_01",
    "status": "IN_USE",
    "check_in_time": "2026-10-14T08:00:12.451Z"
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-08"></a>🧪 TC-CL-08: Pelaporan Tiket Kendala Kerusakan Fasilitas Laboratorium (Ticketing)

* **ID Kasus Uji**: `TC-CL-08`
* **Kebutuhan Terkait**: `FR-07`
* **Modul / Komponen**: `backend/src/modules/issue-ticket & frontend/src/views/facilities`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Pengguna menemukan kendala unit perangkat keras di laboratorium.

### 2. Langkah Pengujian (Test Steps)
1. Akses menu "Lapor Kendala Fasilitas".
2. Pilih laboratorium, jenis perangkat (PC Client #14), dan tingkat urgensi (HIGH).
3. Lampirkan foto bukti monitor blue-screen dan isi deskripsi kendala.
4. Klik "Kirim Laporan".

### 3. Hasil Pengujian
* **Expected Result**: Nomor tiket otomatis terbit dengan format TKT-YYYYMMDD-XXX berstatus REPORTED dan masuk ke antrian perbaikan laboran.
* **Actual Result**: Tiket berhasil dibuat dan notifikasi kendala fasilitas muncul di dasbor laboran.
* **Catatan Teknis**: Kondisi unit PC Client #14 otomatis ditandai DAMAGED pada inventaris.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response API: POST /api/issue-tickets
{
  "statusCode": 201,
  "message": "Issue ticket created successfully",
  "data": {
    "ticket_number": "TKT-20261014-003",
    "urgency": "HIGH",
    "status": "REPORTED",
    "facility_name": "PC Client - Lab Komputasi A #14"
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-09"></a>🧪 TC-CL-09: Transmisi Pembaruan Data Layar Display TV Zero-Reload (< 500 ms)

* **ID Kasus Uji**: `TC-CL-09`
* **Kebutuhan Terkait**: `FR-09, NFR-02`
* **Modul / Komponen**: `backend/src/modules/display/events.gateway.ts (Socket.IO)`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Layar Smart TV Kiosk membuka URL /display, dan portal staf laboran dibuka pada PC terpisah.

### 2. Langkah Pengujian (Test Steps)
1. Staf laboran memperbarui status kondisi alat di portal admin (misal: 1 unit PC diperbaiki menjadi GOOD).
2. Ukur waktu latensi dari saat tombol simpan diklik hingga kartu persentase alat di layar TV Display terbarui otomatis.

### 3. Hasil Pengujian
* **Expected Result**: Tampilan layar TV Display langsung memperbarui persentase kesiapan alat secara instan dalam waktu latensi < 500 ms tanpa reload peramban.
* **Actual Result**: Event WebSocket "display:sync" diterima klien display dalam waktu 184 ms (< 500 ms) dan DOM ter-render seketika.
* **Catatan Teknis**: Benchmark transmisi WebSocket mencatat rata-rata 140–210 ms pada jaringan lokal kampus.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// WebSocket Event Broadcast: display:sync
{
  "event": "display:sync",
  "payload": {
    "type": "FACILITY_STATUS_UPDATED",
    "laboratory_id": "lab_01",
    "readiness_rate": 96.5,
    "timestamp": "2026-10-14T08:20:00.184Z"
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-10"></a>🧪 TC-CL-10: Interaktivitas Jendela Inspeksi Peralatan Laboratorium (Equipment Modal)

* **ID Kasus Uji**: `TC-CL-10`
* **Kebutuhan Terkait**: `FR-08`
* **Modul / Komponen**: `frontend/src/views/public/DisplayPage.vue`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Pengunjung / mahasiswa berada di depan layar Kiosk Display publik.

### 2. Langkah Pengujian (Test Steps)
1. Sentuh / klik badge indikator kelaikan alat pada salah satu kartu laboratorium.
2. Periksa modal rincian unit peralatan yang tampil.
3. Beralih tab inspeksi antar laboratorium.

### 3. Hasil Pengujian
* **Expected Result**: Jendela modal muncul secara halus menyajikan 4 metrik status (Total Unit, Kondisi Siap, Perawatan, Rusak) beserta daftar perangkat akurat.
* **Actual Result**: Modal inspeksi terbuka mulus, menyajikan data inventaris riil dari database PostgreSQL.
* **Catatan Teknis**: Kios display mendukung interaksi layar sentuh (touchscreen) maupun navigasi mouse.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Data State Komponen Modal Inspeksi
{
  "laboratory": "Laboratorium Sistem Terdistribusi",
  "summary": {
    "total_units": 40,
    "ready_good": 38,
    "maintenance": 1,
    "damaged": 1,
    "readiness_percent": 95.0
  }
}
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-11"></a>🧪 TC-CL-11: Penyaringan Histori & Ekspor Rekapitulasi Laporan ke Spreadsheet Excel

* **ID Kasus Uji**: `TC-CL-11`
* **Kebutuhan Terkait**: `FR-10`
* **Modul / Komponen**: `backend/src/modules/reports & frontend/src/views/reports`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Terdapat catatan histori peminjaman dan penggunaan ruang pada semester berjalan.

### 2. Langkah Pengujian (Test Steps)
1. Buka menu "Laporan & Rekapitulasi".
2. Pilih filter rentang tanggal (01 Oktober 2026 s/d 14 Oktober 2026) dan pilih seluruh laboratorium.
3. Klik tombol "Export Excel (.xlsx)".

### 3. Hasil Pengujian
* **Expected Result**: Sistem men-generate file spreadsheet Excel yang terunduh otomatis lengkap dengan kalkulasi jam penggunaan dan nama dosen pengajar.
* **Actual Result**: File Excel (.xlsx) berhasil di-generate oleh library ExcelJS dan terunduh dalam waktu 1.2 detik.
* **Catatan Teknis**: Format cell, border, dan formula akumulasi jam terformat rapi.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Response Header: GET /api/reports/export/excel
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Laporan_Penggunaan_Lab_Okt_2026.xlsx"
Status: 200 OK (Content-Length: 48920 bytes)
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

## <a id="tc-cl-12"></a>🧪 TC-CL-12: Ketahanan Operasional Kiosk 24/7 & Auto-Reconnect Gangguan Jaringan

* **ID Kasus Uji**: `TC-CL-12`
* **Kebutuhan Terkait**: `NFR-03, NFR-04`
* **Modul / Komponen**: `frontend/src/views/public/DisplayPage.vue (Socket.IO Client)`
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Tanggal Pelaksanaan**: 14 Oktober 2026

### 1. Prekondisi Basis Data
Layar Kiosk TV Display aktif dalam mode Fullscreen selama 24 jam.

### 2. Langkah Pengujian (Test Steps)
1. Lakukan simulasi pemutusan kabel jaringan LAN / Wi-Fi selama 30 detik.
2. Amati penanganan visual pada layar TV Display.
3. Hubungkan kembali koneksi jaringan.

### 3. Hasil Pengujian
* **Expected Result**: Saat offline: Layar tidak crash/blank dan menampilkan status "Reconnecting...". Saat online: WebSocket otomatis pulih dan data tersinkronisasi kembali.
* **Actual Result**: Klien berhasil mendeteksi disconnect event dan melakukan auto-reconnect berjenjang (exponential backoff) tanpa reload peramban.
* **Catatan Teknis**: Profiling memori browser menunjukkan penggunaan RAM stabil (delta < 15MB) setelah 24 jam pengujian daya tahan.

### 4. Bukti Eksekusi Teknis (Snippet)
```json
// Console Diagnostic Log: Kiosk Auto-Reconnect
[Socket.IO] Connection lost. Entering exponential backoff reconnect...
[Socket.IO] Reconnect attempt #1 after 1500ms...
[Socket.IO] Reconnect attempt #2 after 3000ms...
[Socket.IO] Reconnected successfully. Fetching latest state synchronization.
[Display] Sync completed. Zero DOM flicker.
```

[⬆️ Kembali ke Daftar Kasus Uji](#daftar-cepat-kasus-uji)

---

*Dokumen Terverifikasi Tim QA & Staf Laboratorium Komputer FIK UPNVJ — 14 Oktober 2026*
