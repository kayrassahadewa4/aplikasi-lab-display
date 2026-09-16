import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageStatus } from '@prisma/client';

export class CreateRoomUsageDto {
  @ApiPropertyOptional({
    description: 'Room Request ID (UUID) - optional',
    example: 'gg0e8400-e29b-41d4-a716-446655440011',
  })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiPropertyOptional({
    description: 'Schedule ID (UUID) - optional',
    example: 'ff0e8400-e29b-41d4-a716-446655440010',
  })
  @IsOptional()
  @IsString()
  schedule_id?: string;

  @ApiPropertyOptional({
    description: 'Target Laboratory ID (UUID) for direct/ad-hoc check-in',
    example: 'dd0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  laboratory_id?: string;

  @ApiPropertyOptional({
    description: 'Activity name or course title for direct check-in',
    example: 'Independent Practical Research Session',
  })
  @IsOptional()
  @IsString()
  activity_name?: string;

  @ApiPropertyOptional({
    description: 'User ID who checked in (UUID) - auto-populated from auth context',
    example: 'aa0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  checked_in_by?: string;

  @ApiProperty({
    description: 'Check in date and time (ISO 8601 format)',
    example: '2024-02-15T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  check_in_time: string;

  @ApiProperty({
    description: 'Usage status',
    enum: UsageStatus,
    example: UsageStatus.CHECKED_IN,
  })
  @IsEnum(UsageStatus)
  @IsNotEmpty()
  status: UsageStatus;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Equipment setup completed',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
