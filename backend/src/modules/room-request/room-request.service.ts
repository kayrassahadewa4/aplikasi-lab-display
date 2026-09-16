import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateRoomRequestDto } from './dto/create-room-request.dto.js';
import { UpdateRoomRequestDto } from './dto/update-room-request.dto.js';
import { ResponseRoomRequestDto } from './dto/response-room-request.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import {
  Prisma,
  RequestStatus,
  UsageStatus,
  CalendarStatus,
  LaboratoryStatus,
  ScheduleStatus,
  UserStatus,
} from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class RoomRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private parseTime(timeString: string): Date {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date(0);
    date.setUTCHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private compareTime(time1: Date, time2: Date): number {
    const hours1 = time1.getUTCHours();
    const minutes1 = time1.getUTCMinutes();
    const seconds1 = time1.getUTCSeconds();
    const hours2 = time2.getUTCHours();
    const minutes2 = time2.getUTCMinutes();
    const seconds2 = time2.getUTCSeconds();
    const totalSeconds1 = hours1 * 3600 + minutes1 * 60 + seconds1;
    const totalSeconds2 = hours2 * 3600 + minutes2 * 60 + seconds2;
    return totalSeconds1 - totalSeconds2;
  }

  private formatTime(time: Date): string {
    const hours = String(time.getUTCHours()).padStart(2, '0');
    const minutes = String(time.getUTCMinutes()).padStart(2, '0');
    const seconds = String(time.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  // RULE 6: Time Validation
  private validateTime(startTime: Date, endTime: Date): void {
    if (this.compareTime(startTime, endTime) >= 0) {
      throw new BadRequestException(
        'Start time must be earlier than end time',
      );
    }
  }

  // RULE 1: Validate applicant exists
  private async validateApplicant(applicantId: string): Promise<void> {
    const applicant = await this.prisma.user.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new NotFoundException(
        `Applicant with ID '${applicantId}' not found`,
      );
    }

    if (applicant.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Applicant account is inactive');
    }
  }

  // RULE 2: Validate laboratory exists and is not CLOSED or MAINTENANCE
  private async validateLaboratory(laboratoryId: string): Promise<{ id: string; maximum_capacity: number }> {
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
        `Laboratory is currently ${laboratory.status} and cannot be requested`,
      );
    }

    return laboratory;
  }

  // RULE 4: Validate participant count does not exceed laboratory capacity
  private validateParticipantCount(
    participantCount: number,
    maximumCapacity: number,
  ): void {
    if (participantCount > maximumCapacity) {
      throw new BadRequestException(
        `Participant count (${participantCount}) exceeds laboratory maximum capacity (${maximumCapacity})`,
      );
    }
  }

  // RULE 3 & 7: Validate date is within academic calendar and not in the past
  private async validateAcademicCalendarAndDate(
    requestDate: Date,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestDateOnly = new Date(requestDate);
    requestDateOnly.setHours(0, 0, 0, 0);

    // RULE 7: Date must not be in the past
    if (requestDateOnly < today) {
      throw new BadRequestException('Request date cannot be in the past');
    }

    // RULE 3: Check academic calendar (optional fallback: allow ad-hoc/inter-semester bookings if no active calendar period)
    const activeCalendar = await this.prisma.academicCalendar.findFirst({
      where: {
        status: CalendarStatus.ACTIVE,
        start_date: { lte: requestDate },
        end_date: { gte: requestDate },
      },
    });

    // If no active calendar is defined, allow request as ad-hoc/inter-semester booking
  }

  // RULE 5: Validate operational hours with smart campus default fallback (07:00 - 22:00)
  private async validateOperationalHour(
    laboratoryId: string,
    requestDate: Date,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const dayOfWeek = this.getDayOfWeek(requestDate);

    const operationalHour = await this.prisma.operationalHour.findFirst({
      where: {
        laboratory_id: laboratoryId,
        day_of_week: dayOfWeek,
      },
    });

    // Flexible campus operational window (06:00 - 23:59) allows academic room requests to be submitted.
    // Laboran and department approvers review and approve requests based on laboratory policy.
    const campusOpen = this.parseTime('06:00:00');
    const campusClose = this.parseTime('23:59:59');

    const scheduleStart = this.compareTime(startTime, campusOpen);
    const scheduleEnd = this.compareTime(endTime, campusClose);

    if (scheduleStart < 0 || scheduleEnd > 0) {
      throw new BadRequestException(
        `Waktu peminjaman harus berada dalam jam operasional kampus (06:00 - 23:59)`,
      );
    }
  }

  // RULE 8: Validate duplicate request
  private async validateDuplicateRequest(
    applicantId: string,
    laboratoryId: string,
    requestDate: Date,
    startTime: Date,
    endTime: Date,
    excludeRequestId?: string,
  ): Promise<void> {
    const duplicateRequest = await this.prisma.roomRequest.findFirst({
      where: {
        applicant_id: applicantId,
        laboratory_id: laboratoryId,
        request_date: requestDate,
        start_time: startTime,
        end_time: endTime,
        status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
        ...(excludeRequestId ? { NOT: { id: excludeRequestId } } : {}),
      },
    });

    if (duplicateRequest) {
      throw new ConflictException(
        `Duplicate request found for same laboratory, date, and time with status ${duplicateRequest.status}`,
      );
    }
  }

  // RULE 9: Validate conflict with approved requests
  private async validateConflictWithApprovedRequests(
    laboratoryId: string,
    requestDate: Date,
    startTime: Date,
    endTime: Date,
    excludeRequestId?: string,
  ): Promise<void> {
    const approvedRequests = await this.prisma.roomRequest.findMany({
      where: {
        laboratory_id: laboratoryId,
        request_date: requestDate,
        status: RequestStatus.APPROVED,
        ...(excludeRequestId ? { NOT: { id: excludeRequestId } } : {}),
      },
    });

    for (const request of approvedRequests) {
      const newStart = this.compareTime(startTime, request.end_time);
      const newEnd = this.compareTime(endTime, request.start_time);

      if (newStart < 0 && newEnd > 0) {
        throw new ConflictException(
          `Request conflicts with approved request '${request.activity_name}' (${this.formatTime(request.start_time)} - ${this.formatTime(request.end_time)})`,
        );
      }
    }
  }

  // RULE 10: Validate conflict with fixed schedule
  private async validateConflictWithSchedule(
    laboratoryId: string,
    requestDate: Date,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const dayOfWeek = this.getDayOfWeek(requestDate);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        laboratory_id: laboratoryId,
        day_of_week: dayOfWeek,
        status: { not: ScheduleStatus.CANCELLED },
      },
    });

    for (const schedule of schedules) {
      const newStart = this.compareTime(startTime, schedule.end_time);
      const newEnd = this.compareTime(endTime, schedule.start_time);

      if (newStart < 0 && newEnd > 0) {
        throw new ConflictException(
          `Request conflicts with fixed schedule '${schedule.course_name}' (${this.formatTime(schedule.start_time)} - ${this.formatTime(schedule.end_time)})`,
        );
      }
    }
  }

  // RULE 11: Validate status transition
  private validateStatusTransition(
    oldStatus: RequestStatus,
    newStatus: RequestStatus,
  ): void {
    const invalidTransitions = [
      [RequestStatus.APPROVED, RequestStatus.PENDING],
      [RequestStatus.REJECTED, RequestStatus.APPROVED],
      [RequestStatus.REJECTED, RequestStatus.PENDING],
      [RequestStatus.CANCELLED, RequestStatus.APPROVED],
      [RequestStatus.CANCELLED, RequestStatus.PENDING],
    ];

    for (const [from, to] of invalidTransitions) {
      if (oldStatus === from && newStatus === to) {
        throw new BadRequestException(
          `Invalid status transition from ${from} to ${to}`,
        );
      }
    }
  }

  async create(
    createRoomRequestDto: CreateRoomRequestDto,
  ): Promise<ResponseRoomRequestDto> {
    try {
      const startTime = this.parseTime(createRoomRequestDto.start_time);
      const endTime = this.parseTime(createRoomRequestDto.end_time);

      // RULE 6: Time validation
      this.validateTime(startTime, endTime);

      if (!createRoomRequestDto.applicant_id) {
        throw new BadRequestException('Applicant ID is required');
      }
      const applicantId = createRoomRequestDto.applicant_id;

      // RULE 1: Validate applicant
      await this.validateApplicant(applicantId);

      // RULE 2 & 4: Validate laboratory and capacity
      const laboratory = await this.validateLaboratory(createRoomRequestDto.laboratory_id);
      this.validateParticipantCount(
        createRoomRequestDto.participant_count,
        laboratory.maximum_capacity,
      );

      const isRecurring = Boolean(createRoomRequestDto.is_recurring);
      const occurrences = isRecurring
        ? Math.min(Math.max(Number(createRoomRequestDto.occurrences) || 16, 1), 24)
        : 1;

      // Parse base date components cleanly to avoid timezone/day drift
      const dateParts = (
        typeof createRoomRequestDto.request_date === 'string'
          ? createRoomRequestDto.request_date
          : new Date(createRoomRequestDto.request_date).toISOString().split('T')[0]
      ).split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      const targetDates: Date[] = [];
      for (let i = 0; i < occurrences; i++) {
        // Set at midday 12:00:00 to prevent timezone shifts across week additions
        const targetDate = new Date(year, month, day + i * 7, 12, 0, 0);
        targetDates.push(targetDate);
      }

      // Multi-date pre-validation (All-or-Nothing validation across all weekly meetings)
      for (let i = 0; i < targetDates.length; i++) {
        const checkDate = targetDates[i];
        const dateStr = new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(checkDate);
        const meetingPrefix = occurrences > 1 ? `Pertemuan ke-${i + 1} (${dateStr})` : `Tanggal ${dateStr}`;

        try {
          // RULE 3 & 7: Validate academic calendar and date not in past
          await this.validateAcademicCalendarAndDate(checkDate);

          // RULE 5: Validate operational hours
          await this.validateOperationalHour(
            createRoomRequestDto.laboratory_id,
            checkDate,
            startTime,
            endTime,
          );

          // RULE 8: Validate duplicate request
          await this.validateDuplicateRequest(
            applicantId,
            createRoomRequestDto.laboratory_id,
            checkDate,
            startTime,
            endTime,
          );

          // RULE 9: Validate conflict with approved requests
          await this.validateConflictWithApprovedRequests(
            createRoomRequestDto.laboratory_id,
            checkDate,
            startTime,
            endTime,
          );

          // RULE 10: Validate conflict with schedule
          await this.validateConflictWithSchedule(
            createRoomRequestDto.laboratory_id,
            checkDate,
            startTime,
            endTime,
          );
        } catch (err: any) {
          if (
            err instanceof ConflictException ||
            err instanceof BadRequestException
          ) {
            throw new ConflictException(
              `Bentrok pada ${meetingPrefix}: ${err.message}. Mohon periksa kembali jadwal atau pilih waktu/ruangan lain.`,
            );
          }
          throw err;
        }
      }

      const isApproved = createRoomRequestDto.status === RequestStatus.APPROVED;
      const approvedAt = isApproved ? new Date() : null;
      const initialStatus = createRoomRequestDto.status || RequestStatus.PENDING;

      if (occurrences > 1) {
        // Batch creation within Prisma transaction for 16x recurring requests
        const createdRequests = await this.prisma.$transaction(
          targetDates.map((targetDate, i) => {
            const meetingSuffix = `(Pertemuan ${i + 1}/${occurrences})`;
            const meetingDesc = `${createRoomRequestDto.description}\n[Jadwal Mingguan Terjadwal: Pertemuan ${i + 1} dari ${occurrences}]`;

            return this.prisma.roomRequest.create({
              data: {
                applicant_id: applicantId,
                laboratory_id: createRoomRequestDto.laboratory_id,
                approved_by: createRoomRequestDto.approved_by || null,
                approved_at: approvedAt,
                activity_name: `${createRoomRequestDto.activity_name} ${meetingSuffix}`,
                course_name: createRoomRequestDto.course_name,
                class_name: createRoomRequestDto.class_name,
                description: meetingDesc,
                request_date: targetDate,
                start_time: startTime,
                end_time: endTime,
                participant_count: createRoomRequestDto.participant_count,
                status: initialStatus,
              },
              include: {
                applicant: {
                  select: { id: true, full_name: true, email: true, avatar_url: true },
                },
                laboratory: {
                  select: { id: true, code: true, name: true },
                },
              },
            });
          }),
        );

        const primaryRequest = createdRequests[0];

        // Trigger system notification to Admins & Laboran
        try {
          const lecturerName = primaryRequest.applicant?.full_name || 'Dosen Pengajar';
          await this.notificationsService.notifyAdminsAndLaboran(
            'Permohonan Jadwal Mingguan Baru (16x Pertemuan)',
            `Dosen ${lecturerName} mengajukan jadwal mingguan (${occurrences}x pertemuan) untuk "${createRoomRequestDto.activity_name}" di ${primaryRequest.laboratory.name}.`,
            'requests',
            `/laboran/room-requests/${primaryRequest.id}`,
          );
        } catch (err) {
          console.warn('Failed to send recurring request creation notification:', err);
        }

        this.eventsGateway.emitDisplayUpdate('display:sync', {
          type: 'ROOM_REQUEST_CREATED',
          id: primaryRequest.id,
          recurring: true,
          count: createdRequests.length,
        });

        return primaryRequest;
      }

      // Single-date creation (one-off / ad-hoc / rapat)
      const singleDate = targetDates[0];
      const roomRequest = await this.prisma.roomRequest.create({
        data: {
          applicant_id: applicantId,
          laboratory_id: createRoomRequestDto.laboratory_id,
          approved_by: createRoomRequestDto.approved_by || null,
          approved_at: approvedAt,
          activity_name: createRoomRequestDto.activity_name,
          course_name: createRoomRequestDto.course_name,
          class_name: createRoomRequestDto.class_name,
          description: createRoomRequestDto.description,
          request_date: singleDate,
          start_time: startTime,
          end_time: endTime,
          participant_count: createRoomRequestDto.participant_count,
          status: initialStatus,
        },
        include: {
          applicant: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          laboratory: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      // Trigger automatic system notification to Admins & Laboran
      try {
        const reqDate =
          typeof createRoomRequestDto.request_date === 'string'
            ? createRoomRequestDto.request_date
            : new Date(roomRequest.request_date).toISOString().split('T')[0];
        const lecturerName = roomRequest.applicant?.full_name || 'Dosen';
        await this.notificationsService.notifyAdminsAndLaboran(
          'Permohonan Pinjam Ruangan Baru',
          `Dosen ${lecturerName} mengajukan pinjam ${roomRequest.laboratory.name} untuk "${createRoomRequestDto.activity_name}" pada ${reqDate}.`,
          'requests',
          `/laboran/room-requests/${roomRequest.id}`,
        );
      } catch (err) {
        console.warn('Failed to send request creation notification:', err);
      }

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ROOM_REQUEST_CREATED',
        id: roomRequest.id,
      });

      return roomRequest;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat permohonan pinjam ruangan');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    status?: RequestStatus,
    laboratory_id?: string,
    applicant_id?: string,
    unused_only?: boolean,
  ): Promise<PaginatedResponseDto<ResponseRoomRequestDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.RoomRequestWhereInput = {
        AND: [
          search
            ? {
                OR: [
                  { activity_name: { contains: search, mode: 'insensitive' } },
                  { course_name: { contains: search, mode: 'insensitive' } },
                  { class_name: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { status } : {},
          laboratory_id ? { laboratory_id } : {},
          applicant_id ? { applicant_id } : {},
          unused_only
            ? {
                roomUsages: {
                  none: {
                    status: { not: UsageStatus.CANCELLED },
                  },
                },
              }
            : {},
        ],
      };

      const [roomRequests, total] = await Promise.all([
        this.prisma.roomRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ request_date: 'desc' }, { start_time: 'asc' }],
          include: {
            applicant: {
              select: { id: true, full_name: true, email: true, avatar_url: true },
            },
            approver: {
              select: { id: true, full_name: true, email: true, avatar_url: true },
            },
            laboratory: {
              select: { id: true, code: true, name: true },
            },
          },
        }),
        this.prisma.roomRequest.count({ where }),
      ]);

      return new PaginatedResponseDto(roomRequests, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch room requests');
    }
  }

  async findOne(id: string): Promise<ResponseRoomRequestDto> {
    try {
      const roomRequest = await this.prisma.roomRequest.findUnique({
        where: { id },
        include: {
          applicant: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          approver: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          laboratory: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      if (!roomRequest) {
        throw new NotFoundException(`Room request with ID '${id}' not found`);
      }

      return roomRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch room request');
    }
  }

  async update(
    id: string,
    updateRoomRequestDto: UpdateRoomRequestDto,
  ): Promise<ResponseRoomRequestDto> {
    try {
      const existingRequest = await this.findOne(id);

      const requestDate = updateRoomRequestDto.request_date
        ? new Date(updateRoomRequestDto.request_date)
        : existingRequest.request_date;
      const startTime = updateRoomRequestDto.start_time
        ? this.parseTime(updateRoomRequestDto.start_time)
        : existingRequest.start_time;
      const endTime = updateRoomRequestDto.end_time
        ? this.parseTime(updateRoomRequestDto.end_time)
        : existingRequest.end_time;

      // RULE 6: Time validation
      this.validateTime(startTime, endTime);

      // RULE 11: Validate status transition
      if (updateRoomRequestDto.status) {
        this.validateStatusTransition(
          existingRequest.status,
          updateRoomRequestDto.status,
        );
      }

      // RULE 3 & 7: Validate date if changed
      if (updateRoomRequestDto.request_date) {
        await this.validateAcademicCalendarAndDate(requestDate);
      }

      // RULE 5: Validate operational hours if date/time changed
      if (
        updateRoomRequestDto.request_date ||
        updateRoomRequestDto.start_time ||
        updateRoomRequestDto.end_time
      ) {
        await this.validateOperationalHour(
          existingRequest.laboratory_id,
          requestDate,
          startTime,
          endTime,
        );
      }

      // RULE 9: Validate conflict with approved requests if date/time changed OR when approving
      if (
        updateRoomRequestDto.status === RequestStatus.APPROVED ||
        updateRoomRequestDto.request_date ||
        updateRoomRequestDto.start_time ||
        updateRoomRequestDto.end_time
      ) {
        await this.validateConflictWithApprovedRequests(
          existingRequest.laboratory_id,
          requestDate,
          startTime,
          endTime,
          id,
        );
      }

      // RULE 10: Validate conflict with schedule if date/time changed OR when approving
      if (
        updateRoomRequestDto.status === RequestStatus.APPROVED ||
        updateRoomRequestDto.request_date ||
        updateRoomRequestDto.start_time ||
        updateRoomRequestDto.end_time
      ) {
        await this.validateConflictWithSchedule(
          existingRequest.laboratory_id,
          requestDate,
          startTime,
          endTime,
        );
      }

      // Validate rejection reason when rejecting
      if (updateRoomRequestDto.status === RequestStatus.REJECTED) {
        if (!updateRoomRequestDto.rejection_reason || !updateRoomRequestDto.rejection_reason.trim()) {
          throw new BadRequestException('Rejection reason is required when rejecting a room request');
        }
      }

      const updateData: any = {};
      if (updateRoomRequestDto.activity_name !== undefined) {
        updateData.activity_name = updateRoomRequestDto.activity_name;
      }
      if (updateRoomRequestDto.course_name !== undefined) {
        updateData.course_name = updateRoomRequestDto.course_name;
      }
      if (updateRoomRequestDto.class_name !== undefined) {
        updateData.class_name = updateRoomRequestDto.class_name;
      }
      if (updateRoomRequestDto.description !== undefined) {
        updateData.description = updateRoomRequestDto.description;
      }
      if (updateRoomRequestDto.request_date !== undefined) {
        updateData.request_date = requestDate;
      }
      if (updateRoomRequestDto.start_time !== undefined) {
        updateData.start_time = startTime;
      }
      if (updateRoomRequestDto.end_time !== undefined) {
        updateData.end_time = endTime;
      }
      if (updateRoomRequestDto.participant_count !== undefined) {
        updateData.participant_count = updateRoomRequestDto.participant_count;
      }
      if (updateRoomRequestDto.status !== undefined) {
        updateData.status = updateRoomRequestDto.status;
        if (updateRoomRequestDto.status === RequestStatus.APPROVED) {
          updateData.approved_at = new Date();
        }
      }
      if (updateRoomRequestDto.approved_by !== undefined) {
        updateData.approved_by = updateRoomRequestDto.approved_by;
      }
      if (updateRoomRequestDto.rejection_reason !== undefined) {
        updateData.rejection_reason = updateRoomRequestDto.rejection_reason;
      }

      const roomRequest = await this.prisma.roomRequest.update({
        where: { id },
        data: updateData,
        include: {
          applicant: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          approver: {
            select: { id: true, full_name: true, email: true, avatar_url: true },
          },
          laboratory: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      // Trigger notification to applicant and staff on status update
      if (updateRoomRequestDto.status === RequestStatus.APPROVED) {
        try {
          const approverName = roomRequest.approver?.full_name || 'Staff';
          const reqDate = new Date(roomRequest.request_date).toISOString().split('T')[0];

          // 1. Notify the Applicant (Lecturer)
          await this.notificationsService.create({
            user_id: roomRequest.applicant_id,
            title: 'Permohonan Pinjam Ruang Disetujui',
            message: `Permohonan pinjam ${roomRequest.laboratory.name} ("${roomRequest.activity_name}") pada tanggal ${reqDate} telah disetujui oleh ${approverName}.`,
            category: 'requests',
            link_url: `/lecturer/room-requests/${roomRequest.id}`,
          });

          // 2. Notify other staff for transparency
          await this.notificationsService.notifyAdminsAndLaboran(
            'Permohonan Pinjam Ruang Disetujui',
            `Permohonan untuk ${roomRequest.laboratory.name} oleh ${roomRequest.applicant.full_name} telah disetujui oleh ${approverName}.`,
            'requests',
            `/laboran/room-requests/${roomRequest.id}`,
          );
        } catch (err) {
          console.warn('Failed to send approval notification:', err);
        }
      } else if (updateRoomRequestDto.status === RequestStatus.REJECTED) {
        try {
          const reasonText =
            updateRoomRequestDto.rejection_reason ||
            roomRequest.rejection_reason ||
            'Prioritas penjadwalan laboratorium';
          const reqDate = new Date(roomRequest.request_date).toISOString().split('T')[0];

          await this.notificationsService.create({
            user_id: roomRequest.applicant_id,
            title: 'Permohonan Pinjam Ruang Ditolak',
            message: `Permohonan pinjam ${roomRequest.laboratory.name} pada tanggal ${reqDate} ditolak. Alasan: ${reasonText}`,
            category: 'requests',
            link_url: `/lecturer/room-requests/${roomRequest.id}`,
          });
        } catch (err) {
          console.warn('Failed to send rejection notification:', err);
        }
      } else if (updateRoomRequestDto.status === RequestStatus.CANCELLED) {
        try {
          await this.notificationsService.notifyAdminsAndLaboran(
            'Permohonan Pinjam Dibatalkan',
            `Reservasi ${roomRequest.laboratory.name} oleh ${roomRequest.applicant.full_name} telah dibatalkan oleh pemohon.`,
            'requests',
            `/laboran/room-requests/${roomRequest.id}`,
          );
        } catch (err) {
          console.warn('Failed to send cancellation notification:', err);
        }
      }

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ROOM_REQUEST_STATUS_UPDATED',
        id: roomRequest.id,
        status: roomRequest.status,
      });

      return roomRequest;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update room request');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);

      // RULE 12: Check if request has room usage
      const roomUsageCount = await this.prisma.roomUsage.count({
        where: { request_id: id },
      });

      if (roomUsageCount > 0) {
        throw new ConflictException(
          `Cannot delete room request. It has ${roomUsageCount} room usage(s)`,
        );
      }

      await this.prisma.roomRequest.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete room request');
    }
  }

  // RULE 13: Reusable query methods
  async findPending(): Promise<ResponseRoomRequestDto[]> {
    return this.prisma.roomRequest.findMany({
      where: { status: RequestStatus.PENDING },
      orderBy: [{ request_date: 'asc' }, { start_time: 'asc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findApproved(): Promise<ResponseRoomRequestDto[]> {
    return this.prisma.roomRequest.findMany({
      where: { status: RequestStatus.APPROVED },
      orderBy: [{ request_date: 'desc' }, { start_time: 'asc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        approver: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findRejected(): Promise<ResponseRoomRequestDto[]> {
    return this.prisma.roomRequest.findMany({
      where: { status: RequestStatus.REJECTED },
      orderBy: [{ updated_at: 'desc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        approver: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findByApplicant(applicantId: string): Promise<ResponseRoomRequestDto[]> {
    return this.prisma.roomRequest.findMany({
      where: { applicant_id: applicantId },
      orderBy: [{ request_date: 'desc' }, { start_time: 'asc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        approver: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findByLaboratory(laboratoryId: string): Promise<ResponseRoomRequestDto[]> {
    return this.prisma.roomRequest.findMany({
      where: { laboratory_id: laboratoryId },
      orderBy: [{ request_date: 'desc' }, { start_time: 'asc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        approver: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findToday(): Promise<ResponseRoomRequestDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.roomRequest.findMany({
      where: {
        request_date: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      },
      orderBy: [{ start_time: 'asc' }],
      include: {
        applicant: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        approver: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        laboratory: { select: { id: true, code: true, name: true } },
      },
    });
  }
}
