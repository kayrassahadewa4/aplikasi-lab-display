import { PrismaClient } from '@prisma/client';

const facilities = [
  {
    code: 'FAC-PC',
    name: 'Komputer',
    category: 'Perangkat Keras',
    description: 'Komputer desktop lengkap dengan monitor, keyboard, dan mouse untuk kegiatan praktikum.',
  },
  {
    code: 'FAC-PRJ',
    name: 'Proyektor',
    category: 'Perangkat Presentasi',
    description: 'Proyektor LCD untuk presentasi dan penayangan materi perkuliahan.',
  },
  {
    code: 'FAC-AC',
    name: 'Pendingin Ruangan',
    category: 'Utilitas',
    description: 'Air conditioner (AC) untuk menjaga suhu ruangan laboratorium tetap nyaman.',
  },
  {
    code: 'FAC-WB',
    name: 'Papan Tulis',
    category: 'Perangkat Presentasi',
    description: 'Whiteboard untuk mendukung penyampaian materi dan diskusi.',
  },
  {
    code: 'FAC-PRT',
    name: 'Printer',
    category: 'Perangkat Keras',
    description: 'Printer untuk mencetak dokumen, laporan, dan hasil praktikum.',
  },
  {
    code: 'FAC-NET',
    name: 'Akses Internet',
    category: 'Infrastruktur',
    description: 'Koneksi internet kabel dan nirkabel untuk mendukung kegiatan praktikum dan riset.',
  },
];

export async function seedFacilities(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding facilities...');

  for (const facility of facilities) {
    await prisma.facility.upsert({
      where: { code: facility.code },
      update: {
        name: facility.name,
        category: facility.category,
        description: facility.description,
      },
      create: facility,
    });
  }

  console.log(`  ✔ ${facilities.length} facilities seeded.`);
}
