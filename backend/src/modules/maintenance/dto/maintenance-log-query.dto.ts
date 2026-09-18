import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType } from '@prisma/client';

export class MaintenanceLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search title or action taken' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenance_type?: MaintenanceType;

  @ApiPropertyOptional({ description: 'Filter by laboratory ID' })
  @IsOptional()
  @IsString()
  laboratory_id?: string;

  @ApiPropertyOptional({ description: 'Filter by facility ID' })
  @IsOptional()
  @IsString()
  facility_id?: string;
}
