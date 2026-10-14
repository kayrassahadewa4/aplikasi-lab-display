# 🧪 Bukti Pengujian: TC-CL-11
## Penyaringan Histori & Ekspor Rekapitulasi Laporan ke Spreadsheet Excel

* **ID Kasus Uji**: `TC-CL-11`
* **Kebutuhan Terkait**: `FR-10`
* **Modul / Komponen**: `backend/src/modules/reports & frontend/src/views/reports`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Terdapat catatan histori peminjaman dan penggunaan ruang pada semester berjalan.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Buka menu "Laporan & Rekapitulasi".
2. Pilih filter rentang tanggal (01 Oktober 2026 s/d 14 Oktober 2026) dan pilih seluruh laboratorium.
3. Klik tombol "Export Excel (.xlsx)".

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Sistem men-generate file spreadsheet Excel yang terunduh otomatis lengkap dengan kalkulasi jam penggunaan dan nama dosen pengajar.
* **Hasil Aktual Sistem (Actual Result)**:  
  File Excel (.xlsx) berhasil di-generate oleh library ExcelJS dan terunduh dalam waktu 1.2 detik.
* **Catatan Pengujian**:  
  Format cell, border, dan formula akumulasi jam terformat rapi.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

```json
// Response Header: GET /api/reports/export/excel
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Laporan_Penggunaan_Lab_Okt_2026.xlsx"
Status: 200 OK (Content-Length: 48920 bytes)
```

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
