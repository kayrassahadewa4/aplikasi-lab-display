import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  avatar_url?: string | null;
}

class LaboratoryInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

export class ResponseRoomRequestDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  applicant_id: string;

  @ApiProperty()
  laboratory_id: string;

  @ApiPropertyOptional()
  approved_by?: string | null;

  @ApiProperty()
  activity_name: string;

  @ApiPropertyOptional()
  course_name?: string | null;

  @ApiPropertyOptional()
  class_name?: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty()
  request_date: Date;

  @ApiProperty()
  start_time: Date;

  @ApiProperty()
  end_time: Date;

  @ApiProperty()
  participant_count: number;

  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @ApiPropertyOptional()
  rejection_reason?: string | null;

  @ApiPropertyOptional()
  document_url?: string | null;

  @ApiPropertyOptional()
  approved_at?: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: UserInfoDto })
  applicant?: UserInfoDto;

  @ApiPropertyOptional({ type: UserInfoDto })
  approver?: UserInfoDto | null;

  @ApiPropertyOptional({ type: LaboratoryInfoDto })
  laboratory?: LaboratoryInfoDto;
}
