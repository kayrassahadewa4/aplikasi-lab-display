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
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomRequestService } from './room-request.service.js';
import { CreateRoomRequestDto } from './dto/create-room-request.dto.js';
import { UpdateRoomRequestDto } from './dto/update-room-request.dto.js';
import { ResponseRoomRequestDto } from './dto/response-room-request.dto.js';
import { RoomRequestQueryDto } from './dto/room-request-query.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { RequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Room Requests')
@Controller('room-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RoomRequestController {
  constructor(private readonly roomRequestService: RoomRequestService) {}

  @Post()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Create a new room request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room request created successfully',
    type: ResponseRoomRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Applicant or Laboratory not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate request or schedule conflict',
  })
  async create(
    @CurrentUser() user: any,
    @Body() createRoomRequestDto: CreateRoomRequestDto,
  ): Promise<ResponseRoomRequestDto> {
    // Non-admin roles (DOSEN / LABORAN): ensure applicant_id is set
    if (!createRoomRequestDto.applicant_id || user.role === 'DOSEN' || user.role === 'LABORAN') {
      if (!createRoomRequestDto.applicant_id || user.role === 'DOSEN') {
        createRoomRequestDto.applicant_id = user.userId;
      }
    }
    if (!createRoomRequestDto.status) {
      createRoomRequestDto.status =
        user.role === 'LABORAN' || user.role === 'ADMIN'
          ? RequestStatus.APPROVED
          : RequestStatus.PENDING;
    }
    if (
      (user.role === 'LABORAN' || user.role === 'ADMIN') &&
      createRoomRequestDto.status === RequestStatus.APPROVED &&
      !createRoomRequestDto.approved_by
    ) {
      createRoomRequestDto.approved_by = user.userId;
    }

    return this.roomRequestService.create(createRoomRequestDto);
  }

  @Get()
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({
    summary: 'Get all room requests with pagination, search, and filtering',
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
    description: 'Search by activity, course, or class name',
    example: 'Workshop',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RequestStatus,
    description: 'Filter by request status',
  })
  @ApiQuery({
    name: 'laboratory_id',
    required: false,
    type: String,
    description: 'Filter by laboratory ID',
  })
  @ApiQuery({
    name: 'applicant_id',
    required: false,
    type: String,
    description: 'Filter by applicant ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room requests retrieved successfully',
  })
  async findAll(
    @CurrentUser() user: any,
    @Query() queryDto: RoomRequestQueryDto,
  ): Promise<PaginatedResponseDto<ResponseRoomRequestDto>> {
    const { page, limit, search, status, laboratory_id, unused_only } = queryDto;
    let applicant_id = queryDto.applicant_id;

    // DOSEN can ONLY list their own requests regardless of query parameters
    if (user.role === 'DOSEN') {
      applicant_id = user.userId;
    }

    return this.roomRequestService.findAll(
      page,
      limit,
      search,
      status,
      laboratory_id,
      applicant_id,
      unused_only,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Get a room request by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room request UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room request retrieved successfully',
    type: ResponseRoomRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room request not found',
  })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<ResponseRoomRequestDto> {
    const roomRequest = await this.roomRequestService.findOne(id);

    // DOSEN can ONLY view their own room requests
    if (user.role === 'DOSEN' && roomRequest.applicant_id !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to access this room request',
      );
    }

    return roomRequest;
  }

  @Patch(':id')
  @Roles('ADMIN', 'LABORAN', 'DOSEN')
  @ApiOperation({ summary: 'Update a room request' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room request UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room request updated successfully',
    type: ResponseRoomRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Schedule conflict',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRoomRequestDto: UpdateRoomRequestDto,
  ): Promise<ResponseRoomRequestDto> {
    const existingRequest = await this.roomRequestService.findOne(id);

    if (user.role === 'DOSEN') {
      // Ownership check
      if (existingRequest.applicant_id !== user.userId) {
        throw new ForbiddenException(
          'You do not have permission to modify this room request',
        );
      }

      // Status change restrictions for DOSEN
      if (updateRoomRequestDto.status) {
        if (
          updateRoomRequestDto.status === RequestStatus.APPROVED ||
          updateRoomRequestDto.status === RequestStatus.REJECTED
        ) {
          throw new ForbiddenException(
            'Only administrators can approve or reject room requests',
          );
        }

        if (updateRoomRequestDto.status === RequestStatus.CANCELLED) {
          if (existingRequest.status !== RequestStatus.PENDING) {
            throw new BadRequestException(
              'Only PENDING room requests can be cancelled',
            );
          }
        }
      }

      // If updating other request fields, only allowed while PENDING
      if (existingRequest.status !== RequestStatus.PENDING) {
        throw new BadRequestException(
          'Only PENDING room requests can be modified',
        );
      }

      // Strip administrative and applicant ownership fields for DOSEN
      delete (updateRoomRequestDto as any).applicant_id;
      delete updateRoomRequestDto.approved_by;
      delete updateRoomRequestDto.rejection_reason;
    } else if (user.role === 'ADMIN' || user.role === 'LABORAN') {
      // For Admin/Laboran approvals/rejections: stamp approver if not explicitly supplied
      if (
        (updateRoomRequestDto.status === RequestStatus.APPROVED ||
          updateRoomRequestDto.status === RequestStatus.REJECTED) &&
        !updateRoomRequestDto.approved_by
      ) {
        updateRoomRequestDto.approved_by = user.userId;
      }
    }

    return this.roomRequestService.update(id, updateRoomRequestDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DOSEN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room request' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room request UUID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room request deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room request not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room request has room usage and cannot be deleted',
  })
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    const existingRequest = await this.roomRequestService.findOne(id);

    if (user.role === 'DOSEN') {
      if (existingRequest.applicant_id !== user.userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this room request',
        );
      }

      if (
        existingRequest.status !== RequestStatus.PENDING &&
        existingRequest.status !== RequestStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot delete room requests that have already been approved or rejected',
        );
      }
    }

    return this.roomRequestService.remove(id);
  }
}

