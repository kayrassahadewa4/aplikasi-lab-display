import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UsageStatus } from '@prisma/client';

class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;
}

export class ResponseRoomUsageDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  request_id?: string | null;

  @ApiPropertyOptional()
  schedule_id?: string | null;

  @ApiProperty()
  checked_in_by: string;

  @ApiPropertyOptional()
  checked_out_by?: string | null;

  @ApiProperty()
  check_in_time: Date;

  @ApiPropertyOptional()
  check_out_time?: Date | null;

  @ApiProperty({ enum: UsageStatus })
  status: UsageStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: UserInfoDto })
  checkedInBy?: UserInfoDto;

  @ApiPropertyOptional({ type: UserInfoDto })
  checkedOutBy?: UserInfoDto | null;

  @ApiPropertyOptional()
  request?: any;

  @ApiPropertyOptional()
  schedule?: any;
}
