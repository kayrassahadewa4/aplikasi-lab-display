import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { RequestStatus } from '@prisma/client';

export class RoomRequestQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Filter by laboratory ID (UUID)',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @IsOptional()
  @IsUUID()
  laboratory_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by applicant ID (UUID)',
    example: 'aa0e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  applicant_id?: string;

  @ApiPropertyOptional({
    description: 'Filter for requests without associated room usage',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unused_only?: boolean;
}

