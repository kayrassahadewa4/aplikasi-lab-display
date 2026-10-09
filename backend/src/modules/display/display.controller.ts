import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DisplayService } from './display.service.js';
import {
  DisplayAnnouncementDto,
  DisplayLaboratoryDto,
  DisplayScheduleDto,
  DisplayRoomRequestDto,
  DisplayRoomUsageDto,
  AggregatedDisplayDto,
} from './dto/display-response.dto.js';

@ApiTags('Display')
@Controller('display')
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Get()
  @ApiOperation({
    summary: 'Get aggregated display data for laboratory screen',
  })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Target date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'day_of_week', required: false, type: Number, description: 'Target day of week (0-6)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aggregated display data retrieved successfully',
    type: AggregatedDisplayDto,
  })
  async getAggregatedDisplay(
    @Query('date') date?: string,
    @Query('day_of_week') dayOfWeek?: string,
  ): Promise<AggregatedDisplayDto> {
    const parsedDay = dayOfWeek !== undefined && dayOfWeek !== '' ? parseInt(dayOfWeek, 10) : undefined;
    return this.displayService.aggregateDisplayData(date, parsedDay);
  }

  @Get('laboratories')
  @ApiOperation({ summary: 'Get all laboratories with current status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratories retrieved successfully',
    type: [DisplayLaboratoryDto],
  })
  async getLaboratories(): Promise<DisplayLaboratoryDto[]> {
    return this.displayService.findLaboratoryStatus();
  }

  @Get('schedules')
  @ApiOperation({ summary: "Get today's schedules" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedules retrieved successfully',
    type: [DisplayScheduleDto],
  })
  async getSchedules(): Promise<DisplayScheduleDto[]> {
    return this.displayService.findTodaySchedules();
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Get active announcements' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active announcements retrieved successfully',
    type: [DisplayAnnouncementDto],
  })
  async getAnnouncements(): Promise<DisplayAnnouncementDto[]> {
    return this.displayService.findActiveAnnouncements();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get laboratory status (alias for laboratories)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratory status retrieved successfully',
    type: [DisplayLaboratoryDto],
  })
  async getStatus(): Promise<DisplayLaboratoryDto[]> {
    return this.displayService.findLaboratoryStatus();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current room usage' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current room usage retrieved successfully',
    type: [DisplayRoomUsageDto],
  })
  async getUsage(): Promise<DisplayRoomUsageDto[]> {
    return this.displayService.findCurrentUsage();
  }
}
