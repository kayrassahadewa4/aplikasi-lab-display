# 🧪 Bukti Pengujian: TC-CL-08
## Pelaporan Tiket Kendala Kerusakan Fasilitas Laboratorium (Ticketing)

* **ID Kasus Uji**: `TC-CL-08`
* **Kebutuhan Terkait**: `FR-07`
* **Modul / Komponen**: `backend/src/modules/issue-ticket & frontend/src/views/facilities`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Pengguna menemukan kendala unit perangkat keras di laboratorium.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Akses menu "Lapor Kendala Fasilitas".
2. Pilih laboratorium, jenis perangkat (PC Client #14), dan tingkat urgensi (HIGH).
3. Lampirkan foto bukti monitor blue-screen dan isi deskripsi kendala.
4. Klik "Kirim Laporan".

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Nomor tiket otomatis terbit dengan format TKT-YYYYMMDD-XXX berstatus REPORTED dan masuk ke antrian perbaikan laboran.
* **Hasil Aktual Sistem (Actual Result)**:  
  Tiket berhasil dibuat dan notifikasi kendala fasilitas muncul di dasbor laboran.
* **Catatan Pengujian**:  
  Kondisi unit PC Client #14 otomatis ditandai DAMAGED pada inventaris.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

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

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
