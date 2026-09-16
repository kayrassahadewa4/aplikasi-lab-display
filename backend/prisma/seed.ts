import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { seedRoles } from './seed/role.seed.js';
import { seedUsers } from './seed/user.seed.js';
import { seedAcademicCalendars } from './seed/academic-calendar.seed.js';
import { seedLaboratories } from './seed/laboratory.seed.js';
import { seedFacilities } from './seed/facility.seed.js';
import { seedLaboratoryFacilities } from './seed/laboratory-facility.seed.js';
import { seedOperationalHours } from './seed/operational-hour.seed.js';
import { seedAnnouncements } from './seed/announcement.seed.js';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  await seedRoles(prisma);
  await seedUsers(prisma);
  await seedAcademicCalendars(prisma);
  await seedLaboratories(prisma);
  await seedFacilities(prisma);
  await seedLaboratoryFacilities(prisma);
  await seedOperationalHours(prisma);
  await seedAnnouncements(prisma);

  console.log('\n✅ Database seeding completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
