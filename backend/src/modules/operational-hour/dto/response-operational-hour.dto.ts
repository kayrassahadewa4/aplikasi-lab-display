import { ApiProperty } from '@nestjs/swagger';

class LaboratoryInfoDto {
  @ApiProperty({
    description: 'Laboratory ID',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  id: string;

  @ApiProperty({
    description: 'Laboratory code',
    example: 'LAB-001',
  })
  code: string;

  @ApiProperty({
    description: 'Laboratory name',
    example: 'Computer Laboratory A',
  })
  name: string;
}

export class ResponseOperationalHourDto {
  @ApiProperty({
    description: 'Operational hour ID',
    example: 'dd0e8400-e29b-41d4-a716-446655440008',
  })
  id: string;

  @ApiProperty({
    description: 'Laboratory ID',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  laboratory_id: string;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)',
    example: 1,
  })
  day_of_week: number;

  @ApiProperty({
    description: 'Opening time',
    example: '1970-01-01T08:00:00.000Z',
  })
  open_time: Date;

  @ApiProperty({
    description: 'Closing time',
    example: '1970-01-01T17:00:00.000Z',
  })
  close_time: Date;

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
    description: 'Laboratory information',
    type: LaboratoryInfoDto,
    required: false,
  })
  laboratory?: LaboratoryInfoDto;
}
