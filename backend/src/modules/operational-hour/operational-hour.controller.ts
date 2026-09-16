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
import { OperationalHourService } from './operational-hour.service.js';
import { CreateOperationalHourDto } from './dto/create-operational-hour.dto.js';
import { UpdateOperationalHourDto } from './dto/update-operational-hour.dto.js';
import { ResponseOperationalHourDto } from './dto/response-operational-hour.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Operational Hours')
@Controller('operational-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class OperationalHourController {
  constructor(
    private readonly operationalHourService: OperationalHourService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new operational hour' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Operational hour created successfully',
    type: ResponseOperationalHourDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Operational hour for this laboratory and day already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or close time is not after open time',
  })
  async create(
    @Body() createOperationalHourDto: CreateOperationalHourDto,
  ): Promise<ResponseOperationalHourDto> {
    return this.operationalHourService.create(createOperationalHourDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all operational hours with pagination and search',
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
    description: 'Search by laboratory name or code',
    example: 'Computer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operational hours retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ResponseOperationalHourDto>> {
    const { page, limit, search } = paginationDto;
    return this.operationalHourService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an operational hour by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Operational hour UUID',
    example: 'dd0e8400-e29b-41d4-a716-446655440008',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operational hour retrieved successfully',
    type: ResponseOperationalHourDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Operational hour not found',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResponseOperationalHourDto> {
    return this.operationalHourService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an operational hour' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Operational hour UUID',
    example: 'dd0e8400-e29b-41d4-a716-446655440008',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operational hour updated successfully',
    type: ResponseOperationalHourDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Operational hour or laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Operational hour for this laboratory and day already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or close time is not after open time',
  })
  async update(
    @Param('id') id: string,
    @Body() updateOperationalHourDto: UpdateOperationalHourDto,
  ): Promise<ResponseOperationalHourDto> {
    return this.operationalHourService.update(id, updateOperationalHourDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an operational hour' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Operational hour UUID',
    example: 'dd0e8400-e29b-41d4-a716-446655440008',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Operational hour deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Operational hour not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.operationalHourService.remove(id);
  }
}
