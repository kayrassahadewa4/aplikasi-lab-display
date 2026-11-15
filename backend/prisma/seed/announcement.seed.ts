import type { PrismaClient } from '@prisma/client';

export async function seedAnnouncements(prisma: PrismaClient): Promise<void> {
  console.log('Seeding announcements...');

  const count = await prisma.announcement.count();
  if (count > 0) {
    console.log(`Announcements already seeded (${count} records). Skipping.`);
    return;
  }

  const now = new Date();
  const future1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const future2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const sampleAnnouncements = [
    {
      title: 'Jadwal Ujian Praktikum Laboratorium FIK',
      content: 'Laboratorium Rekayasa Perangkat Lunak dan Jaringan dialokasikan untuk pelaksanaan ujian praktikum mulai pukul 08:00 hingga 17:00 WIB. Seluruh mahasiswa diimbau mematuhi tata tertib laboratorium.',
      start_at: now,
      end_at: future1,
      is_active: true,
    },
    {
      title: 'Pemberitahuan Pemeliharaan Jaringan Laboratorium',
      content: 'Pemeliharaan berkala infrastruktur switch dan server laboratorium dilaksanakan pada akhir pekan ini. Penggunaan ruang laboratorium dapat dikoordinasikan terlebih dahulu dengan staf laboran.',
      start_at: now,
      end_at: future2,
      is_active: true,
    },
  ];

  for (const anc of sampleAnnouncements) {
    await prisma.announcement.create({
      data: anc,
    });
  }

  console.log(`Created ${sampleAnnouncements.length} sample announcements.`);
}
