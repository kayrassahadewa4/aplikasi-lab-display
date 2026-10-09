import { PrismaClient, ScheduleStatus } from '@prisma/client';

interface ScheduleSeedEntry {
  labCode: string;
  courseName: string;
  lecturerName: string;
  className: string;
  dayOfWeek: number;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
}

const schedulesData: ScheduleSeedEntry[] = [
  // ============================================================
  // SENIN (day_of_week: 1)
  // ============================================================
  { labCode: 'LAB-01', courseName: 'Algoritma & Pemrograman Dasar', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-1A', dayOfWeek: 1, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-01', courseName: 'Pemrograman Berorientasi Objek', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-3A', dayOfWeek: 1, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-01', courseName: 'Praktikum Web Dasar', lecturerName: 'Nurul Hidayah, M.Kom.', className: 'SI-1B', dayOfWeek: 1, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-02', courseName: 'Pengantar Jaringan Komputer', lecturerName: 'Dimas Prasetyo, M.Kom.', className: 'TI-1A', dayOfWeek: 1, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-02', courseName: 'Routing & Switching Lanjut', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'TI-3B', dayOfWeek: 1, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-03', courseName: 'Desain Grafis Komputer', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-1A', dayOfWeek: 1, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-03', courseName: 'Animasi & Modeling 3D', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-3A', dayOfWeek: 1, startTime: '10:10:00', endTime: '12:35:00' },

  { labCode: 'LAB-04', courseName: 'Pengantar Data Science', lecturerName: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-1A', dayOfWeek: 1, startTime: '09:15:00', endTime: '11:55:00' },
  { labCode: 'LAB-04', courseName: 'Statistika Komputasi', lecturerName: 'Arya Nugraha, M.Kom.', className: 'DS-2A', dayOfWeek: 1, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-05', courseName: 'Basis Data Relasional', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-2A', dayOfWeek: 1, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-05', courseName: 'Administrasi Database SQL Server', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-4A', dayOfWeek: 1, startTime: '10:10:00', endTime: '12:35:00' },

  { labCode: 'LAB-06', courseName: 'Pengantar Cloud Computing', lecturerName: 'Fajar Ramadhan, M.T.', className: 'TI-2B', dayOfWeek: 1, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-07', courseName: 'Struktur Data & Implementasi', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-2B', dayOfWeek: 1, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-08', courseName: 'Rangkaian Logika Digital', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-1A', dayOfWeek: 1, startTime: '13:25:00', endTime: '16:10:00' },

  // ============================================================
  // SELASA (day_of_week: 2)
  // ============================================================
  { labCode: 'LAB-01', courseName: 'Pemrograman Web Lanjut', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-5A', dayOfWeek: 2, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-01', courseName: 'Rekayasa Perangkat Lunak', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-5B', dayOfWeek: 2, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-01', courseName: 'Pengembangan Aplikasi Mobile', lecturerName: 'Nurul Hidayah, M.Kom.', className: 'IF-5C', dayOfWeek: 2, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-02', courseName: 'Keamanan Jaringan & Ethical Hacking', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'SI-5A', dayOfWeek: 2, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-02', courseName: 'Administrasi Jaringan & Linux', lecturerName: 'Dimas Prasetyo, M.Kom.', className: 'TI-3A', dayOfWeek: 2, startTime: '13:00:00', endTime: '15:35:00' },

  { labCode: 'LAB-03', courseName: 'Pengembangan Game 2D', lecturerName: 'Yogi Wicaksono, M.Kom.', className: 'IF-4A', dayOfWeek: 2, startTime: '09:15:00', endTime: '11:55:00' },
  { labCode: 'LAB-04', courseName: 'Machine Learning Terapan', lecturerName: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-4A', dayOfWeek: 2, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-05', courseName: 'Data Warehousing & OLAP', lecturerName: 'Arya Nugraha, M.Kom.', className: 'SI-5B', dayOfWeek: 2, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-06', courseName: 'Sistem Embedded & IoT', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'TI-4A', dayOfWeek: 2, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-07', courseName: 'Desain Analisis Algoritma', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-4B', dayOfWeek: 2, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-08', courseName: 'Mikrokontroler Arduino & ESP32', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-3A', dayOfWeek: 2, startTime: '10:10:00', endTime: '12:35:00' },

  // ============================================================
  // RABU (day_of_week: 3)
  // ============================================================
  { labCode: 'LAB-01', courseName: 'Pemrograman Web Lanjut', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-A', dayOfWeek: 3, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-01', courseName: 'Rekayasa Perangkat Lunak', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-B', dayOfWeek: 3, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-01', courseName: 'Mobile App Development', lecturerName: 'Nurul Hidayah, M.Kom.', className: 'IF-C', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-02', courseName: 'Keamanan Jaringan & Ethical Hacking', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'SI-A', dayOfWeek: 3, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-02', courseName: 'Administrasi Jaringan & Linux', lecturerName: 'Dimas Prasetyo, M.Kom.', className: 'TI-A', dayOfWeek: 3, startTime: '12:30:00', endTime: '15:10:00' },
  { labCode: 'LAB-02', courseName: 'Forensik Digital', lecturerName: 'Dr. Irwan Setiawan, M.T.', className: 'SI-C', dayOfWeek: 3, startTime: '15:20:00', endTime: '17:05:00' },

  { labCode: 'LAB-03', courseName: 'Desain Komunikasi Visual & 3D', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-1', dayOfWeek: 3, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-03', courseName: 'Pengembangan Game 2D/3D', lecturerName: 'Yogi Wicaksono, M.Kom.', className: 'IF-G', dayOfWeek: 3, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-03', courseName: 'Audio & Video Editing', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-2', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-04', courseName: 'Machine Learning & Neural Networks', lecturerName: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-A', dayOfWeek: 3, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-04', courseName: 'Data Mining & Warehousing', lecturerName: 'Arya Nugraha, M.Kom.', className: 'DS-B', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-05', courseName: 'Sistem Manajemen Basis Data', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-B', dayOfWeek: 3, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-05', courseName: 'NoSQL & Big Data Architecture', lecturerName: 'Arya Nugraha, M.Kom.', className: 'SI-E', dayOfWeek: 3, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-05', courseName: 'Enterprise Database Administration', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-F', dayOfWeek: 3, startTime: '14:20:00', endTime: '17:05:00' },

  { labCode: 'LAB-06', courseName: 'Arsitektur Komputasi Awan (AWS)', lecturerName: 'Fajar Ramadhan, M.T.', className: 'TI-B', dayOfWeek: 3, startTime: '09:15:00', endTime: '11:55:00' },
  { labCode: 'LAB-06', courseName: 'Sistem Tertanam & Sensor IoT', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'TI-C', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-07', courseName: 'Struktur Data & Algoritma', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-D', dayOfWeek: 3, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-07', courseName: 'Desain & Analisis Algoritma', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-F', dayOfWeek: 3, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-07', courseName: 'Pemrograman Berorientasi Objek', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-H', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-08', courseName: 'Robotika & Sistem Kendali Cerdas', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-A', dayOfWeek: 3, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-08', courseName: 'Mikrokontroler & Interface', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-B', dayOfWeek: 3, startTime: '13:25:00', endTime: '16:10:00' },

  // ============================================================
  // KAMIS (day_of_week: 4)
  // ============================================================
  { labCode: 'LAB-01', courseName: 'Frontend Framework & Vue.js', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-4A', dayOfWeek: 4, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-01', courseName: 'Backend Development & API', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-4B', dayOfWeek: 4, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-01', courseName: 'Software Testing & QA', lecturerName: 'Nurul Hidayah, M.Kom.', className: 'IF-6A', dayOfWeek: 4, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-02', courseName: 'Kriptografi & Keamanan Informasi', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'SI-4A', dayOfWeek: 4, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-02', courseName: 'Network Automation & DevOps', lecturerName: 'Dimas Prasetyo, M.Kom.', className: 'TI-4B', dayOfWeek: 4, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-03', courseName: 'Teknik Produksi Film & Animasi', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-4A', dayOfWeek: 4, startTime: '09:15:00', endTime: '11:55:00' },
  { labCode: 'LAB-03', courseName: 'UI/UX Design Studio', lecturerName: 'Yogi Wicaksono, M.Kom.', className: 'IF-3C', dayOfWeek: 4, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-04', courseName: 'Deep Learning & Pengolahan Citra', lecturerName: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-6A', dayOfWeek: 4, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-04', courseName: 'Pemrosesan Bahasa Alami (NLP)', lecturerName: 'Arya Nugraha, M.Kom.', className: 'DS-6B', dayOfWeek: 4, startTime: '13:25:00', endTime: '16:10:00' },

  { labCode: 'LAB-05', courseName: 'Sistem Informasi Manajemen', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-3A', dayOfWeek: 4, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-06', courseName: 'Cloud Security & Governance', lecturerName: 'Fajar Ramadhan, M.T.', className: 'TI-6A', dayOfWeek: 4, startTime: '10:10:00', endTime: '12:35:00' },
  { labCode: 'LAB-07', courseName: 'Pemrograman Lanjut (C++/Java)', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-2A', dayOfWeek: 4, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-08', courseName: 'Robotik Industri & Mekatronika', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-4A', dayOfWeek: 4, startTime: '13:25:00', endTime: '16:10:00' },

  // ============================================================
  // JUMAT (day_of_week: 5) -- HARI UTAMA CLIENT MEMBUKA DISPLAY!
  // ============================================================
  // Sesi Pagi (07:30 - 11:00)
  { labCode: 'LAB-01', courseName: 'Arsitektur Perangkat Lunak', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-6B', dayOfWeek: 5, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-02', courseName: 'Cyber Incident Response', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'SI-6A', dayOfWeek: 5, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-03', courseName: 'Audio Visual & Post-Production', lecturerName: 'Feriega Pratama, M.Ds.', className: 'DKV-2B', dayOfWeek: 5, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-04', courseName: 'Data Visualization & BI', lecturerName: 'Arya Nugraha, M.Kom.', className: 'DS-4B', dayOfWeek: 5, startTime: '08:20:00', endTime: '11:00:00' },
  { labCode: 'LAB-05', courseName: 'Basis Data Terdistribusi', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-4B', dayOfWeek: 5, startTime: '07:30:00', endTime: '10:05:00' },
  { labCode: 'LAB-07', courseName: 'Algoritma Paralel & GPU', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-6C', dayOfWeek: 5, startTime: '08:20:00', endTime: '11:00:00' },

  // Sesi Siang - Sore (13:00 - 16:30+) -- AKTIF SAAT JAM 14:00 - 15:30!
  { labCode: 'LAB-01', courseName: 'Praktikum Cloud Native & DevOps', lecturerName: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-6D', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-02', courseName: 'Penetration Testing & Red Teaming', lecturerName: 'Dimas Prasetyo, M.Kom.', className: 'TI-6B', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-03', courseName: 'Game Engine Architecture (Unity)', lecturerName: 'Yogi Wicaksono, M.Kom.', className: 'IF-6E', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-04', courseName: 'Big Data Processing with Spark', lecturerName: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-6C', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-05', courseName: 'Business Intelligence Project', lecturerName: 'Dra. Endang Sulistyo, M.Si.', className: 'SI-6C', dayOfWeek: 5, startTime: '14:20:00', endTime: '17:05:00' },
  { labCode: 'LAB-06', courseName: 'IoT Smart Campus Laboratory', lecturerName: 'Fajar Ramadhan, M.T.', className: 'TI-6C', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },
  { labCode: 'LAB-07', courseName: 'Competitive Programming Clinic', lecturerName: 'Haryanto, S.Kom., M.Cs.', className: 'IF-TALENT', dayOfWeek: 5, startTime: '14:20:00', endTime: '17:05:00' },
  { labCode: 'LAB-08', courseName: 'Robot Otonom & Sensor Lidar', lecturerName: 'Dr. Wahyu Triyono, M.T.', className: 'ROB-6A', dayOfWeek: 5, startTime: '13:25:00', endTime: '16:10:00' },

  // ============================================================
  // SABTU (day_of_week: 6) -- KELAS EKSEKUTIF / SERTIFIKASI
  // ============================================================
  { labCode: 'LAB-01', courseName: 'Workshop Sertifikasi BNSP Programmer', lecturerName: 'Dr. Bambang Triatmaja, M.Kom.', className: 'SERTIF-1', dayOfWeek: 6, startTime: '08:20:00', endTime: '12:35:00' },
  { labCode: 'LAB-02', courseName: 'Sertifikasi Cisco CCNA Preparation', lecturerName: 'Ir. Hendra Gunawan, M.Sc.', className: 'CCNA-1', dayOfWeek: 6, startTime: '08:20:00', endTime: '12:35:00' },
  { labCode: 'LAB-04', courseName: 'Bootcamp Data Science & AI', lecturerName: 'Arya Nugraha, M.Kom.', className: 'AI-BOOTCAMP', dayOfWeek: 6, startTime: '09:15:00', endTime: '13:20:00' },
  { labCode: 'LAB-06', courseName: 'Pelatihan Cloud Practitioner AWS', lecturerName: 'Fajar Ramadhan, M.T.', className: 'AWS-CERT', dayOfWeek: 6, startTime: '08:20:00', endTime: '12:35:00' },
];

export async function seedSchedules(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding course schedules...');

  const cal = await prisma.academicCalendar.findFirst();
  if (!cal) {
    console.warn('  ⚠ No academic calendar found. Skipping schedule seeding.');
    return;
  }

  const labs = await prisma.laboratory.findMany({
    select: { id: true, code: true }
  });

  // Clear existing schedules to have consistent demo data
  await prisma.schedule.deleteMany();

  let count = 0;
  for (const s of schedulesData) {
    const lab = labs.find((l) => l.code === s.labCode);
    if (!lab) continue;

    await prisma.schedule.create({
      data: {
        laboratory_id: lab.id,
        academic_calendar_id: cal.id,
        course_name: s.courseName,
        lecturer_name: s.lecturerName,
        class_name: s.className,
        day_of_week: s.dayOfWeek,
        start_time: new Date(`1970-01-01T${s.startTime}.000Z`),
        end_time: new Date(`1970-01-01T${s.endTime}.000Z`),
        status: ScheduleStatus.ACTIVE,
      },
    });
    count++;
  }

  console.log(`  ✔ ${count} schedules across all days seeded.`);
}
