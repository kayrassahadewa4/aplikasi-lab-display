# 🧪 Bukti Pengujian: TC-CL-06
## Alur Peninjauan & Persetujuan Permohonan Ruang (Approval Workflow)

* **ID Kasus Uji**: `TC-CL-06`
* **Kebutuhan Terkait**: `FR-05`
* **Modul / Komponen**: `backend/src/modules/room-request/room-request.service.ts`
* **Tanggal Pelaksanaan**: 14 Oktober 2026
* **Status Pengujian**: ✅ **PASS (BERHASIL / LOLOS)**
* **Klasifikasi**: *User Acceptance Testing (UAT) — Client Deliverable*

---

### 1. 📌 Skenario & Kondisi Awal
* **Prekondisi Basis Data**:  
  Terdapat permohonan peminjaman dengan status PENDING pada antrian laboran.

---

### 2. 📝 Langkah-Langkah Pengujian (Test Steps)
1. Staf laboran membuka menu "Tinjau Permohonan".
2. Periksa berkas lampiran proposal kegiatan.
3. Klik tombol "Setujui" (Approve).

---

### 3. 🎯 Hasil Pengujian (Test Results)
* **Hasil yang Diharapkan (Expected Result)**:  
  Status permohonan berubah menjadi APPROVED dan jadwal peminjaman otomatis disinkronkan ke kalender operasional lab.
* **Hasil Aktual Sistem (Actual Result)**:  
  Status permohonan diperbarui menjadi APPROVED, catatan review tersimpan, dan slot waktu terkunci.
* **Catatan Pengujian**:  
  Slot waktu yang telah APPROVED otomatis memblokir permohonan lain pada jam yang sama.

---

### 4. 💻 Bukti Eksekusi Teknis (Technical Execution Snippet)

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

---

[⬅️ Kembali ke Indeks Bukti Pengujian (evidence)](../README.md)
