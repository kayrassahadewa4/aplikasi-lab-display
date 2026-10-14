# 🧪 Bukti Pengujian: TC-CL-10
## Interaktivitas Jendela Inspeksi Peralatan Laboratorium (Equipment Modal)

* **ID Kasus Uji**: `TC-CL-10`
* **Kebutuhan Terkait**: `FR-08`
* **Modul / Komponen**: `frontend/src/views/public/DisplayPage.vue`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Pengunjung / mahasiswa berada di depan layar Kiosk Display publik.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Sentuh / klik badge indikator kelaikan alat pada salah satu kartu laboratorium.
2. Periksa modal rincian unit peralatan yang tampil.
3. Beralih tab inspeksi antar laboratorium.

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Jendela modal muncul secara halus menyajikan 4 metrik status (Total Unit, Kondisi Siap, Perawatan, Rusak) beserta daftar perangkat akurat.
* **Hasil Aktual Sistem (Actual Result)**:  
  Modal inspeksi terbuka mulus, menyajikan data inventaris riil dari database PostgreSQL.
* **Catatan Pengujian**:  
  Kios display mendukung interaksi layar sentuh (touchscreen) maupun navigasi mouse.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

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

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
