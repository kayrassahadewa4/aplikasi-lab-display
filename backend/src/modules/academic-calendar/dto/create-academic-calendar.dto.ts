import { IsString, IsNotEmpty, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CalendarStatus } from '@prisma/client';

export class CreateAcademicCalendarDto {
  @ApiProperty({
    description: 'Academic year',
    example: '2024/2025',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  academic_year: string;

  @ApiProperty({
    description: 'Semester',
    example: 'Ganjil',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  semester: string;

  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    example: '2024-09-01',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    example: '2025-01-31',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @ApiProperty({
    description: 'Calendar status',
    enum: CalendarStatus,
    example: CalendarStatus.ACTIVE,
  })
  @IsEnum(CalendarStatus)
  @IsNotEmpty()
  status: CalendarStatus;
}
