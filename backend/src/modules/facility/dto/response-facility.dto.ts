import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FacilityCondition } from '@prisma/client';

class LaboratoryInfo {
  @ApiProperty({
    description: 'Laboratory ID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  id: string;

  @ApiProperty({
    description: 'Laboratory code',
    example: 'LAB-001',
  })
  code: string;

  @ApiProperty({
    description: 'Laboratory name',
    example: 'Computer Laboratory 1',
  })
  name: string;
}

class LaboratoryFacilityInfo {
  @ApiProperty({
    description: 'Laboratory facility ID',
    example: '990e8400-e29b-41d4-a716-446655440004',
  })
  id: string;

  @ApiProperty({
    description: 'Laboratory ID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  laboratory_id: string;

  @ApiProperty({
    description: 'Facility ID',
    example: 'aa0e8400-e29b-41d4-a716-446655440005',
  })
  facility_id: string;

  @ApiProperty({
    description: 'Quantity',
    example: 5,
  })
  quantity: number;

  @ApiProperty({
    description: 'Facility condition',
    enum: FacilityCondition,
    example: FacilityCondition.GOOD,
  })
  condition: FacilityCondition;

  @ApiProperty({
    description: 'Laboratory information',
    type: LaboratoryInfo,
  })
  laboratory: LaboratoryInfo;
}

export class ResponseFacilityDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'aa0e8400-e29b-41d4-a716-446655440005',
  })
  id: string;

  @ApiProperty({
    description: 'Unique facility code',
    example: 'FAC-001',
  })
  code: string;

  @ApiProperty({
    description: 'Facility name',
    example: 'Projector',
  })
  name: string;

  @ApiProperty({
    description: 'Facility category',
    example: 'Electronics',
  })
  category: string;

  @ApiPropertyOptional({
    description: 'Facility description',
    example: 'HD multimedia projector for presentations',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Laboratory facilities',
    type: [LaboratoryFacilityInfo],
    isArray: true,
  })
  laboratoryFacilities: LaboratoryFacilityInfo[];
}
