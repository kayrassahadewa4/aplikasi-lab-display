import { IsString, IsInt, IsOptional, IsEnum, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LaboratoryStatus } from '@prisma/client';

export class UpdateLaboratoryDto {
  @ApiPropertyOptional({
    description: 'Unique laboratory code',
    example: 'LAB-001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Laboratory name',
    example: 'Computer Laboratory 1',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Laboratory location',
    example: 'Building A, Floor 2',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Maximum capacity of the laboratory',
    example: 40,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maximum_capacity?: number;

  @ApiPropertyOptional({
    description: 'Laboratory image URL or path',
    example: '/images/lab-001.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @ApiPropertyOptional({
    description: 'Laboratory description',
    example: 'A modern computer laboratory equipped with 40 workstations',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Laboratory status',
    enum: LaboratoryStatus,
    example: LaboratoryStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(LaboratoryStatus)
  status?: LaboratoryStatus;
}
