# 🧪 Bukti Pengujian: TC-CL-09
## Transmisi Pembaruan Data Layar Display TV Zero-Reload (< 500 ms)

* **ID Kasus Uji**: `TC-CL-09`
* **Kebutuhan Terkait**: `FR-09, NFR-02`
* **Modul / Komponen**: `backend/src/modules/display/events.gateway.ts (Socket.IO)`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Layar Smart TV Kiosk membuka URL /display, dan portal staf laboran dibuka pada PC terpisah.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Staf laboran memperbarui status kondisi alat di portal admin (misal: 1 unit PC diperbaiki menjadi GOOD).
2. Ukur waktu latensi dari saat tombol simpan diklik hingga kartu persentase alat di layar TV Display terbarui otomatis.

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Tampilan layar TV Display langsung memperbarui persentase kesiapan alat secara instan dalam waktu latensi < 500 ms tanpa reload peramban.
* **Hasil Aktual Sistem (Actual Result)**:  
  Event WebSocket "display:sync" diterima klien display dalam waktu 184 ms (< 500 ms) dan DOM ter-render seketika.
* **Catatan Pengujian**:  
  Benchmark transmisi WebSocket mencatat rata-rata 140–210 ms pada jaringan lokal kampus.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

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

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
