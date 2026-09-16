import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsageStatus } from '@prisma/client';

export class UpdateRoomUsageDto {
  @ApiPropertyOptional({
    description: 'User ID who checked out (UUID)',
    example: 'aa0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsString()
  checked_out_by?: string;

  @ApiPropertyOptional({
    description: 'Check out date and time (ISO 8601 format)',
    example: '2024-02-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @ApiPropertyOptional({
    description: 'Usage status',
    enum: UsageStatus,
    example: UsageStatus.CHECKED_OUT,
  })
  @IsOptional()
  @IsEnum(UsageStatus)
  status?: UsageStatus;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Laboratory cleaned and ready for next session',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
