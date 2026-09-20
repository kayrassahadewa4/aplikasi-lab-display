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
import { FacilityService } from './facility.service.js';
import { CreateFacilityDto } from './dto/create-facility.dto.js';
import { UpdateFacilityDto } from './dto/update-facility.dto.js';
import { ResponseFacilityDto } from './dto/response-facility.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Facilities')
@Controller('facilities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Create a new facility' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Facility created successfully',
    type: ResponseFacilityDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Facility code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createFacilityDto: CreateFacilityDto,
  ): Promise<ResponseFacilityDto> {
    return this.facilityService.create(createFacilityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all facilities with pagination and search' })
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
    description: 'Search by code, name, or category',
    example: 'projector',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Facilities retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ResponseFacilityDto>> {
    const { page, limit, search } = paginationDto;
    return this.facilityService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a facility by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Facility UUID',
    example: 'aa0e8400-e29b-41d4-a716-446655440005',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Facility retrieved successfully',
    type: ResponseFacilityDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseFacilityDto> {
    return this.facilityService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Update a facility' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Facility UUID',
    example: 'aa0e8400-e29b-41d4-a716-446655440005',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Facility updated successfully',
    type: ResponseFacilityDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Facility code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ): Promise<ResponseFacilityDto> {
    return this.facilityService.update(id, updateFacilityDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'LABORAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a facility' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Facility UUID',
    example: 'aa0e8400-e29b-41d4-a716-446655440005',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Facility deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Facility is assigned to laboratories and cannot be deleted',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.facilityService.remove(id);
  }
}
