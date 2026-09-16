import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import {
  DashboardSummaryDto,
  LaboratoryStatisticDto,
  RequestStatisticDto,
  UsageStatisticDto,
  OccupancyStatisticDto,
} from './dto/response-dashboard.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get overall dashboard summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard summary retrieved successfully',
    type: DashboardSummaryDto,
  })
  async getDashboard(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('statistics')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get overall dashboard statistics (alias)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardSummaryDto,
  })
  async getStatistics(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('laboratories')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get laboratory statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratory statistics retrieved successfully',
    type: [LaboratoryStatisticDto],
  })
  async getLaboratories(): Promise<LaboratoryStatisticDto[]> {
    return this.dashboardService.getLaboratoryStatistics();
  }

  @Get('requests')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get request statistics by status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request statistics retrieved successfully',
    type: [RequestStatisticDto],
  })
  async getRequests(): Promise<RequestStatisticDto[]> {
    return this.dashboardService.getRequestStatistics();
  }

  @Get('usage')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage statistics retrieved successfully',
    type: UsageStatisticDto,
  })
  async getUsage(): Promise<UsageStatisticDto> {
    return this.dashboardService.getUsageStatistics();
  }

  @Get('occupancy')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get occupancy statistics per laboratory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Occupancy statistics retrieved successfully',
    type: [OccupancyStatisticDto],
  })
  async getOccupancy(): Promise<OccupancyStatisticDto[]> {
    return this.dashboardService.getOccupancyStatistics();
  }
}
