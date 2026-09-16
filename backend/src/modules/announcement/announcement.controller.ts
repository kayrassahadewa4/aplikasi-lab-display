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
import { AnnouncementService } from './announcement.service.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto.js';
import { ResponseAnnouncementDto } from './dto/response-announcement.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()

export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Announcement created successfully',
    type: ResponseAnnouncementDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or end date is not after start date',
  })
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<ResponseAnnouncementDto> {
    return this.announcementService.create(createAnnouncementDto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({
    summary: 'Get all announcements with pagination and search',
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
    description: 'Search by title or content',
    example: 'maintenance',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Announcements retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('is_active') isActive?: string,
  ): Promise<PaginatedResponseDto<ResponseAnnouncementDto>> {
    const { page, limit, search } = paginationDto;
    const isActiveFilter = isActive !== undefined ? isActive === 'true' : undefined;
    return this.announcementService.findAll(page, limit, search, isActiveFilter);
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get an announcement by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Announcement UUID',
    example: 'ee0e8400-e29b-41d4-a716-446655440009',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Announcement retrieved successfully',
    type: ResponseAnnouncementDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Announcement not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseAnnouncementDto> {
    return this.announcementService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Announcement UUID',
    example: 'ee0e8400-e29b-41d4-a716-446655440009',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Announcement updated successfully',
    type: ResponseAnnouncementDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Announcement not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or end date is not after start date',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponseAnnouncementDto> {
    return this.announcementService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Announcement UUID',
    example: 'ee0e8400-e29b-41d4-a716-446655440009',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Announcement deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Announcement not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.announcementService.remove(id);
  }
}
