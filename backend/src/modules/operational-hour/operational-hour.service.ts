import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateOperationalHourDto } from './dto/create-operational-hour.dto.js';
import { UpdateOperationalHourDto } from './dto/update-operational-hour.dto.js';
import { ResponseOperationalHourDto } from './dto/response-operational-hour.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperationalHourService {
  constructor(private readonly prisma: PrismaService) {}

  private parseTime(timeString: string): Date {
    // Parse time in HH:mm:ss format as UTC epoch date
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

  async create(
    createOperationalHourDto: CreateOperationalHourDto,
  ): Promise<ResponseOperationalHourDto> {
    try {
      // Validate laboratory exists
      const laboratory = await this.prisma.laboratory.findUnique({
        where: { id: createOperationalHourDto.laboratory_id },
      });

      if (!laboratory) {
        throw new NotFoundException(
          `Laboratory with ID '${createOperationalHourDto.laboratory_id}' not found`,
        );
      }

      // Parse and validate times
      const openTime = this.parseTime(createOperationalHourDto.open_time);
      const closeTime = this.parseTime(createOperationalHourDto.close_time);

      // RULE: Allow midnight-ending operational hours (close_time = 00:00:00)
      // Valid: 08:00 → 17:00 (normal), 15:00 → 00:00 (midnight-ending)
      // Invalid: 17:00 → 08:00 (overnight), 00:00 → 00:00 (zero duration)
      const closeHours = closeTime.getUTCHours();
      const closeMinutes = closeTime.getUTCMinutes();
      const closeSeconds = closeTime.getUTCSeconds();
      const isMidnight = closeHours === 0 && closeMinutes === 0 && closeSeconds === 0;

      if (isMidnight) {
        // Midnight-ending is allowed (e.g., 15:00 → 00:00)
        // But opening at midnight is not allowed (e.g., 00:00 → 00:00)
        const openHours = openTime.getUTCHours();
        const openMinutes = openTime.getUTCMinutes();
        const openSeconds = openTime.getUTCSeconds();
        if (openHours === 0 && openMinutes === 0 && openSeconds === 0) {
          throw new BadRequestException(
            'Close time must be later than open time. Cannot have 00:00 → 00:00.',
          );
        }
        // Valid midnight-ending interval (e.g., 15:00 → 00:00)
      } else {
        // Normal same-day validation
        if (this.compareTime(closeTime, openTime) <= 0) {
          throw new BadRequestException(
            'Close time must be later than open time',
          );
        }
      }

      // Check if laboratory_id + day_of_week combination already exists
      const existingOperationalHour =
        await this.prisma.operationalHour.findFirst({
          where: {
            laboratory_id: createOperationalHourDto.laboratory_id,
            day_of_week: createOperationalHourDto.day_of_week,
          },
        });

      if (existingOperationalHour) {
        throw new ConflictException(
          `Operational hour for laboratory '${laboratory.name}' on day ${createOperationalHourDto.day_of_week} already exists`,
        );
      }

      // Create operational hour
      const operationalHour = await this.prisma.operationalHour.create({
        data: {
          laboratory_id: createOperationalHourDto.laboratory_id,
          day_of_week: createOperationalHourDto.day_of_week,
          open_time: openTime,
          close_time: closeTime,
        },
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return operationalHour;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create operational hour',
      );
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponseDto<ResponseOperationalHourDto>> {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.OperationalHourWhereInput = search
        ? {
            OR: [
              {
                laboratory: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                laboratory: {
                  code: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {};

      const [operationalHours, total] = await Promise.all([
        this.prisma.operationalHour.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ laboratory: { name: 'asc' } }, { day_of_week: 'asc' }],
          include: {
            laboratory: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.operationalHour.count({ where }),
      ]);

      return new PaginatedResponseDto(operationalHours, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch operational hours',
      );
    }
  }

  async findOne(id: string): Promise<ResponseOperationalHourDto> {
    try {
      const operationalHour = await this.prisma.operationalHour.findUnique({
        where: { id },
        include: {
          laboratory: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      if (!operationalHour) {
        throw new NotFoundException(
          `Operational hour with ID '${id}' not found`,
        );
      }

      return operationalHour;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch operational hour',
      );
    }
  }

  async update(
    id: string,
    updateOperationalHourDto: UpdateOperationalHourDto,
  ): Promise<ResponseOperationalHourDto> {
    try {
      // Check if operational hour exists
      const existingOperationalHour = await this.findOne(id);

      // Validate laboratory exists if laboratory_id is being updated
      if (updateOperationalHourDto.laboratory_id) {
        const laboratory = await this.prisma.laboratory.findUnique({
          where: { id: updateOperationalHourDto.laboratory_id },
        });

        if (!laboratory) {
          throw new NotFoundException(
            `Laboratory with ID '${updateOperationalHourDto.laboratory_id}' not found`,
          );
        }
      }

      // Validate times
      const openTime = updateOperationalHourDto.open_time
        ? this.parseTime(updateOperationalHourDto.open_time)
        : existingOperationalHour.open_time;
      const closeTime = updateOperationalHourDto.close_time
        ? this.parseTime(updateOperationalHourDto.close_time)
        : existingOperationalHour.close_time;

      // RULE: Allow midnight-ending operational hours (close_time = 00:00:00)
      // Valid: 08:00 → 17:00 (normal), 15:00 → 00:00 (midnight-ending)
      // Invalid: 17:00 → 08:00 (overnight), 00:00 → 00:00 (zero duration)
      const closeHours = closeTime.getUTCHours();
      const closeMinutes = closeTime.getUTCMinutes();
      const closeSeconds = closeTime.getUTCSeconds();
      const isMidnight = closeHours === 0 && closeMinutes === 0 && closeSeconds === 0;

      if (isMidnight) {
        // Midnight-ending is allowed (e.g., 15:00 → 00:00)
        // But opening at midnight is not allowed (e.g., 00:00 → 00:00)
        const openHours = openTime.getUTCHours();
        const openMinutes = openTime.getUTCMinutes();
        const openSeconds = openTime.getUTCSeconds();
        if (openHours === 0 && openMinutes === 0 && openSeconds === 0) {
          throw new BadRequestException(
            'Close time must be later than open time. Cannot have 00:00 → 00:00.',
          );
        }
        // Valid midnight-ending interval (e.g., 15:00 → 00:00)
      } else {
        // Normal same-day validation
        if (this.compareTime(closeTime, openTime) <= 0) {
          throw new BadRequestException(
            'Close time must be later than open time',
          );
        }
      }

      // Check if laboratory_id + day_of_week combination conflicts
      if (
        updateOperationalHourDto.laboratory_id !== undefined ||
        updateOperationalHourDto.day_of_week !== undefined
      ) {
        const laboratory_id =
          updateOperationalHourDto.laboratory_id ||
          existingOperationalHour.laboratory_id;
        const day_of_week =
          updateOperationalHourDto.day_of_week !== undefined
            ? updateOperationalHourDto.day_of_week
            : existingOperationalHour.day_of_week;

        const conflictingOperationalHour =
          await this.prisma.operationalHour.findFirst({
            where: {
              laboratory_id,
              day_of_week,
              NOT: { id },
            },
          });

        if (conflictingOperationalHour) {
          throw new ConflictException(
            `Operational hour for this laboratory on day ${day_of_week} already exists`,
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (updateOperationalHourDto.laboratory_id !== undefined) {
        updateData.laboratory_id = updateOperationalHourDto.laboratory_id;
      }
      if (updateOperationalHourDto.day_of_week !== undefined) {
        updateData.day_of_week = updateOperationalHourDto.day_of_week;
      }
      if (updateOperationalHourDto.open_time !== undefined) {
        updateData.open_time = openTime;
      }
      if (updateOperationalHourDto.close_time !== undefined) {
        updateData.close_time = closeTime;
      }

      // Update operational hour
      const operationalHour = await this.prisma.operationalHour.update({
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
        },
      });

      return operationalHour;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update operational hour',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if operational hour exists
      await this.findOne(id);

      // No direct relations in schema that reference OperationalHour
      // Proceed with deletion
      await this.prisma.operationalHour.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete operational hour',
      );
    }
  }
}
