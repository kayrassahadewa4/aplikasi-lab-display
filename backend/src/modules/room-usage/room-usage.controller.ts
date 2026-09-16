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
import { RoomUsageService } from './room-usage.service.js';
import { CreateRoomUsageDto } from './dto/create-room-usage.dto.js';
import { UpdateRoomUsageDto } from './dto/update-room-usage.dto.js';
import { ResponseRoomUsageDto } from './dto/response-room-usage.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { UsageStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Room Usage')
@Controller('room-usage')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RoomUsageController {
  constructor(private readonly roomUsageService: RoomUsageService) {}

  @Post()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Create a new room usage (check in)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room usage created successfully',
    type: ResponseRoomUsageDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room request, user, or laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Room request not approved or laboratory unavailable',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room request already has usage',
  })
  async create(
    @Body() createRoomUsageDto: CreateRoomUsageDto,
    @CurrentUser() user: any,
  ): Promise<ResponseRoomUsageDto> {
    if (user?.userId) {
      createRoomUsageDto.checked_in_by = user.userId;
    }
    return this.roomUsageService.create(createRoomUsageDto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({
    summary: 'Get all room usages with pagination, search, and filtering',
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
    description: 'Search by user name or notes',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: UsageStatus,
    description: 'Filter by usage status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room usages retrieved successfully',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: UsageStatus,
  ): Promise<PaginatedResponseDto<ResponseRoomUsageDto>> {
    const { page, limit, search } = paginationDto;
    return this.roomUsageService.findAll(page, limit, search, status);
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Get a room usage by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room usage UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room usage retrieved successfully',
    type: ResponseRoomUsageDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room usage not found',
  })
  async findOne(@Param('id') id: string): Promise<ResponseRoomUsageDto> {
    return this.roomUsageService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'LABORAN')
  @ApiOperation({ summary: 'Update a room usage (check out or update status)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room usage UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room usage updated successfully',
    type: ResponseRoomUsageDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room usage not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or check out validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRoomUsageDto: UpdateRoomUsageDto,
    @CurrentUser() user: any,
  ): Promise<ResponseRoomUsageDto> {
    if (
      (updateRoomUsageDto.status === UsageStatus.CHECKED_OUT ||
        updateRoomUsageDto.check_out_time) &&
      user?.userId
    ) {
      updateRoomUsageDto.checked_out_by = user.userId;
    }
    return this.roomUsageService.update(id, updateRoomUsageDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room usage' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room usage UUID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room usage deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room usage not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete checked out room usage',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.roomUsageService.remove(id);
  }
}
