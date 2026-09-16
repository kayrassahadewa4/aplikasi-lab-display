import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CalendarStatus } from '@prisma/client';

export class UpdateAcademicCalendarDto {
  @ApiPropertyOptional({
    description: 'Academic year',
    example: '2024/2025',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  academic_year?: string;

  @ApiPropertyOptional({
    description: 'Semester',
    example: 'Ganjil',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  semester?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601 format)',
    example: '2024-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format)',
    example: '2025-01-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Calendar status',
    enum: CalendarStatus,
    example: CalendarStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CalendarStatus)
  status?: CalendarStatus;
}
