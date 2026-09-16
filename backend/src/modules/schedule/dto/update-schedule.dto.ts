import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma/client';

export class UpdateScheduleDto {
  @ApiPropertyOptional({
    description: 'Laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsOptional()
  @IsString()
  laboratory_id?: string;

  @ApiPropertyOptional({
    description: 'Academic Calendar ID (UUID)',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @IsOptional()
  @IsString()
  academic_calendar_id?: string;

  @ApiPropertyOptional({
    description: 'Course name',
    example: 'Data Structures and Algorithms',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  course_name?: string;

  @ApiPropertyOptional({
    description: 'Lecturer name',
    example: 'Dr. John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lecturer_name?: string;

  @ApiPropertyOptional({
    description: 'Class name',
    example: 'CS-A1',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  class_name?: string;

  @ApiPropertyOptional({
    description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional({
    description: 'Start time (HH:mm:ss format)',
    example: '08:00:00',
  })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({
    description: 'End time (HH:mm:ss format)',
    example: '10:00:00',
  })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({
    description: 'Schedule status',
    enum: ScheduleStatus,
    example: ScheduleStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
