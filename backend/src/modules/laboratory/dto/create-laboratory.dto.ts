import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LaboratoryStatus } from '@prisma/client';

export class CreateLaboratoryDto {
  @ApiProperty({
    description: 'Unique laboratory code',
    example: 'LAB-001',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({
    description: 'Laboratory name',
    example: 'Computer Laboratory 1',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Laboratory location',
    example: 'Building A, Floor 2',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @ApiProperty({
    description: 'Maximum capacity of the laboratory',
    example: 40,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  maximum_capacity: number;

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

  @ApiProperty({
    description: 'Laboratory status',
    enum: LaboratoryStatus,
    example: LaboratoryStatus.AVAILABLE,
  })
  @IsEnum(LaboratoryStatus)
  @IsNotEmpty()
  status: LaboratoryStatus;
}
