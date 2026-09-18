import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssueSeverity, IssueStatus } from '@prisma/client';

export class IssueTicketQueryDto {
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

  @ApiPropertyOptional({ description: 'Search title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssueSeverity })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ description: 'Filter by laboratory ID' })
  @IsOptional()
  @IsString()
  laboratory_id?: string;
}
