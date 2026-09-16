import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOperationalHourDto {
  @ApiProperty({
    description: 'Laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsString()
  @IsNotEmpty()
  laboratory_id: string;

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
    description: 'Opening time (HH:mm:ss format)',
    example: '08:00:00',
  })
  @IsString()
  @IsNotEmpty()
  open_time: string;

  @ApiProperty({
    description: 'Closing time (HH:mm:ss format)',
    example: '17:00:00',
  })
  @IsString()
  @IsNotEmpty()
  close_time: string;
}
