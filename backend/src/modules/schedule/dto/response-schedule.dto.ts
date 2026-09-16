import { ApiProperty } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma/client';

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

class AcademicCalendarInfoDto {
  @ApiProperty({
    description: 'Academic Calendar ID',
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
}

export class ResponseScheduleDto {
  @ApiProperty({
    description: 'Schedule ID',
    example: 'ff0e8400-e29b-41d4-a716-446655440010',
  })
  id: string;

  @ApiProperty({
    description: 'Laboratory ID',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  laboratory_id: string;

  @ApiProperty({
    description: 'Academic Calendar ID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  academic_calendar_id: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Data Structures and Algorithms',
  })
  course_name: string;

  @ApiProperty({
    description: 'Lecturer name',
    example: 'Dr. John Doe',
  })
  lecturer_name: string;

  @ApiProperty({
    description: 'Class name',
    example: 'CS-A1',
  })
  class_name: string;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)',
    example: 1,
  })
  day_of_week: number;

  @ApiProperty({
    description: 'Start time',
    example: '1970-01-01T08:00:00.000Z',
  })
  start_time: Date;

  @ApiProperty({
    description: 'End time',
    example: '1970-01-01T10:00:00.000Z',
  })
  end_time: Date;

  @ApiProperty({
    description: 'Schedule status',
    enum: ScheduleStatus,
    example: ScheduleStatus.SCHEDULED,
  })
  status: ScheduleStatus;

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

  @ApiProperty({
    description: 'Academic Calendar information',
    type: AcademicCalendarInfoDto,
    required: false,
  })
  academicCalendar?: AcademicCalendarInfoDto;
}
