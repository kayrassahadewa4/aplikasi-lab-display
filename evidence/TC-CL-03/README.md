# 🧪 Bukti Pengujian: TC-CL-03
## Validasi Deteksi Bentrok Jadwal Perkuliahan (Conflict Detection)

* **ID Kasus Uji**: `TC-CL-03`
* **Kebutuhan Terkait**: `FR-03`
* **Modul / Komponen**: `backend/src/modules/schedule/schedule.service.ts`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Laboratorium Komputasi A telah terjadwal untuk Matakuliah Algoritma Pemrograman pada hari Senin pukul 08:00 - 10:30 WIB.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Masuk ke menu "Jadwal Perkuliahan" sebagai Admin/Laboran.
2. Tambah jadwal baru pada laboratorium yang sama (Lab Komputasi A) pada hari Senin.
3. Masukkan rentang waktu yang beririsan: 09:00 - 11:30 WIB.
4. Klik tombol "Simpan Jadwal".

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Sistem membatalkan transaksi penyimpanan dan menampilkan peringatan konflik jadwal dengan rincian matakuliah yang bertabrakan.
* **Hasil Aktual Sistem (Actual Result)**:  
  Sistem melempar ConflictException (HTTP 409) dan jadwal yang bentrok berhasil dicegah dari database.
* **Catatan Pengujian**:  
  Algoritma pengecekan interval (newStart < existingEnd && newEnd > existingStart) berjalan presisi.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

```json
// Response API: POST /api/schedules
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Schedule conflicts with existing schedule 'Algoritma Pemrograman' (08:00 - 10:30)"
}
```

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
