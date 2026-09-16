import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAcademicCalendarDto } from './dto/create-academic-calendar.dto.js';
import { UpdateAcademicCalendarDto } from './dto/update-academic-calendar.dto.js';
import { ResponseAcademicCalendarDto } from './dto/response-academic-calendar.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma, CalendarStatus } from '@prisma/client';

@Injectable()
export class AcademicCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAcademicCalendarDto: CreateAcademicCalendarDto,
  ): Promise<ResponseAcademicCalendarDto> {
    try {
      const startDate = new Date(createAcademicCalendarDto.start_date);
      const endDate = new Date(createAcademicCalendarDto.end_date);

      // Validate end date is after start date
      if (endDate <= startDate) {
        throw new BadRequestException(
          'End date must be later than start date',
        );
      }

      // Check if academic_year + semester combination already exists
      const existingCalendar = await this.prisma.academicCalendar.findFirst({
        where: {
          academic_year: createAcademicCalendarDto.academic_year,
          semester: createAcademicCalendarDto.semester,
        },
      });

      if (existingCalendar) {
        throw new ConflictException(
          `Academic calendar for ${createAcademicCalendarDto.academic_year} - ${createAcademicCalendarDto.semester} already exists`,
        );
      }

      // If status is ACTIVE, deactivate all other calendars in a transaction
      if (createAcademicCalendarDto.status === CalendarStatus.ACTIVE) {
        return await this.prisma.$transaction(async (tx) => {
          // Deactivate all existing active calendars
          await tx.academicCalendar.updateMany({
            where: { status: CalendarStatus.ACTIVE },
            data: { status: CalendarStatus.INACTIVE },
          });

          // Create the new calendar
          const calendar = await tx.academicCalendar.create({
            data: {
              academic_year: createAcademicCalendarDto.academic_year,
              semester: createAcademicCalendarDto.semester,
              start_date: startDate,
              end_date: endDate,
              status: createAcademicCalendarDto.status,
            },
          });

          return calendar;
        });
      }

      // Create without transaction if status is INACTIVE
      const calendar = await this.prisma.academicCalendar.create({
        data: {
          academic_year: createAcademicCalendarDto.academic_year,
          semester: createAcademicCalendarDto.semester,
          start_date: startDate,
          end_date: endDate,
          status: createAcademicCalendarDto.status,
        },
      });

      return calendar;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create academic calendar',
      );
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponseDto<ResponseAcademicCalendarDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.AcademicCalendarWhereInput = search
        ? {
            OR: [
              { academic_year: { contains: search, mode: 'insensitive' } },
              { semester: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [calendars, total] = await Promise.all([
        this.prisma.academicCalendar.findMany({
          where,
          skip,
          take: limit,
          orderBy: { academic_year: 'desc' },
        }),
        this.prisma.academicCalendar.count({ where }),
      ]);

      return new PaginatedResponseDto(calendars, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch academic calendars',
      );
    }
  }

  async findOne(id: string): Promise<ResponseAcademicCalendarDto> {
    try {
      const calendar = await this.prisma.academicCalendar.findUnique({
        where: { id },
      });

      if (!calendar) {
        throw new NotFoundException(
          `Academic calendar with ID '${id}' not found`,
        );
      }

      return calendar;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch academic calendar',
      );
    }
  }

  async update(
    id: string,
    updateAcademicCalendarDto: UpdateAcademicCalendarDto,
  ): Promise<ResponseAcademicCalendarDto> {
    try {
      // Check if calendar exists
      const existingCalendar = await this.findOne(id);

      // Validate dates if both are provided or if updating one
      const startDate = updateAcademicCalendarDto.start_date
        ? new Date(updateAcademicCalendarDto.start_date)
        : existingCalendar.start_date;
      const endDate = updateAcademicCalendarDto.end_date
        ? new Date(updateAcademicCalendarDto.end_date)
        : existingCalendar.end_date;

      if (endDate <= startDate) {
        throw new BadRequestException(
          'End date must be later than start date',
        );
      }

      // Check if academic_year + semester combination conflicts
      if (
        updateAcademicCalendarDto.academic_year ||
        updateAcademicCalendarDto.semester
      ) {
        const academic_year =
          updateAcademicCalendarDto.academic_year ||
          existingCalendar.academic_year;
        const semester =
          updateAcademicCalendarDto.semester || existingCalendar.semester;

        const conflictingCalendar =
          await this.prisma.academicCalendar.findFirst({
            where: {
              academic_year,
              semester,
              NOT: { id },
            },
          });

        if (conflictingCalendar) {
          throw new ConflictException(
            `Academic calendar for ${academic_year} - ${semester} already exists`,
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (updateAcademicCalendarDto.academic_year !== undefined) {
        updateData.academic_year = updateAcademicCalendarDto.academic_year;
      }
      if (updateAcademicCalendarDto.semester !== undefined) {
        updateData.semester = updateAcademicCalendarDto.semester;
      }
      if (updateAcademicCalendarDto.start_date !== undefined) {
        updateData.start_date = startDate;
      }
      if (updateAcademicCalendarDto.end_date !== undefined) {
        updateData.end_date = endDate;
      }
      if (updateAcademicCalendarDto.status !== undefined) {
        updateData.status = updateAcademicCalendarDto.status;
      }

      // If status is being changed to ACTIVE, use transaction
      if (updateAcademicCalendarDto.status === CalendarStatus.ACTIVE) {
        return await this.prisma.$transaction(async (tx) => {
          // Deactivate all other active calendars
          await tx.academicCalendar.updateMany({
            where: {
              status: CalendarStatus.ACTIVE,
              NOT: { id },
            },
            data: { status: CalendarStatus.INACTIVE },
          });

          // Update the target calendar
          const calendar = await tx.academicCalendar.update({
            where: { id },
            data: updateData,
          });

          return calendar;
        });
      }

      // Update without transaction if not activating
      const calendar = await this.prisma.academicCalendar.update({
        where: { id },
        data: updateData,
      });

      return calendar;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update academic calendar',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if calendar exists
      await this.findOne(id);

      // Check if calendar is referenced in Schedule
      const scheduleCount = await this.prisma.schedule.count({
        where: { academic_calendar_id: id },
      });

      if (scheduleCount > 0) {
        throw new ConflictException(
          `Cannot delete academic calendar. It is referenced in ${scheduleCount} schedule(s)`,
        );
      }

      await this.prisma.academicCalendar.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete academic calendar',
      );
    }
  }
}
