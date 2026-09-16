import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LaboratoryStatus } from '@prisma/client';

export class ResponseLaboratoryDto {
  @ApiProperty({
    description: 'Laboratory ID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  id: string;

  @ApiProperty({
    description: 'Unique laboratory code',
    example: 'LAB-001',
  })
  code: string;

  @ApiProperty({
    description: 'Laboratory name',
    example: 'Computer Laboratory 1',
  })
  name: string;

  @ApiProperty({
    description: 'Laboratory location',
    example: 'Building A, Floor 2',
  })
  location: string;

  @ApiProperty({
    description: 'Maximum capacity',
    example: 40,
  })
  maximum_capacity: number;

  @ApiPropertyOptional({
    description: 'Laboratory image URL or path',
    example: '/images/lab-001.jpg',
    nullable: true,
  })
  image: string | null;

  @ApiPropertyOptional({
    description: 'Laboratory description',
    example: 'A modern computer laboratory equipped with 40 workstations',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Laboratory status',
    enum: LaboratoryStatus,
    example: LaboratoryStatus.AVAILABLE,
  })
  status: LaboratoryStatus;

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
}
