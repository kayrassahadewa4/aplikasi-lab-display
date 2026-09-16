import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class CreateRoomRequestDto {
  @ApiPropertyOptional({
    description: 'Applicant User ID (UUID - optional for authenticated users, defaults to JWT user)',
    example: 'aa0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  applicant_id?: string;

  @ApiPropertyOptional({
    description: 'Approved By User ID (UUID - optional for staff/admin direct approvals)',
    example: 'aa0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  approved_by?: string;

  @ApiProperty({
    description: 'Laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsString()
  @IsNotEmpty()
  laboratory_id: string;

  @ApiProperty({
    description: 'Activity name',
    example: 'Programming Workshop',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  activity_name: string;

  @ApiPropertyOptional({
    description: 'Course name (optional)',
    example: 'Web Development',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  course_name?: string;

  @ApiPropertyOptional({
    description: 'Class name (optional)',
    example: 'CS-A1',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  class_name?: string;

  @ApiProperty({
    description: 'Description of the activity',
    example: 'Workshop on modern web development practices',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Request date (ISO 8601 format)',
    example: '2024-02-15',
  })
  @IsDateString()
  @IsNotEmpty()
  request_date: string;

  @ApiProperty({
    description: 'Start time (HH:mm:ss format)',
    example: '09:00:00',
  })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({
    description: 'End time (HH:mm:ss format)',
    example: '12:00:00',
  })
  @IsString()
  @IsNotEmpty()
  end_time: string;

  @ApiProperty({
    description: 'Number of participants',
    example: 25,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  participant_count: number;

  @ApiPropertyOptional({
    description: 'Request status (defaults to PENDING)',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Whether the request repeats weekly (e.g. for a 16-week semester course)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiPropertyOptional({
    description: 'Number of weekly occurrences (default 16 for standard semester lecture)',
    example: 16,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  occurrences?: number;
}
