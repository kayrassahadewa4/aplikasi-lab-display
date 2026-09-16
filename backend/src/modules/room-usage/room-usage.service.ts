import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRoomUsageDto } from './dto/create-room-usage.dto.js';
import { UpdateRoomUsageDto } from './dto/update-room-usage.dto.js';
import { ResponseRoomUsageDto } from './dto/response-room-usage.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import {
  Prisma,
  UsageStatus,
  RequestStatus,
  LaboratoryStatus,
} from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class RoomUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // RULE 7: Validate user exists
  private async validateUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }
  }

  // RULE 1: Validate room request is APPROVED
  private async validateRoomRequest(requestId: string): Promise<any> {
    const request = await this.prisma.roomRequest.findUnique({
      where: { id: requestId },
      include: {
        laboratory: true,
      },
    });

    if (!request) {
      throw new NotFoundException(
        `Room request with ID '${requestId}' not found`,
      );
    }

    if (request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException(
        `Room usage can only be created from APPROVED room requests. Current status: ${request.status}`,
      );
    }

    return request;
  }

  // Validate schedule exists and has no active usage in progress
  private async validateSchedule(scheduleId: string): Promise<any> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        laboratory: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        `Schedule with ID '${scheduleId}' not found`,
      );
    }

    const activeUsage = await this.prisma.roomUsage.findFirst({
      where: {
        schedule_id: scheduleId,
        status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
      },
    });

    if (activeUsage) {
      throw new ConflictException(
        'Schedule already has an active room usage in progress',
      );
    }

    return schedule;
  }

  // RULE 2: Validate duplicate usage
  private async validateDuplicateUsage(requestId?: string): Promise<void> {
    if (!requestId) return;

    const existingUsage = await this.prisma.roomUsage.findFirst({
      where: { request_id: requestId },
    });

    if (existingUsage) {
      throw new ConflictException(
        'Room request already has an associated room usage',
      );
    }
  }

  // RULE 3: Validate laboratory status
  private async validateLaboratory(laboratoryId: string): Promise<void> {
    const laboratory = await this.prisma.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory) {
      throw new NotFoundException(
        `Laboratory with ID '${laboratoryId}' not found`,
      );
    }

    if (
      laboratory.status === LaboratoryStatus.CLOSED ||
      laboratory.status === LaboratoryStatus.MAINTENANCE
    ) {
      throw new BadRequestException(
        `Laboratory is currently ${laboratory.status} and cannot be used`,
      );
    }
  }

  // RULE 6: Validate status transition
  private validateStatusTransition(
    oldStatus: UsageStatus,
    newStatus: UsageStatus,
  ): void {
    const allowedTransitions: Record<UsageStatus, UsageStatus[]> = {
      [UsageStatus.CHECKED_IN]: [
        UsageStatus.IN_USE,
        UsageStatus.CHECKED_OUT,
        UsageStatus.CANCELLED,
      ],
      [UsageStatus.IN_USE]: [UsageStatus.CHECKED_OUT, UsageStatus.CANCELLED],
      [UsageStatus.CHECKED_OUT]: [],
      [UsageStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }
  }

  // RULE 8: Validate check out time after check in
  private validateCheckOutTime(
    checkInTime: Date,
    checkOutTime: Date,
  ): void {
    if (checkOutTime <= checkInTime) {
      throw new BadRequestException(
        'Check out time must be later than check in time',
      );
    }
  }

  // RULE 9 & 10: Update laboratory status and create history
  private async updateLaboratoryStatus(
    laboratoryId: string,
    newStatus: LaboratoryStatus,
    usageId: string,
    updatedBy: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const laboratory = await tx.laboratory.findUnique({
        where: { id: laboratoryId },
      });

      if (!laboratory) {
        throw new NotFoundException('Laboratory not found');
      }

      const oldStatus = laboratory.status;

      // Update laboratory status
      await tx.laboratory.update({
        where: { id: laboratoryId },
        data: { status: newStatus },
      });

      // Create laboratory status history
      await tx.laboratoryStatusHistory.create({
        data: {
          laboratory_id: laboratoryId,
          usage_id: usageId,
          updated_by: updatedBy,
          status: newStatus,
        },
      });
    });
  }

  async create(
    createRoomUsageDto: CreateRoomUsageDto,
  ): Promise<ResponseRoomUsageDto> {
    try {
      // RULE 7: Validate user
      if (!createRoomUsageDto.checked_in_by) {
        throw new BadRequestException('checked_in_by is required');
      }
      await this.validateUser(createRoomUsageDto.checked_in_by);

      let laboratoryId = createRoomUsageDto.laboratory_id;
      let targetRequestId = createRoomUsageDto.request_id || null;
      let targetScheduleId = createRoomUsageDto.schedule_id || null;

      if (targetRequestId) {
        // Prioritize request_id if provided
        const request = await this.validateRoomRequest(targetRequestId);
        await this.validateDuplicateUsage(targetRequestId);
        laboratoryId = request.laboratory_id;
        targetScheduleId = null; // Clear scheduleId if both provided
      } else if (targetScheduleId) {
        // From schedule
        const schedule = await this.validateSchedule(targetScheduleId);
        laboratoryId = schedule.laboratory_id;
      } else if (laboratoryId) {
        // Direct / Ad-Hoc Check-in: Create an on-the-fly approved RoomRequest so foreign keys & dashboards are 100% complete
        const lab = await this.prisma.laboratory.findUnique({
          where: { id: laboratoryId },
        });
        if (!lab) {
          throw new NotFoundException(`Laboratory with ID '${laboratoryId}' not found`);
        }

        const now = new Date();
        const checkInDate = new Date(createRoomUsageDto.check_in_time || now);
        const requestDateOnly = new Date(checkInDate);
        requestDateOnly.setHours(0, 0, 0, 0);

        const startTime = new Date(0);
        startTime.setUTCHours(checkInDate.getHours(), checkInDate.getMinutes(), 0, 0);

        const endTime = new Date(0);
        endTime.setUTCHours(Math.min(23, checkInDate.getHours() + 2), checkInDate.getMinutes(), 0, 0);

        const adHocRequest = await this.prisma.roomRequest.create({
          data: {
            applicant_id: createRoomUsageDto.checked_in_by,
            laboratory_id: laboratoryId,
            approved_by: createRoomUsageDto.checked_in_by,
            activity_name: createRoomUsageDto.activity_name?.trim() || 'Direct / Ad-Hoc Session',
            description: createRoomUsageDto.notes?.trim() || 'Direct Ad-Hoc Laboratory Check-in',
            request_date: requestDateOnly,
            start_time: startTime,
            end_time: endTime,
            participant_count: 1,
            status: RequestStatus.APPROVED,
            approved_at: now,
          },
        });
        targetRequestId = adHocRequest.id;
      } else {
        throw new BadRequestException('Please provide a Room Request, Schedule, or select a Target Laboratory for check-in');
      }

      // Validate laboratory status
      if (laboratoryId) {
        await this.validateLaboratory(laboratoryId);
      }

      const checkInTime = new Date(createRoomUsageDto.check_in_time);

      // Create room usage
      const roomUsage = await this.prisma.roomUsage.create({
        data: {
          request_id: targetRequestId,
          schedule_id: targetScheduleId,
          checked_in_by: createRoomUsageDto.checked_in_by,
          check_in_time: checkInTime,
          status: createRoomUsageDto.status,
          notes: createRoomUsageDto.notes,
        },
        include: {
          checkedInBy: {
            select: { id: true, full_name: true, email: true },
          },
          request: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          schedule: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });

      // RULE 9: Update laboratory status to IN_USE after check in
      if (
        laboratoryId &&
        (createRoomUsageDto.status === UsageStatus.CHECKED_IN ||
          createRoomUsageDto.status === UsageStatus.IN_USE) &&
        createRoomUsageDto.checked_in_by
      ) {
        await this.updateLaboratoryStatus(
          laboratoryId,
          LaboratoryStatus.IN_USE,
          roomUsage.id,
          createRoomUsageDto.checked_in_by,
        );
      }

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ROOM_USAGE_CREATED',
        id: roomUsage.id,
        status: roomUsage.status,
      });

      return roomUsage;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create room usage');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    status?: UsageStatus,
  ): Promise<PaginatedResponseDto<ResponseRoomUsageDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.RoomUsageWhereInput = {
        AND: [
          search
            ? {
                OR: [
                  {
                    checkedInBy: {
                      full_name: { contains: search, mode: 'insensitive' },
                    },
                  },
                  { notes: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { status } : {},
        ],
      };

      const [roomUsages, total] = await Promise.all([
        this.prisma.roomUsage.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ check_in_time: 'desc' }],
          include: {
            checkedInBy: {
              select: { id: true, full_name: true, email: true },
            },
            checkedOutBy: {
              select: { id: true, full_name: true, email: true },
            },
            request: {
              include: {
                laboratory: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
            schedule: {
              include: {
                laboratory: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        }),
        this.prisma.roomUsage.count({ where }),
      ]);

      return new PaginatedResponseDto(roomUsages, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch room usages');
    }
  }

  async findOne(id: string): Promise<ResponseRoomUsageDto> {
    try {
      const roomUsage = await this.prisma.roomUsage.findUnique({
        where: { id },
        include: {
          checkedInBy: {
            select: { id: true, full_name: true, email: true },
          },
          checkedOutBy: {
            select: { id: true, full_name: true, email: true },
          },
          request: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          schedule: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });

      if (!roomUsage) {
        throw new NotFoundException(`Room usage with ID '${id}' not found`);
      }

      return roomUsage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch room usage');
    }
  }

  async update(
    id: string,
    updateRoomUsageDto: UpdateRoomUsageDto,
  ): Promise<ResponseRoomUsageDto> {
    try {
      const existingUsage = await this.findOne(id);

      // RULE 6: Validate status transition
      if (updateRoomUsageDto.status) {
        this.validateStatusTransition(
          existingUsage.status,
          updateRoomUsageDto.status,
        );
      }

      // RULE 5: Validate check out
      if (updateRoomUsageDto.check_out_time) {
        if (!existingUsage.check_in_time) {
          throw new BadRequestException(
            'Cannot check out without checking in first',
          );
        }

        if (existingUsage.check_out_time) {
          throw new BadRequestException('Already checked out');
        }

        const checkOutTime = new Date(updateRoomUsageDto.check_out_time);
        this.validateCheckOutTime(existingUsage.check_in_time, checkOutTime);
      }

      // RULE 7: Validate checked out by user
      if (updateRoomUsageDto.checked_out_by) {
        await this.validateUser(updateRoomUsageDto.checked_out_by);
      }

      const updateData: any = {};
      if (updateRoomUsageDto.checked_out_by !== undefined) {
        updateData.checked_out_by = updateRoomUsageDto.checked_out_by;
      }
      if (updateRoomUsageDto.check_out_time !== undefined) {
        updateData.check_out_time = new Date(updateRoomUsageDto.check_out_time);
      }
      if (updateRoomUsageDto.status !== undefined) {
        updateData.status = updateRoomUsageDto.status;
      }
      if (updateRoomUsageDto.notes !== undefined) {
        updateData.notes = updateRoomUsageDto.notes;
      }

      const roomUsage = await this.prisma.roomUsage.update({
        where: { id },
        data: updateData,
        include: {
          checkedInBy: {
            select: { id: true, full_name: true, email: true },
          },
          checkedOutBy: {
            select: { id: true, full_name: true, email: true },
          },
          request: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          schedule: {
            include: {
              laboratory: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });

      // RULE 9: Update laboratory status to AVAILABLE after check out
      const laboratoryId =
        roomUsage.request?.laboratory_id || roomUsage.schedule?.laboratory_id;
      const updatedBy =
        updateRoomUsageDto.checked_out_by || roomUsage.checked_in_by;

      if (
        updateRoomUsageDto.status === UsageStatus.CHECKED_OUT &&
        laboratoryId &&
        updatedBy
      ) {
        await this.updateLaboratoryStatus(
          laboratoryId,
          LaboratoryStatus.AVAILABLE,
          roomUsage.id,
          updatedBy,
        );
      }

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ROOM_USAGE_UPDATED',
        id: roomUsage.id,
        status: roomUsage.status,
      });

      return roomUsage;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update room usage');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const roomUsage = await this.findOne(id);

      // RULE 11: Prevent deletion after CHECKED_OUT
      if (roomUsage.status === UsageStatus.CHECKED_OUT) {
        throw new BadRequestException(
          'Cannot delete room usage that has been checked out',
        );
      }

      // Delete associated laboratory status history entries first (FK constraint)
      await this.prisma.laboratoryStatusHistory.deleteMany({
        where: { usage_id: id },
      });

      await this.prisma.roomUsage.delete({
        where: { id },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ROOM_USAGE_DELETED',
        id,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete room usage');
    }
  }

  // RULE 12: Internal query methods
  async findActive(): Promise<ResponseRoomUsageDto[]> {
    return this.prisma.roomUsage.findMany({
      where: {
        status: { in: [UsageStatus.CHECKED_IN, UsageStatus.IN_USE] },
      },
      orderBy: [{ check_in_time: 'desc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
        schedule: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async findCheckedIn(): Promise<ResponseRoomUsageDto[]> {
    return this.prisma.roomUsage.findMany({
      where: { status: UsageStatus.CHECKED_IN },
      orderBy: [{ check_in_time: 'desc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async findCheckedOut(): Promise<ResponseRoomUsageDto[]> {
    return this.prisma.roomUsage.findMany({
      where: { status: UsageStatus.CHECKED_OUT },
      orderBy: [{ check_out_time: 'desc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        checkedOutBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async findToday(): Promise<ResponseRoomUsageDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.roomUsage.findMany({
      where: {
        check_in_time: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: [{ check_in_time: 'asc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        checkedOutBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async findByLaboratory(laboratoryId: string): Promise<ResponseRoomUsageDto[]> {
    return this.prisma.roomUsage.findMany({
      where: {
        OR: [
          { request: { laboratory_id: laboratoryId } },
          { schedule: { laboratory_id: laboratoryId } },
        ],
      },
      orderBy: [{ check_in_time: 'desc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        checkedOutBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
        schedule: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async findByUser(userId: string): Promise<ResponseRoomUsageDto[]> {
    return this.prisma.roomUsage.findMany({
      where: {
        OR: [{ checked_in_by: userId }, { checked_out_by: userId }],
      },
      orderBy: [{ check_in_time: 'desc' }],
      include: {
        checkedInBy: { select: { id: true, full_name: true, email: true } },
        checkedOutBy: { select: { id: true, full_name: true, email: true } },
        request: {
          include: {
            laboratory: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }
}
