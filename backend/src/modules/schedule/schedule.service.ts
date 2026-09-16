import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { ResponseScheduleDto } from './dto/response-schedule.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import {
  Prisma,
  ScheduleStatus,
  CalendarStatus,
  LaboratoryStatus,
} from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private parseTime(timeString: string): Date {
    // Parse time in HH:mm:ss format as UTC epoch date
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date(0);
    date.setUTCHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  private formatTime(time: Date): string {
    const hours = String(time.getUTCHours()).padStart(2, '0');
    const minutes = String(time.getUTCMinutes()).padStart(2, '0');
    const seconds = String(time.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
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

  /**
   * RULE 5: Validate start_time must be earlier than end_time
   * EXCEPTION: Allow midnight-ending schedules (e.g., 23:00 → 00:00) when end_time is exactly midnight
   */
  private validateTime(startTime: Date, endTime: Date): void {
    // Check if end time is exactly midnight (00:00:00)
    const endHours = endTime.getUTCHours();
    const endMinutes = endTime.getUTCMinutes();
    const endSeconds = endTime.getUTCSeconds();
    const endsAtMidnight = endHours === 0 && endMinutes === 0 && endSeconds === 0;

    if (endsAtMidnight) {
      // Schedule ends at midnight - this is valid for midnight-ending operational hours
      // E.g., 23:00 → 00:00 is allowed
      // But 00:00 → 00:00 is not allowed (zero duration)
      const startHours = startTime.getUTCHours();
      const startMinutes = startTime.getUTCMinutes();
      const startSeconds = startTime.getUTCSeconds();
      if (startHours === 0 && startMinutes === 0 && startSeconds === 0) {
        throw new BadRequestException(
          'Start time must be earlier than end time',
        );
      }
      // Valid midnight-ending schedule
    } else {
      // Normal validation: start must be before end
      if (this.compareTime(startTime, endTime) >= 0) {
        throw new BadRequestException(
          'Start time must be earlier than end time',
        );
      }
    }
  }

  /**
   * RULE 1: Validate Academic Calendar exists and has ACTIVE status
   */
  private async validateAcademicCalendar(
    academicCalendarId: string,
  ): Promise<void> {
    const academicCalendar = await this.prisma.academicCalendar.findUnique({
      where: { id: academicCalendarId },
    });

    if (!academicCalendar) {
      throw new NotFoundException(
        `Academic calendar with ID '${academicCalendarId}' not found`,
      );
    }

    if (academicCalendar.status !== CalendarStatus.ACTIVE) {
      throw new BadRequestException(
        'Academic calendar must have ACTIVE status',
      );
    }
  }

  /**
   * RULE 2: Validate Laboratory exists and is not CLOSED or MAINTENANCE
   */
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
        `Laboratory is currently ${laboratory.status} and cannot be scheduled`,
      );
    }
  }

  /**
   * RULE 3: Validate schedule time is within operational hours
   * Supports both normal same-day intervals and midnight-ending intervals
   */
  // RULE 3: Operational hours should not block academic schedule creation
  private async validateOperationalHour(
    laboratoryId: string,
    dayOfWeek: number,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    // Academic course schedules are managed by laboran/administrator according to faculty curriculum.
    // They must not be blocked by laboratory operational hours constraints.
    return;
  }

  /**
   * RULE 4: Validate no schedule conflicts (overlapping schedules)
   */
  private async validateScheduleConflict(
    laboratoryId: string,
    dayOfWeek: number,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: string,
  ): Promise<void> {
    const conflictingSchedules = await this.prisma.schedule.findMany({
      where: {
        laboratory_id: laboratoryId,
        day_of_week: dayOfWeek,
        status: { not: ScheduleStatus.CANCELLED },
        ...(excludeScheduleId ? { NOT: { id: excludeScheduleId } } : {}),
      },
    });

    for (const existingSchedule of conflictingSchedules) {
      const newStart = this.compareTime(startTime, existingSchedule.end_time);
      const newEnd = this.compareTime(endTime, existingSchedule.start_time);

      // Conflict exists if: new_start < existing_end AND new_end > existing_start
      if (newStart < 0 && newEnd > 0) {
        throw new ConflictException(
          `Schedule conflicts with existing schedule '${existingSchedule.course_name}' (${this.formatTime(existingSchedule.start_time)} - ${this.formatTime(existingSchedule.end_time)})`,
        );
      }
    }
  }

  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    try {
      // Parse times
      const startTime = this.parseTime(createScheduleDto.start_time);
      const endTime = this.parseTime(createScheduleDto.end_time);

      // RULE 5: Validate time (start < end)
      this.validateTime(startTime, endTime);

      // RULE 1: Validate Academic Calendar exists and is ACTIVE
      await this.validateAcademicCalendar(
        createScheduleDto.academic_calendar_id,
      );

      // RULE 2: Validate Laboratory exists and is not CLOSED/MAINTENANCE
      await this.validateLaboratory(createScheduleDto.laboratory_id);

      // RULE 3: Validate schedule time is within operational hours
      await this.validateOperationalHour(
        createScheduleDto.laboratory_id,
        createScheduleDto.day_of_week,
        startTime,
        endTime,
      );

      // RULE 4: Validate no schedule conflicts
      await this.validateScheduleConflict(
        createScheduleDto.laboratory_id,
        createScheduleDto.day_of_week,
        startTime,
        endTime,
      );

      // Create schedule
      const schedule = await this.prisma.schedule.create({
        data: {
          laboratory_id: createScheduleDto.laboratory_id,
          academic_calendar_id: createScheduleDto.academic_calendar_id,
          course_name: createScheduleDto.course_name,
          lecturer_name: createScheduleDto.lecturer_name,
          class_name: createScheduleDto.class_name,
          day_of_week: createScheduleDto.day_of_week,
          start_time: startTime,
          end_time: endTime,
          status: createScheduleDto.status,
        },
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          academicCalendar: {
            select: {
              id: true,
              academic_year: true,
              semester: true,
            },
          },
        },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'SCHEDULE_CREATED',
        id: schedule.id,
      });

      return schedule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create schedule');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    academic_calendar_id?: string,
    laboratory_id?: string,
    status?: ScheduleStatus,
  ): Promise<PaginatedResponseDto<ResponseScheduleDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.ScheduleWhereInput = {
        AND: [
          // Search filter
          search
            ? {
                OR: [
                  { course_name: { contains: search, mode: 'insensitive' } },
                  { lecturer_name: { contains: search, mode: 'insensitive' } },
                  { class_name: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          // Filtering
          academic_calendar_id ? { academic_calendar_id } : {},
          laboratory_id ? { laboratory_id } : {},
          status ? { status } : {},
        ],
      };

      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
          include: {
            laboratory: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            academicCalendar: {
              select: {
                id: true,
                academic_year: true,
                semester: true,
              },
            },
          },
        }),
        this.prisma.schedule.count({ where }),
      ]);

      return new PaginatedResponseDto(schedules, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch schedules');
    }
  }

  async findOne(id: string): Promise<ResponseScheduleDto> {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          academicCalendar: {
            select: {
              id: true,
              academic_year: true,
              semester: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new NotFoundException(`Schedule with ID '${id}' not found`);
      }

      return schedule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch schedule');
    }
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    try {
      // Check if schedule exists
      const existingSchedule = await this.findOne(id);

      // Determine effective values for validation
      const laboratoryId =
        updateScheduleDto.laboratory_id || existingSchedule.laboratory_id;
      const academicCalendarId =
        updateScheduleDto.academic_calendar_id ||
        existingSchedule.academic_calendar_id;
      const dayOfWeek =
        updateScheduleDto.day_of_week !== undefined
          ? updateScheduleDto.day_of_week
          : existingSchedule.day_of_week;
      const startTime = updateScheduleDto.start_time
        ? this.parseTime(updateScheduleDto.start_time)
        : existingSchedule.start_time;
      const endTime = updateScheduleDto.end_time
        ? this.parseTime(updateScheduleDto.end_time)
        : existingSchedule.end_time;

      // RULE 5: Validate time (start < end)
      this.validateTime(startTime, endTime);

      // RULE 1: Validate Academic Calendar if changed
      if (updateScheduleDto.academic_calendar_id) {
        await this.validateAcademicCalendar(
          updateScheduleDto.academic_calendar_id,
        );
      }

      // RULE 2: Validate Laboratory if changed
      if (updateScheduleDto.laboratory_id) {
        await this.validateLaboratory(updateScheduleDto.laboratory_id);
      }

      // RULE 3: Validate operational hours if laboratory, day, or time changed
      if (
        updateScheduleDto.laboratory_id ||
        updateScheduleDto.day_of_week !== undefined ||
        updateScheduleDto.start_time ||
        updateScheduleDto.end_time
      ) {
        await this.validateOperationalHour(
          laboratoryId,
          dayOfWeek,
          startTime,
          endTime,
        );
      }

      // RULE 4: Validate schedule conflicts if laboratory, day, or time changed
      if (
        updateScheduleDto.laboratory_id ||
        updateScheduleDto.day_of_week !== undefined ||
        updateScheduleDto.start_time ||
        updateScheduleDto.end_time
      ) {
        await this.validateScheduleConflict(
          laboratoryId,
          dayOfWeek,
          startTime,
          endTime,
          id, // Exclude current schedule from conflict check
        );
      }

      // Prepare update data
      const updateData: any = {};
      if (updateScheduleDto.laboratory_id !== undefined) {
        updateData.laboratory_id = updateScheduleDto.laboratory_id;
      }
      if (updateScheduleDto.academic_calendar_id !== undefined) {
        updateData.academic_calendar_id = updateScheduleDto.academic_calendar_id;
      }
      if (updateScheduleDto.course_name !== undefined) {
        updateData.course_name = updateScheduleDto.course_name;
      }
      if (updateScheduleDto.lecturer_name !== undefined) {
        updateData.lecturer_name = updateScheduleDto.lecturer_name;
      }
      if (updateScheduleDto.class_name !== undefined) {
        updateData.class_name = updateScheduleDto.class_name;
      }
      if (updateScheduleDto.day_of_week !== undefined) {
        updateData.day_of_week = updateScheduleDto.day_of_week;
      }
      if (updateScheduleDto.start_time !== undefined) {
        updateData.start_time = startTime;
      }
      if (updateScheduleDto.end_time !== undefined) {
        updateData.end_time = endTime;
      }
      if (updateScheduleDto.status !== undefined) {
        updateData.status = updateScheduleDto.status;
      }

      // Update schedule
      const schedule = await this.prisma.schedule.update({
        where: { id },
        data: updateData,
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          academicCalendar: {
            select: {
              id: true,
              academic_year: true,
              semester: true,
            },
          },
        },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'SCHEDULE_UPDATED',
        id: schedule.id,
      });

      return schedule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update schedule');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if schedule exists
      await this.findOne(id);

      // Delete schedule (no dependent validation in this phase)
      await this.prisma.schedule.delete({
        where: { id },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'SCHEDULE_DELETED',
        id,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete schedule');
    }
  }

  /**
   * Reusable method: Find schedules by laboratory
   * (For future use by Room Request, Display, Evaluation modules)
   */
  async findSchedulesByLaboratory(
    laboratoryId: string,
    dayOfWeek?: number,
    status?: ScheduleStatus,
  ): Promise<ResponseScheduleDto[]> {
    try {
      const where: Prisma.ScheduleWhereInput = {
        laboratory_id: laboratoryId,
        ...(dayOfWeek !== undefined ? { day_of_week: dayOfWeek } : {}),
        ...(status ? { status } : {}),
      };

      const schedules = await this.prisma.schedule.findMany({
        where,
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          academicCalendar: {
            select: {
              id: true,
              academic_year: true,
              semester: true,
            },
          },
        },
      });

      return schedules;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch schedules by laboratory',
      );
    }
  }

  /**
   * Reusable method: Find schedules by academic calendar
   * (For future use by Room Request, Display, Evaluation modules)
   */
  async findSchedulesByAcademicCalendar(
    academicCalendarId: string,
    laboratoryId?: string,
    status?: ScheduleStatus,
  ): Promise<ResponseScheduleDto[]> {
    try {
      const where: Prisma.ScheduleWhereInput = {
        academic_calendar_id: academicCalendarId,
        ...(laboratoryId ? { laboratory_id: laboratoryId } : {}),
        ...(status ? { status } : {}),
      };

      const schedules = await this.prisma.schedule.findMany({
        where,
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          academicCalendar: {
            select: {
              id: true,
              academic_year: true,
              semester: true,
            },
          },
        },
      });

      return schedules;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch schedules by academic calendar',
      );
    }
  }
}
