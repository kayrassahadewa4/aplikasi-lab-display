import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class UpdateRoomRequestDto {
  @ApiPropertyOptional({
    description: 'Activity name',
    example: 'Programming Workshop',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  activity_name?: string; 

  @ApiPropertyOptional({
    description: 'Course name',
    example: 'Web Development',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  course_name?: string;

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
    description: 'Description of the activity',
    example: 'Workshop on modern web development practices',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Request date (ISO 8601 format)',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  request_date?: string;

  @ApiPropertyOptional({
    description: 'Start time (HH:mm:ss format)',
    example: '09:00:00',
  })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({
    description: 'End time (HH:mm:ss format)',
    example: '12:00:00',
  })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({
    description: 'Number of participants',
    example: 25,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  participant_count?: number;

  @ApiPropertyOptional({
    description: 'Request status',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Approver User ID (UUID)',
    example: 'aa0e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsString()
  approved_by?: string;

  @ApiPropertyOptional({
    description: 'Rejection reason',
    example: 'Laboratory not available at requested time',
  })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiPropertyOptional({
    description: 'URL of uploaded supporting document/official letter (PDF/image)',
    example: '/uploads/documents/document-1726000000-12345.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  document_url?: string;
}
