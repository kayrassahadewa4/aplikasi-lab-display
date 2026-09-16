import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding users...');

  // Get role IDs
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const laboranRole = await prisma.role.findUnique({ where: { code: 'LABORAN' } });
  const dosenRole = await prisma.role.findUnique({ where: { code: 'DOSEN' } });

  if (!adminRole || !laboranRole || !dosenRole) {
    throw new Error('Roles must be seeded before users');
  }

  // Hash password for development users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@lab.com',
      password: hashedPassword,
      full_name: 'Administrator',
      role_id: adminRole.id,
      status: 'ACTIVE' as const,
      phone: '+628123456789',
      keycloak_id: null,
    },
    {
      email: 'laboran@lab.com',
      password: hashedPassword,
      full_name: 'Laboratory Staff',
      role_id: laboranRole.id,
      status: 'ACTIVE' as const,
      phone: '+628123456790',
      keycloak_id: null,
    },
    {
      email: 'lecturer@lab.com',
      password: hashedPassword,
      full_name: 'Lecturer',
      role_id: dosenRole.id,
      status: 'ACTIVE' as const,
      phone: '+628123456791',
      keycloak_id: null,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        full_name: user.full_name,
        phone: user.phone,
        status: user.status,
      },
      create: user,
    });
  }

  console.log(`  ✔ ${users.length} users seeded.`);
}
