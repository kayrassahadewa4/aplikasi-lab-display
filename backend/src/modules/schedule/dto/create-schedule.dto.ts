import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsString()
  @IsNotEmpty()
  laboratory_id: string;

  @ApiProperty({
    description: 'Academic Calendar ID (UUID)',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @IsString()
  @IsNotEmpty()
  academic_calendar_id: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Data Structures and Algorithms',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  course_name: string;

  @ApiProperty({
    description: 'Lecturer name',
    example: 'Dr. John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lecturer_name: string;

  @ApiProperty({
    description: 'Class name',
    example: 'CS-A1',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  class_name: string;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({
    description: 'Start time (HH:mm:ss format)',
    example: '08:00:00',
  })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({
    description: 'End time (HH:mm:ss format)',
    example: '10:00:00',
  })
  @IsString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({
    description: 'Schedule status',
    enum: ScheduleStatus,
    example: ScheduleStatus.SCHEDULED,
  })
  @IsEnum(ScheduleStatus)
  @IsNotEmpty()
  status: ScheduleStatus;
}
