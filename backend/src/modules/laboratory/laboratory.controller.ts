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
import { LaboratoryService } from './laboratory.service.js';
import { CreateLaboratoryDto } from './dto/create-laboratory.dto.js';
import { UpdateLaboratoryDto } from './dto/update-laboratory.dto.js';
import { ResponseLaboratoryDto } from './dto/response-laboratory.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Laboratories')
@Controller('laboratories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LaboratoryController {
  constructor(private readonly laboratoryService: LaboratoryService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new laboratory' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Laboratory created successfully',
    type: ResponseLaboratoryDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Laboratory code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createLaboratoryDto: CreateLaboratoryDto,
  ): Promise<ResponseLaboratoryDto> {
    return this.laboratoryService.create(createLaboratoryDto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get all laboratories with pagination and search' })
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
    description: 'Search by code, name, or location',
    example: 'computer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratories retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ResponseLaboratoryDto>> {
    const { page, limit, search } = paginationDto;
    return this.laboratoryService.findAll(page, limit, search);
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get a laboratory by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Laboratory UUID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratory retrieved successfully',
    type: ResponseLaboratoryDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Laboratory not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseLaboratoryDto> {
    return this.laboratoryService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a laboratory' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Laboratory UUID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Laboratory updated successfully',
    type: ResponseLaboratoryDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Laboratory code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLaboratoryDto: UpdateLaboratoryDto,
  ): Promise<ResponseLaboratoryDto> {
    return this.laboratoryService.update(id, updateLaboratoryDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a laboratory' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Laboratory UUID',
    example: '880e8400-e29b-41d4-a716-446655440003',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Laboratory deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Laboratory is referenced by other records and cannot be deleted',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.laboratoryService.remove(id);
  }
}
