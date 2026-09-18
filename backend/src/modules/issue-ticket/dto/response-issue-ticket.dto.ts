import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueSeverity, IssueStatus } from '@prisma/client';

export class ResponseIssueTicketDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticket_number: string;

  @ApiProperty()
  laboratory_id: string;

  @ApiPropertyOptional()
  facility_id?: string | null;

  @ApiProperty()
  reported_by_id: string;

  @ApiPropertyOptional()
  handled_by_id?: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: IssueSeverity })
  severity: IssueSeverity;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiPropertyOptional()
  image_url?: string | null;

  @ApiPropertyOptional()
  resolution_notes?: string | null;

  @ApiPropertyOptional()
  resolved_at?: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  laboratory?: {
    id: string;
    code: string;
    name: string;
    location?: string;
  };

  @ApiPropertyOptional()
  facility?: {
    id: string;
    code: string;
    name: string;
    category: string;
  } | null;

  @ApiPropertyOptional()
  reporter?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };

  @ApiPropertyOptional()
  handler?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}
