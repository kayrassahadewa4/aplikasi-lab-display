import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMessageDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Folder filter (inbox, sent, archived)', default: 'inbox' })
  @IsOptional()
  @IsString()
  folder?: string = 'inbox';

  @ApiPropertyOptional({ description: 'Search term for sender, recipient, subject or body' })
  @IsOptional()
  @IsString()
  search?: string;
}
