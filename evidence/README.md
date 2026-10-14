# 📁 Repositori Bukti Pengujian Sistem (Test Evidence Index)
**Sistem Monitoring Jadwal & Ketersediaan Peralatan Laboratorium Komputer Real-Time**  
*Fakultas Ilmu Komputer — UPN "Veteran" Jakarta*

---

Halaman ini merupakan indeks daring resmi untuk memverifikasi keabsahan hasil pengujian **User Acceptance Testing (UAT)** yang tercantum pada dokumen:
📄 **Dokumen Requirements Traceability Matrix (RTM) & Skenario Pengujian Fitur Sistem (Client Deliverable)**.

Seluruh 12 kasus uji fungsional dan operasional telah diverifikasi secara menyeluruh dengan status **PASS** (100% Lolos).

---

## 📑 Daftar Indeks Tautan Bukti Pengujian

| No | ID Kasus Uji | Skenario Pengujian | Kebutuhan Terkait | Status Hasil | Tautan Bukti Lengkap |
| :-: | :--- | :--- | :---: | :---: | :---: |
| **1** | `TC-CL-01` | Login Akun Sah (Admin / Laboran) dengan Autentikasi JWT | FR-01, NFR-05 | **PASS** | [Buka Dokumentasi TC-CL-01](./TC-CL-01/README.md) |
| **2** | `TC-CL-02` | Pencegahan Akses Ilegal Antar Role (RBAC Security Guard) | FR-01, NFR-05 | **PASS** | [Buka Dokumentasi TC-CL-02](./TC-CL-02/README.md) |
| **3** | `TC-CL-03` | Validasi Deteksi Bentrok Jadwal Perkuliahan (Conflict Detection) | FR-03 | **PASS** | [Buka Dokumentasi TC-CL-03](./TC-CL-03/README.md) |
| **4** | `TC-CL-04` | Pengajuan Peminjaman Lab dengan Berkas Lampiran Sah (PDF) | FR-04 | **PASS** | [Buka Dokumentasi TC-CL-04](./TC-CL-04/README.md) |
| **5** | `TC-CL-05` | Validasi Ukuran dan Tipe Ekstensi Berkas Unggahan (> 5MB / Ilegal) | FR-04, NFR-05 | **PASS** | [Buka Dokumentasi TC-CL-05](./TC-CL-05/README.md) |
| **6** | `TC-CL-06` | Alur Peninjauan & Persetujuan Permohonan Ruang (Approval Workflow) | FR-05 | **PASS** | [Buka Dokumentasi TC-CL-06](./TC-CL-06/README.md) |
| **7** | `TC-CL-07` | Pencatatan Sesi Check-In & Tracking Status Ruangan Real-Time | FR-06, FR-09 | **PASS** | [Buka Dokumentasi TC-CL-07](./TC-CL-07/README.md) |
| **8** | `TC-CL-08` | Pelaporan Tiket Kendala Kerusakan Fasilitas Laboratorium (Ticketing) | FR-07 | **PASS** | [Buka Dokumentasi TC-CL-08](./TC-CL-08/README.md) |
| **9** | `TC-CL-09` | Transmisi Pembaruan Data Layar Display TV Zero-Reload (< 500 ms) | FR-09, NFR-02 | **PASS** | [Buka Dokumentasi TC-CL-09](./TC-CL-09/README.md) |
| **10** | `TC-CL-10` | Interaktivitas Jendela Inspeksi Peralatan Laboratorium (Equipment Modal) | FR-08 | **PASS** | [Buka Dokumentasi TC-CL-10](./TC-CL-10/README.md) |
| **11** | `TC-CL-11` | Penyaringan Histori & Ekspor Rekapitulasi Laporan ke Spreadsheet Excel | FR-10 | **PASS** | [Buka Dokumentasi TC-CL-11](./TC-CL-11/README.md) |
| **12** | `TC-CL-12` | Ketahanan Operasional Kiosk 24/7 & Auto-Reconnect Gangguan Jaringan | NFR-03, NFR-04 | **PASS** | [Buka Dokumentasi TC-CL-12](./TC-CL-12/README.md) |

---
*Dokumen Terverifikasi Tim QA & Staf Laboratorium Komputer FIK UPNVJ — 14 Oktober 2026*
