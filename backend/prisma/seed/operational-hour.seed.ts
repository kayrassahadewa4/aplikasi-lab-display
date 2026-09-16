import { PrismaClient } from '@prisma/client';

interface OperationalHourEntry {
  laboratoryCode: string;
  day_of_week: number;
  open_time: Date;
  close_time: Date;
}

function timeOnly(hours: number, minutes: number): Date {
  return new Date(`1970-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`);
}

const laboratoryCodes = ['LAB-A', 'LAB-B', 'LAB-C'];

function buildOperationalHours(): OperationalHourEntry[] {
  const entries: OperationalHourEntry[] = [];

  for (const code of laboratoryCodes) {
    // Monday (1) to Friday (5): 08:00 – 17:00
    for (let day = 1; day <= 5; day++) {
      entries.push({
        laboratoryCode: code,
        day_of_week: day,
        open_time: timeOnly(8, 0),
        close_time: timeOnly(17, 0),
      });
    }

    // Saturday (6): 08:00 – 12:00
    entries.push({
      laboratoryCode: code,
      day_of_week: 6,
      open_time: timeOnly(8, 0),
      close_time: timeOnly(12, 0),
    });

    // Sunday (7): omitted
  }

  return entries;
}

export async function seedOperationalHours(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding operational hours...');

  const entries = buildOperationalHours();
  let count = 0;

  for (const entry of entries) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { code: entry.laboratoryCode },
    });

    if (!laboratory) {
      console.warn(`  ⚠ Laboratory ${entry.laboratoryCode} not found. Skipping.`);
      continue;
    }

    const existing = await prisma.operationalHour.findUnique({
      where: {
        laboratory_id_day_of_week: {
          laboratory_id: laboratory.id,
          day_of_week: entry.day_of_week,
        },
      },
    });

    if (existing) {
      await prisma.operationalHour.update({
        where: { id: existing.id },
        data: {
          open_time: entry.open_time,
          close_time: entry.close_time,
        },
      });
    } else {
      await prisma.operationalHour.create({
        data: {
          laboratory_id: laboratory.id,
          day_of_week: entry.day_of_week,
          open_time: entry.open_time,
          close_time: entry.close_time,
        },
      });
    }

    count++;
  }

  console.log(`  ✔ ${count} operational hours seeded.`);
}
