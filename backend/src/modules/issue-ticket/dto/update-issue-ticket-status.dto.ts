import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus } from '@prisma/client';

export class UpdateIssueTicketStatusDto {
  @ApiProperty({ enum: IssueStatus, example: IssueStatus.INVESTIGATING })
  @IsEnum(IssueStatus)
  @IsNotEmpty()
  status: IssueStatus;

  @ApiPropertyOptional({ description: 'Resolution or investigation notes', example: 'Sudah diperiksa laboran, kabel VGA diganti baru.' })
  @IsOptional()
  @IsString()
  resolution_notes?: string;
}
