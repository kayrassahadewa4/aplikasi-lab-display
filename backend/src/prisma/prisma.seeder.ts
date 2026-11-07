import { PrismaClient, LaboratoryStatus, CalendarStatus, ScheduleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function ensureSchema(prisma: PrismaClient): Promise<void> {
  try {
    // 1. Ensure avatar_url column exists on User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar_url" VARCHAR(255);
    `);

    // 2. Ensure document_url column exists on RoomRequest table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RoomRequest" ADD COLUMN IF NOT EXISTS "document_url" VARCHAR(255);
    `);

    // 3. Ensure custom Enums exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ResetRequestStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "IssueStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE_PREVENTIVE', 'CORRECTIVE_REPAIR', 'COMPONENT_UPGRADE', 'REPLACEMENT');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 4. Ensure tables exist if migrations were partially applied
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
        "id" UUID NOT NULL PRIMARY KEY,
        "user_id" UUID NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "full_name" VARCHAR(100) NOT NULL,
        "role_code" VARCHAR(20) NOT NULL,
        "notes" TEXT,
        "status" "ResetRequestStatus" NOT NULL DEFAULT 'PENDING',
        "resolved_by_id" UUID,
        "temp_password" VARCHAR(255),
        "resolved_at" TIMESTAMP(6),
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Message" (
        "id" UUID NOT NULL PRIMARY KEY,
        "sender_id" UUID NOT NULL,
        "recipient_id" UUID,
        "subject" VARCHAR(200) NOT NULL,
        "body" TEXT NOT NULL,
        "attachment_url" VARCHAR(255),
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "folder" VARCHAR(20) NOT NULL DEFAULT 'inbox',
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" UUID NOT NULL PRIMARY KEY,
        "user_id" UUID NOT NULL,
        "title" VARCHAR(150) NOT NULL,
        "message" TEXT NOT NULL,
        "category" VARCHAR(30) NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "link_url" VARCHAR(255),
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "FacilityIssueTicket" (
        "id" UUID NOT NULL PRIMARY KEY,
        "ticket_number" VARCHAR(30) NOT NULL,
        "laboratory_id" UUID NOT NULL,
        "facility_id" UUID,
        "reported_by_id" UUID NOT NULL,
        "handled_by_id" UUID,
        "title" VARCHAR(150) NOT NULL,
        "description" TEXT NOT NULL,
        "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
        "status" "IssueStatus" NOT NULL DEFAULT 'REPORTED',
        "image_url" VARCHAR(255),
        "resolution_notes" TEXT,
        "resolved_at" TIMESTAMP(6),
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "FacilityMaintenanceLog" (
        "id" UUID NOT NULL PRIMARY KEY,
        "laboratory_id" UUID NOT NULL,
        "facility_id" UUID NOT NULL,
        "performed_by_id" UUID NOT NULL,
        "issue_ticket_id" UUID,
        "maintenance_type" "MaintenanceType" NOT NULL DEFAULT 'ROUTINE_PREVENTIVE',
        "title" VARCHAR(150) NOT NULL,
        "action_taken" TEXT NOT NULL,
        "previous_condition" "FacilityCondition",
        "resulting_condition" "FacilityCondition" NOT NULL DEFAULT 'GOOD',
        "cost" DECIMAL(12,2),
        "vendor" VARCHAR(100),
        "attachment_url" VARCHAR(255),
        "maintenance_date" DATE NOT NULL,
        "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✔ PostgreSQL Schema Sync completed.');
  } catch (err: any) {
    console.warn('Schema sync warning (non-fatal):', err.message);
  }
}

export async function seedAll(prisma: PrismaClient, force = false): Promise<{ success: boolean; message: string }> {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0 && !force) {
      console.log(`Database already has ${existingUsers} users. Skipping auto-seed.`);
      return { success: true, message: `Database already seeded (${existingUsers} users).` };
    }

    console.log('🌱 Starting full automated database seed...');

    // 1. Roles
    const roles = [
      { code: 'ADMIN', name: 'Administrator', description: 'System administrator with full access to all features and settings.' },
      { code: 'LABORAN', name: 'Laboran', description: 'Laboratory staff responsible for managing lab operations and facilities.' },
      { code: 'DOSEN', name: 'Dosen', description: 'Lecturer who can request and use laboratory rooms for academic activities.' },
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { code: r.code },
        update: { name: r.name, description: r.description },
        create: r,
      });
    }

    const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    const laboranRole = await prisma.role.findUnique({ where: { code: 'LABORAN' } });
    const dosenRole = await prisma.role.findUnique({ where: { code: 'DOSEN' } });

    if (!adminRole || !laboranRole || !dosenRole) {
      throw new Error('Roles could not be resolved.');
    }

    // 2. Users (Hashed password: password123)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      { email: 'admin@lab.com', full_name: 'Administrator Lab FIK', role_id: adminRole.id },
      { email: 'admin@upnvj.ac.id', full_name: 'Administrator TU Lab UPNVJ', role_id: adminRole.id },
      { email: 'laboran@lab.com', full_name: 'Staf Laboran FIK UPNVJ', role_id: laboranRole.id },
      { email: 'laboran@upnvj.ac.id', full_name: 'Kepala Laboran FIK', role_id: laboranRole.id },
      { email: 'lecturer@lab.com', full_name: 'Dosen Pengampu FIK UPNVJ', role_id: dosenRole.id },
      { email: 'dosen@lab.com', full_name: 'Dosen Pengampu FIK UPNVJ', role_id: dosenRole.id },
      { email: 'dosen@upnvj.ac.id', full_name: 'Dosen FIK UPNVJ', role_id: dosenRole.id },
    ];

    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          full_name: u.full_name,
          role_id: u.role_id,
          password: hashedPassword,
          status: 'ACTIVE',
        },
        create: {
          email: u.email,
          full_name: u.full_name,
          role_id: u.role_id,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });
    }

    // 3. Academic Calendar
    let calendar = await prisma.academicCalendar.findFirst({
      where: { academic_year: '2026/2027', semester: 'Ganjil' },
    });
    if (!calendar) {
      calendar = await prisma.academicCalendar.create({
        data: {
          academic_year: '2026/2027',
          semester: 'Ganjil',
          start_date: new Date('2026-09-01'),
          end_date: new Date('2027-02-28'),
          status: CalendarStatus.ACTIVE,
        },
      });
    }

    // 4. Laboratories
    const laboratories = [
      {
        code: 'LAB-01',
        name: 'Lab Rekayasa Perangkat Lunak',
        location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 101',
        maximum_capacity: 40,
        description: 'Laboratorium pemrograman dan rekayasa perangkat lunak untuk praktikum Web, Mobile, dan Agile Software Development.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-02',
        name: 'Lab Jaringan & Cyber Security',
        location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 102',
        maximum_capacity: 35,
        description: 'Laboratorium jaringan komputer dan keamanan siber dengan router, switch Cisco, dan simulator pengujian penetrasi keamanan.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-03',
        name: 'Lab Multimedia & Game Dev',
        location: 'Gedung Ki Hajar Dewantara, Lantai 2, Ruang 201',
        maximum_capacity: 35,
        description: 'Laboratorium multimedia dan pengembangan game dengan workstation grafis tinggi untuk 3D modeling, rendering, dan game engine.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-04',
        name: 'Lab Kecerdasan Buatan & Data',
        location: 'Gedung Ki Hajar Dewantara, Lantai 2, Ruang 202',
        maximum_capacity: 40,
        description: 'Laboratorium riset kecerdasan buatan, data science, machine learning, neural networks, dan komputasi performa tinggi.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-05',
        name: 'Lab Sistem Informasi & Database',
        location: 'Gedung Ki Hajar Dewantara, Lantai 3, Ruang 301',
        maximum_capacity: 35,
        description: 'Laboratorium analisis sistem informasi, manajemen basis data relasional/NoSQL, dan arsitektur data perusahaan.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-06',
        name: 'Lab Komputasi Awan & IoT',
        location: 'Gedung Ki Hajar Dewantara, Lantai 3, Ruang 302',
        maximum_capacity: 30,
        description: 'Laboratorium cloud computing, internet of things, sensor networks, dan integrasi mikrokontroler.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-07',
        name: 'Lab Algoritma & Pemrograman',
        location: 'Gedung Ki Hajar Dewantara, Lantai 4, Ruang 401',
        maximum_capacity: 40,
        description: 'Laboratorium dasar algoritma, pemrograman berorientasi objek, dan struktur data untuk tingkat sarjana dan diploma.',
        status: LaboratoryStatus.AVAILABLE,
      },
      {
        code: 'LAB-08',
        name: 'Lab Hardware & Robotika',
        location: 'Gedung Ki Hajar Dewantara, Lantai 4, Ruang 402',
        maximum_capacity: 30,
        description: 'Laboratorium perakitan komputer, arsitektur sistem perangkat keras, otomasi cerdas, dan sistem robotika.',
        status: LaboratoryStatus.AVAILABLE,
      },
    ];

    for (const lab of laboratories) {
      await prisma.laboratory.upsert({
        where: { code: lab.code },
        update: {
          name: lab.name,
          location: lab.location,
          maximum_capacity: lab.maximum_capacity,
          description: lab.description,
          status: lab.status,
        },
        create: lab,
      });
    }

    // 5. Operational Hours
    function timeOnly(hours: number, minutes: number): Date {
      return new Date(`1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);
    }

    const labRecords = await prisma.laboratory.findMany();
    for (const lab of labRecords) {
      for (let day = 1; day <= 5; day++) {
        await prisma.operationalHour.upsert({
          where: {
            laboratory_id_day_of_week: {
              laboratory_id: lab.id,
              day_of_week: day,
            },
          },
          update: {
            open_time: timeOnly(8, 0),
            close_time: timeOnly(17, 0),
          },
          create: {
            laboratory_id: lab.id,
            day_of_week: day,
            open_time: timeOnly(8, 0),
            close_time: timeOnly(17, 0),
          },
        });
      }
      await prisma.operationalHour.upsert({
        where: {
          laboratory_id_day_of_week: {
            laboratory_id: lab.id,
            day_of_week: 6,
          },
        },
        update: {
          open_time: timeOnly(8, 0),
          close_time: timeOnly(12, 0),
        },
        create: {
          laboratory_id: lab.id,
          day_of_week: 6,
          open_time: timeOnly(8, 0),
          close_time: timeOnly(12, 0),
        },
      });
    }

    // 6. Announcements
    const now = new Date();
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const existingAnnouncements = await prisma.announcement.count();
    if (existingAnnouncements === 0) {
      await prisma.announcement.createMany({
        data: [
          {
            title: 'Jadwal Praktikum Semester Ganjil 2026/2027 Aktif',
            content: 'Seluruh laboratorium FIK UPN "Veteran" Jakarta beroperasi normal sesuai jadwal semester ganjil. Dosen dan mahasiswa diharapkan melakukan check-in tepat waktu.',
            start_at: now,
            end_at: future,
            is_active: true,
          },
          {
            title: 'Pembaruan Fasilitas Workstation Lab AI & Multimedia',
            content: 'Telah dilakukan instalasi pustaka Deep Learning dan GPU Driver terbaru di Lab 03 dan Lab 04 untuk mendukung praktikum Machine Learning & Grafika Komputer.',
            start_at: now,
            end_at: future,
            is_active: true,
          },
        ],
      });
    }

    // 7. Sample Schedules
    const lab1 = labRecords.find((l) => l.code === 'LAB-01');
    const lab2 = labRecords.find((l) => l.code === 'LAB-02');
    const lab3 = labRecords.find((l) => l.code === 'LAB-03');
    const lab4 = labRecords.find((l) => l.code === 'LAB-04');

    const existingSchedules = await prisma.schedule.count();
    if (existingSchedules === 0 && calendar) {
      const scheduleEntries = [
        { lab: lab1, course: 'Pemrograman Web Lanjut', lecturer: 'Dr. Bambang Triatmaja, M.Kom.', className: 'IF-5A', day: 1, start: '08:00:00', end: '10:30:00' },
        { lab: lab1, course: 'Rekayasa Perangkat Lunak', lecturer: 'Ahmad Fauzi, S.Kom., M.T.', className: 'IF-5B', day: 1, start: '10:45:00', end: '13:15:00' },
        { lab: lab2, course: 'Keamanan Jaringan & Cyber Security', lecturer: 'Ir. Hendra Gunawan, M.Sc.', className: 'TI-5A', day: 1, start: '08:30:00', end: '11:00:00' },
        { lab: lab3, course: 'Desain Grafis & Pemodelan 3D', lecturer: 'Feriega Pratama, M.Ds.', className: 'DKV-3A', day: 1, start: '13:00:00', end: '15:30:00' },
        { lab: lab4, course: 'Machine Learning & Big Data', lecturer: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-4A', day: 2, start: '09:00:00', end: '11:30:00' },
        { lab: lab1, course: 'Pengembangan Aplikasi Mobile', lecturer: 'Nurul Hidayah, M.Kom.', className: 'IF-5C', day: 2, start: '13:30:00', end: '16:00:00' },
        { lab: lab2, course: 'Routing & Switching Enterprise', lecturer: 'Dimas Prasetyo, M.Kom.', className: 'TI-3B', day: 3, start: '08:00:00', end: '10:30:00' },
        { lab: lab4, course: 'Pengantar Artificial Intelligence', lecturer: 'Prof. Siti Rahmah, Ph.D.', className: 'DS-2A', day: 4, start: '10:00:00', end: '12:30:00' },
        { lab: lab1, course: 'Struktur Data & Algoritma', lecturer: 'Haryanto, S.Kom., M.Cs.', className: 'IF-2B', day: 5, start: '08:00:00', end: '10:30:00' },
      ];

      for (const s of scheduleEntries) {
        if (!s.lab) continue;
        await prisma.schedule.create({
          data: {
            laboratory_id: s.lab.id,
            academic_calendar_id: calendar.id,
            course_name: s.course,
            lecturer_name: s.lecturer,
            class_name: s.className,
            day_of_week: s.day,
            start_time: new Date(`1970-01-01T${s.start}.000Z`),
            end_time: new Date(`1970-01-01T${s.end}.000Z`),
            status: ScheduleStatus.SCHEDULED,
          },
        });
      }
    }

    console.log('✅ Automated seeding finished successfully!');
    return {
      success: true,
      message: 'Database seeded successfully with default roles, users, laboratories, and schedules.',
    };
  } catch (error: any) {
    console.error('❌ Database automated seeding error:', error);
    return {
      success: false,
      message: `Database seeding failed: ${error.message}`,
    };
  }
}
