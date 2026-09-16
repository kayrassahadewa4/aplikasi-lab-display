import { ApiProperty } from '@nestjs/swagger';
import {
  UsageStatus,
  RequestStatus,
  ScheduleStatus,
  LaboratoryStatus,
} from '@prisma/client';

export class UsageReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  laboratory: {
    id: string;
    code: string;
    name: string;
  } | null;

  @ApiProperty()
  user: {
    id: string;
    full_name: string;
    email: string;
  };

  @ApiProperty({ required: false, nullable: true })
  schedule?: {
    id: string;
    course_name: string;
    lecturer_name: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  request?: {
    id: string;
    activity_name: string;
  } | null;

  @ApiProperty()
  check_in_time: Date;

  @ApiProperty({ required: false, nullable: true })
  check_out_time?: Date | null;

  @ApiProperty()
  duration_minutes: number;

  @ApiProperty({ enum: UsageStatus })
  status: UsageStatus;
}

export class RequestReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  applicant: {
    id: string;
    full_name: string;
    email: string;
  };

  @ApiProperty()
  laboratory: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty()
  activity_name: string;

  @ApiProperty({ required: false, nullable: true })
  course_name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  class_name?: string | null;

  @ApiProperty()
  request_date: Date;

  @ApiProperty()
  start_time: Date;

  @ApiProperty()
  end_time: Date;

  @ApiProperty({ required: false, nullable: true })
  approval_date?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  approved_by?: {
    id: string;
    full_name: string;
  } | null;

  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;
}

export class ScheduleReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  laboratory: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty()
  course_name: string;

  @ApiProperty()
  lecturer_name: string;

  @ApiProperty()
  class_name: string;

  @ApiProperty()
  day_of_week: number;

  @ApiProperty()
  start_time: Date;

  @ApiProperty()
  end_time: Date;

  @ApiProperty({ enum: ScheduleStatus })
  status: ScheduleStatus;
}

export class LaboratoryReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  maximum_capacity: number;

  @ApiProperty({ enum: LaboratoryStatus })
  status: LaboratoryStatus;

  @ApiProperty()
  total_schedules: number;

  @ApiProperty()
  total_requests: number;

  @ApiProperty()
  total_usages: number;
}

export class SummaryReportDto {
  @ApiProperty()
  total_schedules: number;

  @ApiProperty()
  total_requests: number;

  @ApiProperty()
  approved_requests: number;

  @ApiProperty()
  rejected_requests: number;

  @ApiProperty()
  pending_requests: number;

  @ApiProperty()
  completed_usages: number;

  @ApiProperty()
  ongoing_usages: number;

  @ApiProperty()
  active_laboratories: number;

  @ApiProperty()
  inactive_laboratories: number;

  @ApiProperty()
  occupancy_percentage: number;
}
