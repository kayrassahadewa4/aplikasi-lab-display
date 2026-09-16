import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { ResponseScheduleDto } from './dto/response-schedule.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ScheduleStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Schedule created successfully',
    type: ResponseScheduleDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Laboratory or Academic Calendar not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({
    summary: 'Get all schedules with pagination, search, and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by course name, lecturer name, or class name',
    example: 'Data Structures',
  })
  @ApiQuery({
    name: 'academic_calendar_id',
    required: false,
    type: String,
    description: 'Filter by academic calendar ID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @ApiQuery({
    name: 'laboratory_id',
    required: false,
    type: String,
    description: 'Filter by laboratory ID',
    example: 'cc0e8400-e29b-41d4-a716-446655440007',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ScheduleStatus,
    description: 'Filter by schedule status',
    example: ScheduleStatus.SCHEDULED,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedules retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('academic_calendar_id') academic_calendar_id?: string,
    @Query('laboratory_id') laboratory_id?: string,
    @Query('status') status?: ScheduleStatus,
  ): Promise<PaginatedResponseDto<ResponseScheduleDto>> {
    const { page, limit, search } = paginationDto;
    return this.scheduleService.findAll(
      page,
      limit,
      search,
      academic_calendar_id,
      laboratory_id,
      status,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Schedule UUID',
    example: 'ff0e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule retrieved successfully',
    type: ResponseScheduleDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseScheduleDto> {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Schedule UUID',
    example: 'ff0e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule updated successfully',
    type: ResponseScheduleDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule, Laboratory, or Academic Calendar not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Schedule UUID',
    example: 'ff0e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Schedule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Schedule not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.scheduleService.remove(id);
  }
}
