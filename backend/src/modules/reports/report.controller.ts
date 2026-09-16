import { Controller, Get, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service.js';
import { ReportFilterDto } from './dto/report-filters.dto.js';
import {
  UsageReportDto,
  RequestReportDto,
  ScheduleReportDto,
  LaboratoryReportDto,
  SummaryReportDto,
} from './dto/report-response.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN', 'LABORAN')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('usage')
  @ApiOperation({ summary: 'Get usage report with filters' })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'laboratory_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'room_request_id', required: false, type: String })
  @ApiQuery({ name: 'schedule_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage report retrieved successfully',
  })
  async getUsageReport(
    @Query() filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<UsageReportDto>> {
    return this.reportService.getUsageReport(filters);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get request report with filters' })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'laboratory_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'user_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request report retrieved successfully',
  })
  async getRequestReport(
    @Query() filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<RequestReportDto>> {
    return this.reportService.getRequestReport(filters);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Get schedule report with filters' })
  @ApiQuery({ name: 'laboratory_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule report retrieved successfully',
  })
  async getScheduleReport(
    @Query() filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<ScheduleReportDto>> {
    return this.reportService.getScheduleReport(filters);
  }

  @Get('laboratories')
  @ApiOperation({ summary: 'Get laboratory report with statistics' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratory report retrieved successfully',
  })
  async getLaboratoryReport(
    @Query() filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<LaboratoryReportDto>> {
    return this.reportService.getLaboratoryReport(filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary report with aggregated data' })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary report retrieved successfully',
    type: SummaryReportDto,
  })
  async getSummaryReport(
    @Query() filters: ReportFilterDto,
  ): Promise<SummaryReportDto> {
    return this.reportService.getSummaryReport(filters);
  }
}
