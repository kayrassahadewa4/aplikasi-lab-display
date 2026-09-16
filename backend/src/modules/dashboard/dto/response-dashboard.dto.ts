import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus, UsageStatus } from '@prisma/client';

export class DashboardSummaryDto {
  @ApiProperty()
  total_laboratories: number;

  @ApiProperty()
  active_laboratories: number;

  @ApiProperty()
  inactive_laboratories: number;

  @ApiProperty()
  total_schedules: number;

  @ApiProperty()
  today_schedules: number;

  @ApiProperty()
  total_room_requests: number;

  @ApiProperty()
  pending_requests: number;

  @ApiProperty()
  approved_requests: number;

  @ApiProperty()
  rejected_requests: number;

  @ApiProperty()
  current_room_usage: number;

  @ApiProperty()
  active_announcements: number;
}

export class LaboratoryStatisticDto {
  @ApiProperty()
  laboratory_id: string;

  @ApiProperty()
  laboratory_code: string;

  @ApiProperty()
  laboratory_name: string;

  @ApiProperty()
  total_schedules: number;

  @ApiProperty()
  total_requests: number;

  @ApiProperty()
  total_usage: number;

  @ApiProperty()
  occupancy_percentage: number;
}

export class RequestStatisticDto {
  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class UsageStatisticDto {
  @ApiProperty()
  today_usage: number;

  @ApiProperty()
  weekly_usage: number;

  @ApiProperty()
  monthly_usage: number;

  @ApiProperty()
  average_duration_minutes: number;

  @ApiProperty()
  completed_usage: number;

  @ApiProperty()
  ongoing_usage: number;
}

export class OccupancyStatisticDto {
  @ApiProperty()
  laboratory_id: string;

  @ApiProperty()
  laboratory_code: string;

  @ApiProperty()
  laboratory_name: string;

  @ApiProperty()
  occupied_hours: number;

  @ApiProperty()
  available_hours: number;

  @ApiProperty()
  occupancy_percentage: number;
}
