import { PrismaClient, RequestStatus, UsageStatus } from '@prisma/client';

export async function seedRoomRequests(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding room requests and 2-week usage history...');

  // 1. Get lecturer / laboran / admin users
  const lecturer = await prisma.user.findFirst({
    where: { role: { name: 'DOSEN' } }
  }) || await prisma.user.findFirst();

  const laboran = await prisma.user.findFirst({
    where: { role: { name: 'LABORAN' } }
  }) || lecturer;

  if (!lecturer || !laboran) {
    console.warn('  ⚠ Required users not found. Skipping room request seeding.');
    return;
  }

  // 2. Get laboratories
  const labs = await prisma.laboratory.findMany({
    orderBy: { code: 'asc' }
  });

  if (labs.length === 0) {
    console.warn('  ⚠ No laboratories found. Skipping.');
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Helper date generators for past 14 days and upcoming days
  const getDateOffset = (offsetDays: number): { date: Date, dateStr: string } => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return { date: d, dateStr: d.toISOString().slice(0, 10) };
  };

  const timeOnly = (h: number, m: number) => {
    return new Date(`1970-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
  };

  // Clear existing room requests & usages to avoid duplicates in seed
  await prisma.laboratoryStatusHistory.deleteMany();
  await prisma.roomUsage.deleteMany();
  await prisma.roomRequest.deleteMany();

  const requestTemplates = [
    // --- TODAY REQUESTS ---
    {
      labCode: 'LAB-01',
      activityName: 'Sesi Tambahan Belajar Mandiri Web Programming',
      courseName: 'Pemrograman Web Lanjut',
      className: 'IF-A',
      offsetDays: 0,
      startH: 14, startM: 0,
      endH: 16, endM: 30,
      count: 32,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_IN, // Live Active Now!
    },
    {
      labCode: 'LAB-03',
      activityName: 'Workshop Editing Animasi & Motion Graphics',
      courseName: 'Desain Komunikasi Visual',
      className: 'DKV-2',
      offsetDays: 0,
      startH: 10, startM: 0,
      endH: 12, endM: 30,
      count: 28,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-06',
      activityName: 'Praktikum Pengganti IoT Smart Sensor',
      courseName: 'Sistem Embedded',
      className: 'TI-3',
      offsetDays: 0,
      startH: 15, startM: 30,
      endH: 17, endM: 30,
      count: 25,
      status: RequestStatus.APPROVED,
      usageStatus: null, // Upcoming later today
    },

    // --- PAST 3 DAYS ---
    {
      labCode: 'LAB-02',
      activityName: 'Simulasi Pengujian Penetrasi Keamanan Server',
      courseName: 'Cyber Security',
      className: 'SI-A',
      offsetDays: -1,
      startH: 9, startM: 0,
      endH: 12, endM: 0,
      count: 30,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-04',
      activityName: 'Hands-on Big Data Spark Cluster',
      courseName: 'Big Data Architecture',
      className: 'DS-B',
      offsetDays: -2,
      startH: 13, startM: 0,
      endH: 16, endM: 0,
      count: 35,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-07',
      activityName: 'Pelatihan Algoritma Pemrograman Kompetitif',
      courseName: 'Competitive Programming',
      className: 'IF-TALENT',
      offsetDays: -3,
      startH: 14, startM: 0,
      endH: 17, endM: 0,
      count: 25,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },

    // --- PAST 2 WEEKS LOGS (FOR COMPREHENSIVE REPORTS) ---
    {
      labCode: 'LAB-05',
      activityName: 'Ujian Tengah Semester Praktikum Basis Data',
      courseName: 'Sistem Manajemen Basis Data',
      className: 'SI-B',
      offsetDays: -5,
      startH: 8, startM: 0,
      endH: 11, endM: 0,
      count: 35,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-01',
      activityName: 'Sertifikasi Kompetensi Software Development',
      courseName: 'Sertifikasi BNSP',
      className: 'SERTIF-1',
      offsetDays: -7,
      startH: 8, startM: 30,
      endH: 14, endM: 0,
      count: 40,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-08',
      activityName: 'Uji Coba Lengan Robotik & Sensor PLC',
      courseName: 'Robotika Industri',
      className: 'ROB-A',
      offsetDays: -9,
      startH: 13, startM: 0,
      endH: 16, endM: 0,
      count: 20,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-03',
      activityName: 'Render Farm Batch Praktikum Animasi 3D',
      courseName: 'Animasi 3D',
      className: 'DKV-3',
      offsetDays: -11,
      startH: 9, startM: 0,
      endH: 13, endM: 0,
      count: 30,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },
    {
      labCode: 'LAB-02',
      activityName: 'Konfigurasi Jaringan Laboratorium Komputer',
      courseName: 'Jaringan Komputer',
      className: 'TI-A',
      offsetDays: -13,
      startH: 8, startM: 0,
      endH: 11, endM: 30,
      count: 30,
      status: RequestStatus.APPROVED,
      usageStatus: UsageStatus.CHECKED_OUT,
    },

    // --- UPCOMING REQUESTS (NEXT WEEK) ---
    {
      labCode: 'LAB-04',
      activityName: 'Kuliah Tamu Industri AI & LLM Engineering',
      courseName: 'Kecerdasan Buatan',
      className: 'DS-ALL',
      offsetDays: 3,
      startH: 9, startM: 0,
      endH: 12, endM: 0,
      count: 40,
      status: RequestStatus.APPROVED,
      usageStatus: null,
    },
    {
      labCode: 'LAB-01',
      activityName: 'Workshop Flutter Mobile App UI',
      courseName: 'Mobile Programming',
      className: 'IF-MOB',
      offsetDays: 5,
      startH: 13, startM: 0,
      endH: 16, endM: 0,
      count: 35,
      status: RequestStatus.APPROVED,
      usageStatus: null,
    },
  ];

  let reqCount = 0;
  let usageCount = 0;

  for (const t of requestTemplates) {
    const lab = labs.find(l => l.code === t.labCode) || labs[0];
    const { date } = getDateOffset(t.offsetDays);

    const req = await prisma.roomRequest.create({
      data: {
        applicant_id: lecturer.id,
        laboratory_id: lab.id,
        approved_by: laboran.id,
        activity_name: t.activityName,
        course_name: t.courseName,
        class_name: t.className,
        description: `Permohonan resmi penggunaan ${lab.name} untuk ${t.activityName}.`,
        request_date: date,
        start_time: timeOnly(t.startH, t.startM),
        end_time: timeOnly(t.endH, t.endM),
        participant_count: t.count,
        status: t.status,
        approved_at: date,
      }
    });
    reqCount++;

    if (t.usageStatus) {
      const checkInDateTime = new Date(date);
      checkInDateTime.setHours(t.startH, t.startM, 0, 0);

      const checkOutDateTime = new Date(date);
      checkOutDateTime.setHours(t.endH, t.endM, 0, 0);

      await prisma.roomUsage.create({
        data: {
          request_id: req.id,
          checked_in_by: laboran.id,
          checked_out_by: t.usageStatus === UsageStatus.CHECKED_OUT ? laboran.id : null,
          check_in_time: checkInDateTime,
          check_out_time: t.usageStatus === UsageStatus.CHECKED_OUT ? checkOutDateTime : null,
          status: t.usageStatus,
          notes: `Log operasional peminjaman laboratorium ${lab.name}.`,
        }
      });
      usageCount++;
    }
  }

  console.log(`  ✔ ${reqCount} room requests and ${usageCount} usage logs seeded.`);
}
