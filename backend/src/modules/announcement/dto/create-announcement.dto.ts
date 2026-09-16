import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement title',
    example: 'Laboratory Maintenance Schedule',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    description: 'Announcement content',
    example:
      'All laboratories will be closed for maintenance on Saturday, January 20, 2024.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Start date and time (ISO 8601 format)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  start_at: string;

  @ApiProperty({
    description: 'End date and time (ISO 8601 format)',
    example: '2024-01-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  end_at: string;

  @ApiProperty({
    description: 'Is announcement active',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}
