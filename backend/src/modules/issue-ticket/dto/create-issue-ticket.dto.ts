import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueSeverity } from '@prisma/client';

export class CreateIssueTicketDto {
  @ApiProperty({ description: 'Laboratory ID (UUID)', example: 'cc0e8400-e29b-41d4-a716-446655440007' })
  @IsString()
  @IsNotEmpty()
  laboratory_id: string;

  @ApiPropertyOptional({ description: 'Facility ID (UUID - optional if general lab issue)', example: 'ff0e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsString()
  facility_id?: string;

  @ApiProperty({ description: 'Ticket title / issue summary', example: 'PC-14 Layar Blank Biru', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue/damage', example: 'Saat dihidupkan PC nomor 14 berbunyi beep 3 kali dan tidak menampilkan display.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: IssueSeverity, default: IssueSeverity.MEDIUM, example: IssueSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ description: 'URL of uploaded photo evidence', example: '/uploads/issues/issue-1726000000.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;
}
