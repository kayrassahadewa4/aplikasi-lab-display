import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, FacilityCondition } from '@prisma/client';

export class ResponseMaintenanceLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  laboratory_id: string;

  @ApiProperty()
  facility_id: string;

  @ApiProperty()
  performed_by_id: string;

  @ApiPropertyOptional()
  issue_ticket_id?: string | null;

  @ApiProperty({ enum: MaintenanceType })
  maintenance_type: MaintenanceType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  action_taken: string;

  @ApiPropertyOptional({ enum: FacilityCondition })
  previous_condition?: FacilityCondition | null;

  @ApiProperty({ enum: FacilityCondition })
  resulting_condition: FacilityCondition;

  @ApiPropertyOptional()
  cost?: number | null;

  @ApiPropertyOptional()
  vendor?: string | null;

  @ApiPropertyOptional()
  attachment_url?: string | null;

  @ApiProperty()
  maintenance_date: Date;

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
  };

  @ApiPropertyOptional()
  technician?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };

  @ApiPropertyOptional()
  issueTicket?: {
    id: string;
    ticket_number: string;
    title: string;
    status: string;
  } | null;
}
