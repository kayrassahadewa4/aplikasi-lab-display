import { ApiProperty } from '@nestjs/swagger';
import { CalendarStatus } from '@prisma/client';

export class ResponseAcademicCalendarDto {
  @ApiProperty({
    description: 'Academic calendar ID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  id: string;

  @ApiProperty({
    description: 'Academic year',
    example: '2024/2025',
  })
  academic_year: string;

  @ApiProperty({
    description: 'Semester',
    example: 'Ganjil',
  })
  semester: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-09-01',
  })
  start_date: Date;

  @ApiProperty({
    description: 'End date',
    example: '2025-01-31',
  })
  end_date: Date;

  @ApiProperty({
    description: 'Calendar status',
    enum: CalendarStatus,
    example: CalendarStatus.ACTIVE,
  })
  status: CalendarStatus;

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
