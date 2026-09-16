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
import { AcademicCalendarService } from './academic-calendar.service.js';
import { CreateAcademicCalendarDto } from './dto/create-academic-calendar.dto.js';
import { UpdateAcademicCalendarDto } from './dto/update-academic-calendar.dto.js';
import { ResponseAcademicCalendarDto } from './dto/response-academic-calendar.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Academic Calendars')
@Controller('academic-calendars')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class AcademicCalendarController {
  constructor(
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new academic calendar' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Academic calendar created successfully',
    type: ResponseAcademicCalendarDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic year and semester combination already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or end date is not after start date',
  })
  async create(
    @Body() createAcademicCalendarDto: CreateAcademicCalendarDto,
  ): Promise<ResponseAcademicCalendarDto> {
    return this.academicCalendarService.create(createAcademicCalendarDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all academic calendars with pagination and search',
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
    description: 'Search by academic year or semester',
    example: '2024',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic calendars retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ResponseAcademicCalendarDto>> {
    const { page, limit, search } = paginationDto;
    return this.academicCalendarService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an academic calendar by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Academic calendar UUID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic calendar retrieved successfully',
    type: ResponseAcademicCalendarDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic calendar not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseAcademicCalendarDto> {
    return this.academicCalendarService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an academic calendar' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Academic calendar UUID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic calendar updated successfully',
    type: ResponseAcademicCalendarDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic calendar not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic year and semester combination already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or end date is not after start date',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAcademicCalendarDto: UpdateAcademicCalendarDto,
  ): Promise<ResponseAcademicCalendarDto> {
    return this.academicCalendarService.update(id, updateAcademicCalendarDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an academic calendar' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Academic calendar UUID',
    example: 'bb0e8400-e29b-41d4-a716-446655440006',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Academic calendar deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic calendar not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Academic calendar is referenced in schedules and cannot be deleted',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.academicCalendarService.remove(id);
  }
}
