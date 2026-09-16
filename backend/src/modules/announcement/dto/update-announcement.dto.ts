import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Announcement title',
    example: 'Laboratory Maintenance Schedule',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    description: 'Announcement content',
    example:
      'All laboratories will be closed for maintenance on Saturday, January 20, 2024.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Start date and time (ISO 8601 format)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  start_at?: string;

  @ApiPropertyOptional({
    description: 'End date and time (ISO 8601 format)',
    example: '2024-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  end_at?: string;

  @ApiPropertyOptional({
    description: 'Is announcement active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
