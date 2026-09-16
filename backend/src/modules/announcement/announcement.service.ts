import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto.js';
import { ResponseAnnouncementDto } from './dto/response-announcement.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { Prisma } from '@prisma/client';
import { EventsGateway } from '../display/events.gateway.js';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<ResponseAnnouncementDto> {
    try {
      const startAt = new Date(createAnnouncementDto.start_at);
      const endAt = new Date(createAnnouncementDto.end_at);

      // Validate end date is after start date
      if (endAt <= startAt) {
        throw new BadRequestException(
          'End date must be greater than start date',
        );
      }

      // Create announcement
      const announcement = await this.prisma.announcement.create({
        data: {
          title: createAnnouncementDto.title,
          content: createAnnouncementDto.content,
          start_at: startAt,
          end_at: endAt,
          is_active: createAnnouncementDto.is_active,
        },
      });

      // Dispatch notification to Admins and Laborans
      try {
        await this.notificationsService.notifyAdminsAndLaboran(
          'New Announcement Broadcast',
          announcement.title,
          'announcements',
          '/laboran/announcements',
        );
      } catch (notifErr) {
        console.warn('Failed to dispatch announcement notification:', notifErr);
      }

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ANNOUNCEMENT_CREATED',
        id: announcement.id,
      });

      return announcement;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create announcement');
    }
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
    is_active?: boolean,
  ): Promise<PaginatedResponseDto<ResponseAnnouncementDto>> {
    try {
      const skip = (page - 1) * limit;

      const conditions: Prisma.AnnouncementWhereInput[] = [];

      if (search) {
        conditions.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        });
      }

      if (is_active !== undefined) {
        conditions.push({ is_active });
      }

      const where: Prisma.AnnouncementWhereInput =
        conditions.length > 0 ? { AND: conditions } : {};

      const [announcements, total] = await Promise.all([
        this.prisma.announcement.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.announcement.count({ where }),
      ]);

      return new PaginatedResponseDto(announcements, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch announcements');
    }
  }

  async findOne(id: string): Promise<ResponseAnnouncementDto> {
    try {
      const announcement = await this.prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new NotFoundException(
          `Announcement with ID '${id}' not found`,
        );
      }

      return announcement;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch announcement');
    }
  }

  async update(
    id: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<ResponseAnnouncementDto> {
    try {
      // Check if announcement exists
      const existingAnnouncement = await this.findOne(id);

      // Validate dates if both are provided or if updating one
      const startAt = updateAnnouncementDto.start_at
        ? new Date(updateAnnouncementDto.start_at)
        : existingAnnouncement.start_at;
      const endAt = updateAnnouncementDto.end_at
        ? new Date(updateAnnouncementDto.end_at)
        : existingAnnouncement.end_at;

      if (endAt <= startAt) {
        throw new BadRequestException(
          'End date must be greater than start date',
        );
      }

      // Prepare update data
      const updateData: any = {};
      if (updateAnnouncementDto.title !== undefined) {
        updateData.title = updateAnnouncementDto.title;
      }
      if (updateAnnouncementDto.content !== undefined) {
        updateData.content = updateAnnouncementDto.content;
      }
      if (updateAnnouncementDto.start_at !== undefined) {
        updateData.start_at = startAt;
      }
      if (updateAnnouncementDto.end_at !== undefined) {
        updateData.end_at = endAt;
      }
      if (updateAnnouncementDto.is_active !== undefined) {
        updateData.is_active = updateAnnouncementDto.is_active;
      }

      // Update announcement
      const announcement = await this.prisma.announcement.update({
        where: { id },
        data: updateData,
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ANNOUNCEMENT_UPDATED',
        id: announcement.id,
      });

      return announcement;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update announcement');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Check if announcement exists
      await this.findOne(id);

      // No dependent tables, proceed with deletion
      await this.prisma.announcement.delete({
        where: { id },
      });

      this.eventsGateway.emitDisplayUpdate('display:sync', {
        type: 'ANNOUNCEMENT_DELETED',
        id,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete announcement');
    }
  }

  /**
   * Get active announcements for display purposes.
   * Returns announcements where:
   * - is_active = true
   * - current date is between start_at and end_at
   * 
   * This method is reusable and will be used by the Display Module.
   */
  async findActiveAnnouncements(): Promise<ResponseAnnouncementDto[]> {
    try {
      const currentDate = new Date();

      const announcements = await this.prisma.announcement.findMany({
        where: {
          is_active: true,
          start_at: {
            lte: currentDate,
          },
          end_at: {
            gte: currentDate,
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return announcements;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch active announcements',
      );
    }
  }
}
