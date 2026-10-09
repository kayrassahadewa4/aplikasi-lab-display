import { PrismaClient, FacilityCondition } from '@prisma/client';

interface LaboratoryFacilityAssignment {
  laboratoryCode: string;
  facilityCode: string;
  quantity: number;
  condition: FacilityCondition;
}

const assignments: LaboratoryFacilityAssignment[] = [
  // LAB-01 — Lab Rekayasa Perangkat Lunak
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-PC', quantity: 40, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-WB', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-PRT', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-01', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-02 — Lab Jaringan & Cyber Security
  { laboratoryCode: 'LAB-02', facilityCode: 'FAC-PC', quantity: 35, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-02', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-02', facilityCode: 'FAC-AC', quantity: 3, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-02', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-02', facilityCode: 'FAC-NET', quantity: 2, condition: FacilityCondition.GOOD },

  // LAB-03 — Lab Multimedia & Game Dev
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-PC', quantity: 35, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-PRT', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-03', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-04 — Lab Kecerdasan Buatan & Data
  { laboratoryCode: 'LAB-04', facilityCode: 'FAC-PC', quantity: 40, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-04', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-04', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-04', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-04', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-05 — Lab Sistem Informasi & Database
  { laboratoryCode: 'LAB-05', facilityCode: 'FAC-PC', quantity: 35, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-05', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-05', facilityCode: 'FAC-AC', quantity: 3, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-05', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-05', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-06 — Lab Komputasi Awan & IoT
  { laboratoryCode: 'LAB-06', facilityCode: 'FAC-PC', quantity: 30, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-06', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-06', facilityCode: 'FAC-AC', quantity: 3, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-06', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-06', facilityCode: 'FAC-NET', quantity: 2, condition: FacilityCondition.GOOD },

  // LAB-07 — Lab Algoritma & Pemrograman
  { laboratoryCode: 'LAB-07', facilityCode: 'FAC-PC', quantity: 40, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-07', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-07', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-07', facilityCode: 'FAC-WB', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-07', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-08 — Lab Hardware & Robotika
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-PC', quantity: 30, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-AC', quantity: 3, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-PRT', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-08', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // Legacy LAB-A, LAB-B, LAB-C
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-PC', quantity: 40, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-PC', quantity: 30, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-PC', quantity: 35, condition: FacilityCondition.GOOD },
];

export async function seedLaboratoryFacilities(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding laboratory facilities...');

  let count = 0;

  for (const assignment of assignments) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { code: assignment.laboratoryCode },
    });

    const facility = await prisma.facility.findUnique({
      where: { code: assignment.facilityCode },
    });

    if (!laboratory) {
      console.warn(`  ⚠ Laboratory ${assignment.laboratoryCode} not found. Skipping.`);
      continue;
    }

    if (!facility) {
      console.warn(`  ⚠ Facility ${assignment.facilityCode} not found. Skipping.`);
      continue;
    }

    const existing = await prisma.laboratoryFacility.findUnique({
      where: {
        laboratory_id_facility_id: {
          laboratory_id: laboratory.id,
          facility_id: facility.id,
        },
      },
    });

    if (existing) {
      await prisma.laboratoryFacility.update({
        where: { id: existing.id },
        data: {
          quantity: assignment.quantity,
          condition: assignment.condition,
        },
      });
    } else {
      await prisma.laboratoryFacility.create({
        data: {
          laboratory_id: laboratory.id,
          facility_id: facility.id,
          quantity: assignment.quantity,
          condition: assignment.condition,
        },
      });
    }

    count++;
  }

  console.log(`  ✔ ${count} laboratory-facility assignments seeded.`);
}
