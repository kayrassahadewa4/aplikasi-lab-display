import { ApiProperty } from '@nestjs/swagger';
import {
  LaboratoryStatus,
  ScheduleStatus,
  RequestStatus,
  UsageStatus,
  FacilityCondition,
} from '@prisma/client';

export class DisplayAnnouncementDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  start_at: Date;

  @ApiProperty()
  end_at: Date;
}

export class DisplayLaboratoryFacilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: FacilityCondition })
  condition: FacilityCondition;

  @ApiProperty()
  facility: {
    id: string;
    code: string;
    name: string;
    category: string;
    description?: string | null;
  };
}

export class DisplayLaboratoryDto {
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

  @ApiProperty({ required: false, nullable: true })
  image?: string | null;

  @ApiProperty({ enum: LaboratoryStatus })
  status: LaboratoryStatus;

  @ApiProperty({ type: [DisplayLaboratoryFacilityDto], required: false })
  laboratoryFacilities?: DisplayLaboratoryFacilityDto[];
}

export class DisplayScheduleDto {
  @ApiProperty()
  id: string;

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

  @ApiProperty()
  laboratory: {
    id: string;
    code: string;
    name: string;
  };
}

export class DisplayRoomRequestDto {
  @ApiProperty()
  id: string;

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

  @ApiProperty()
  participant_count: number;

  @ApiProperty()
  applicant: {
    id: string;
    full_name: string;
  };

  @ApiProperty()
  laboratory: {
    id: string;
    code: string;
    name: string;
  };
}

export class DisplayRoomUsageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  check_in_time: Date;

  @ApiProperty({ required: false, nullable: true })
  check_out_time?: Date | null;

  @ApiProperty({ enum: UsageStatus })
  status: UsageStatus;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty()
  checkedInBy: {
    id: string;
    full_name: string;
  };

  @ApiProperty({ required: false, nullable: true })
  request?: {
    activity_name: string;
    start_time?: Date;
    end_time?: Date;
    laboratory: {
      id: string;
      code: string;
      name: string;
    };
  } | null;

  @ApiProperty({ required: false, nullable: true })
  schedule?: {
    course_name: string;
    start_time?: Date;
    end_time?: Date;
    laboratory: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
}

export class AggregatedDisplayDto {
  @ApiProperty()
  server_time: Date;

  @ApiProperty({ type: [DisplayAnnouncementDto] })
  announcements: DisplayAnnouncementDto[];

  @ApiProperty({ type: [DisplayLaboratoryDto] })
  laboratories: DisplayLaboratoryDto[];

  @ApiProperty({ type: [DisplayScheduleDto] })
  schedules: DisplayScheduleDto[];

  @ApiProperty({ type: [DisplayRoomRequestDto] })
  room_requests: DisplayRoomRequestDto[];

  @ApiProperty({ type: [DisplayRoomUsageDto] })
  room_usage: DisplayRoomUsageDto[];
}
