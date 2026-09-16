import { PrismaClient, FacilityCondition } from '@prisma/client';

interface LaboratoryFacilityAssignment {
  laboratoryCode: string;
  facilityCode: string;
  quantity: number;
  condition: FacilityCondition;
}

const assignments: LaboratoryFacilityAssignment[] = [
  // LAB-A — Laboratorium Pemrograman
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-PC', quantity: 40, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-WB', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-PRT', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-A', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-B — Laboratorium Jaringan Komputer
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-PC', quantity: 30, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-PRJ', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-AC', quantity: 3, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-B', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },

  // LAB-C — Laboratorium Multimedia
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-PC', quantity: 35, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-PRJ', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-AC', quantity: 4, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-WB', quantity: 1, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-PRT', quantity: 2, condition: FacilityCondition.GOOD },
  { laboratoryCode: 'LAB-C', facilityCode: 'FAC-NET', quantity: 1, condition: FacilityCondition.GOOD },
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
