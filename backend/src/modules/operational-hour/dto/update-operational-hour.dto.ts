import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOperationalHourDto {
  @ApiPropertyOptional({
    description: 'Laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsOptional()
  @IsString()
  laboratory_id?: string;

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
    description: 'Opening time (HH:mm:ss format)',
    example: '08:00:00',
  })
  @IsOptional()
  @IsString()
  open_time?: string;

  @ApiPropertyOptional({
    description: 'Closing time (HH:mm:ss format)',
    example: '17:00:00',
  })
  @IsOptional()
  @IsString()
  close_time?: string;
}
