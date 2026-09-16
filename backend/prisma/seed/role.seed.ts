import { PrismaClient } from '@prisma/client';

const roles = [
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'System administrator with full access to all features and settings.',
  },
  {
    code: 'LABORAN',
    name: 'Laboran',
    description: 'Laboratory staff responsible for managing lab operations and facilities.',
  },
  {
    code: 'DOSEN',
    name: 'Dosen',
    description: 'Lecturer who can request and use laboratory rooms for academic activities.',
  },
];

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding roles...');

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    });
  }

  console.log(`  ✔ ${roles.length} roles seeded.`);
}
