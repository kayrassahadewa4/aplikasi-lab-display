# 🧪 Bukti Pengujian: TC-CL-05
## Validasi Ukuran dan Tipe Ekstensi Berkas Unggahan (> 5MB / Ilegal)

* **ID Kasus Uji**: `TC-CL-05`
* **Kebutuhan Terkait**: `FR-04, NFR-05`
* **Modul / Komponen**: `backend/src/common/interceptors/file-upload.interceptor.ts`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Pengguna berada pada form pengajuan peminjaman laboratorium.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Coba unggah berkas berekstensi ilegal (.exe / .sh) atau berkas dokumen berukuran 12 MB (> batas maksimal 5MB).
2. Klik tombol kirim form.

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Sistem memblokir proses unggah dan menampilkan pesan kesalahan validasi berkas.
* **Hasil Aktual Sistem (Actual Result)**:  
  Sistem menolak request dan mengembalikan respon HTTP 400 Bad Request.
* **Catatan Pengujian**:  
  Batas kuota berkas 5MB dan whitelist ekstensi PDF/JPG/PNG ditegakkan pada layer middleware.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

```json
// Response API: POST /api/room-requests/upload
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "File size exceeds the allowed limit of 5MB or invalid MIME-type"
}
```

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
