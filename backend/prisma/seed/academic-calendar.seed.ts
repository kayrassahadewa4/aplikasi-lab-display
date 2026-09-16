import { PrismaClient, CalendarStatus } from '@prisma/client';

const academicCalendars = [
  {
    academic_year: '2026/2027',
    semester: 'Ganjil',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2027-02-28'),
    status: CalendarStatus.ACTIVE,
  },
];

export async function seedAcademicCalendars(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding academic calendars...');

  for (const calendar of academicCalendars) {
    const existing = await prisma.academicCalendar.findFirst({
      where: {
        academic_year: calendar.academic_year,
        semester: calendar.semester,
      },
    });

    if (existing) {
      await prisma.academicCalendar.update({
        where: { id: existing.id },
        data: {
          start_date: calendar.start_date,
          end_date: calendar.end_date,
          status: calendar.status,
        },
      });
    } else {
      await prisma.academicCalendar.create({ data: calendar });
    }
  }

  console.log(`  ✔ ${academicCalendars.length} academic calendars seeded.`);
}
