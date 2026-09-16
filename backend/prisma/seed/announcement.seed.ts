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
      title: 'Mid-Term Lab Practical Examinations Scheduled',
      content: 'Laboratories A and B will be dedicated to Computer Science practicum exams from 08:00 to 17:00. Please ensure all preparation is completed.',
      start_at: now,
      end_at: future1,
      is_active: true,
    },
    {
      title: 'Network Lab Server Maintenance Notice',
      content: 'Scheduled maintenance on core switch infrastructure this Saturday. Temporary connectivity disruptions may occur in LAB-JAR.',
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
