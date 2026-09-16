import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFacilityDto {
  @ApiPropertyOptional({
    description: 'Unique facility code',
    example: 'FAC-001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Facility name',
    example: 'Projector',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Facility category',
    example: 'Electronics',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({
    description: 'Facility description',
    example: 'HD multimedia projector for presentations',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
