import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, FacilityCondition } from '@prisma/client';

export class CreateMaintenanceLogDto {
  @ApiProperty({ description: 'Laboratory ID (UUID)', example: 'cc0e8400-e29b-41d4-a716-446655440007' })
  @IsString()
  @IsNotEmpty()
  laboratory_id: string;

  @ApiProperty({ description: 'Facility ID (UUID)', example: 'ff0e8400-e29b-41d4-a716-446655440001' })
  @IsString()
  @IsNotEmpty()
  facility_id: string;

  @ApiPropertyOptional({ description: 'Linked Issue Ticket ID (UUID - optional)', example: 'aa0e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsString()
  issue_ticket_id?: string;

  @ApiProperty({ enum: MaintenanceType, default: MaintenanceType.ROUTINE_PREVENTIVE })
  @IsEnum(MaintenanceType)
  maintenance_type: MaintenanceType;

  @ApiProperty({ description: 'Title / Subject of maintenance', example: 'Pembersihan Kipas & Ganti Thermal Paste PC 05', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Action taken / maintenance description', example: 'Dilakukan penggantian thermal paste prosesor, pembersihan heatsink, dan uji coba benchmark suhu stabil di 42°C.' })
  @IsString()
  @IsNotEmpty()
  action_taken: string;

  @ApiPropertyOptional({ enum: FacilityCondition })
  @IsOptional()
  @IsEnum(FacilityCondition)
  previous_condition?: FacilityCondition;

  @ApiProperty({ enum: FacilityCondition, default: FacilityCondition.GOOD })
  @IsEnum(FacilityCondition)
  resulting_condition: FacilityCondition;

  @ApiPropertyOptional({ description: 'Repair / service cost in Rupiah', example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ description: 'Vendor or technician company name', example: 'PT Citra Solusi Komputer', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendor?: string;

  @ApiPropertyOptional({ description: 'URL of receipt / service report document' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachment_url?: string;

  @ApiProperty({ description: 'Date of maintenance (YYYY-MM-DD)', example: '2026-09-18' })
  @IsDateString()
  @IsNotEmpty()
  maintenance_date: string;
}
