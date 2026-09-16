import { PrismaClient, LaboratoryStatus } from '@prisma/client';

const laboratories = [
  {
    code: 'LAB-A',
    name: 'Laboratorium Pemrograman',
    location: 'Gedung Teknik Informatika, Lantai 1, Ruang 101',
    maximum_capacity: 40,
    image: null,
    description: 'Laboratorium pemrograman yang dilengkapi dengan komputer dan perangkat pendukung untuk praktikum bahasa pemrograman, algoritma, dan struktur data.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-B',
    name: 'Laboratorium Jaringan Komputer',
    location: 'Gedung Teknik Informatika, Lantai 2, Ruang 201',
    maximum_capacity: 30,
    image: null,
    description: 'Laboratorium jaringan komputer yang dilengkapi dengan perangkat jaringan seperti router, switch, dan kabel UTP untuk praktikum jaringan dan administrasi sistem.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-C',
    name: 'Laboratorium Multimedia',
    location: 'Gedung Teknik Informatika, Lantai 2, Ruang 202',
    maximum_capacity: 35,
    image: null,
    description: 'Laboratorium multimedia yang dilengkapi dengan komputer berperforma tinggi untuk praktikum desain grafis, pengolahan citra, dan produksi konten digital.',
    status: LaboratoryStatus.AVAILABLE,
  },
];

export async function seedLaboratories(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding laboratories...');

  for (const lab of laboratories) {
    await prisma.laboratory.upsert({
      where: { code: lab.code },
      update: {
        name: lab.name,
        location: lab.location,
        maximum_capacity: lab.maximum_capacity,
        image: lab.image,
        description: lab.description,
        status: lab.status,
      },
      create: lab,
    });
  }

  console.log(`  ✔ ${laboratories.length} laboratories seeded.`);
}
