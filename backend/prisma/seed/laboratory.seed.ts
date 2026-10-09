import { PrismaClient, LaboratoryStatus } from '@prisma/client';

const laboratories = [
  {
    code: 'LAB-01',
    name: 'Lab Rekayasa Perangkat Lunak',
    location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 101',
    maximum_capacity: 40,
    image: null,
    description: 'Laboratorium pemrograman dan rekayasa perangkat lunak untuk praktikum Web, Mobile, dan Agile Software Development.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-02',
    name: 'Lab Jaringan & Cyber Security',
    location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 102',
    maximum_capacity: 35,
    image: null,
    description: 'Laboratorium jaringan komputer dan keamanan siber dengan router, switch Cisco, dan simulator pengujian penetrasi keamanan.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-03',
    name: 'Lab Multimedia & Game Dev',
    location: 'Gedung Ki Hajar Dewantara, Lantai 2, Ruang 201',
    maximum_capacity: 35,
    image: null,
    description: 'Laboratorium multimedia dan pengembangan game dengan workstation grafis tinggi untuk 3D modeling, rendering, dan game engine.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-04',
    name: 'Lab Kecerdasan Buatan & Data',
    location: 'Gedung Ki Hajar Dewantara, Lantai 2, Ruang 202',
    maximum_capacity: 40,
    image: null,
    description: 'Laboratorium riset kecerdasan buatan, data science, machine learning, neural networks, dan komputasi performa tinggi.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-05',
    name: 'Lab Sistem Informasi & Database',
    location: 'Gedung Ki Hajar Dewantara, Lantai 3, Ruang 301',
    maximum_capacity: 35,
    image: null,
    description: 'Laboratorium analisis sistem informasi, manajemen basis data relasional/NoSQL, dan arsitektur data perusahaan.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-06',
    name: 'Lab Komputasi Awan & IoT',
    location: 'Gedung Ki Hajar Dewantara, Lantai 3, Ruang 302',
    maximum_capacity: 30,
    image: null,
    description: 'Laboratorium cloud computing, internet of things, sensor networks, dan integrasi mikrokontroler.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-07',
    name: 'Lab Algoritma & Pemrograman',
    location: 'Gedung Ki Hajar Dewantara, Lantai 4, Ruang 401',
    maximum_capacity: 40,
    image: null,
    description: 'Laboratorium dasar algoritma, pemrograman berorientasi objek, dan struktur data untuk tingkat sarjana dan diploma.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-08',
    name: 'Lab Hardware & Robotika',
    location: 'Gedung Ki Hajar Dewantara, Lantai 4, Ruang 402',
    maximum_capacity: 30,
    image: null,
    description: 'Laboratorium perakitan komputer, arsitektur sistem perangkat keras, otomasi cerdas, dan sistem robotika.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-A',
    name: 'Laboratorium Pemrograman',
    location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 101',
    maximum_capacity: 40,
    image: null,
    description: 'Laboratorium pemrograman dasar dan pengujian perangkat lunak.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-B',
    name: 'Laboratorium Jaringan Komputer',
    location: 'Gedung Ki Hajar Dewantara, Lantai 1, Ruang 102',
    maximum_capacity: 30,
    image: null,
    description: 'Laboratorium jaringan dan infrastruktur komunikasi data.',
    status: LaboratoryStatus.AVAILABLE,
  },
  {
    code: 'LAB-C',
    name: 'Laboratorium Multimedia',
    location: 'Gedung Ki Hajar Dewantara, Lantai 2, Ruang 201',
    maximum_capacity: 35,
    image: null,
    description: 'Laboratorium desain grafis, editing video, dan animasi digital.',
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
