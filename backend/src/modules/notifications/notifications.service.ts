import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { QueryNotificationDto } from './dto/query-notification.dto.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        user_id: dto.user_id,
        title: dto.title,
        message: dto.message,
        category: dto.category,
        link_url: dto.link_url,
      },
    });
  }

  /**
   * Helper to broadcast a notification to all ADMIN and LABORAN users
   */
  async notifyAdminsAndLaboran(
    title: string,
    message: string,
    category: string,
    link_url?: string,
  ) {
    const adminAndLaboranUsers = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: {
          code: {
            in: ['ADMIN', 'LABORAN'],
          },
        },
      },
      select: { id: true, role: { select: { code: true } } },
    });

    const notificationsData = adminAndLaboranUsers.map((u) => {
      let resolvedLink = link_url;
      if (link_url && link_url.startsWith('/laboran/') && u.role?.code === 'ADMIN') {
        resolvedLink = link_url.replace('/laboran/', '/admin/');
      } else if (link_url && link_url.startsWith('/admin/') && u.role?.code === 'LABORAN') {
        resolvedLink = link_url.replace('/admin/', '/laboran/');
      }
      return {
        user_id: u.id,
        title,
        message,
        category,
        link_url: resolvedLink,
      };
    });

    if (notificationsData.length > 0) {
      await this.prisma.notification.createMany({
        data: notificationsData,
      });
    }
  }

  async findAll(userId: string, query: QueryNotificationDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: userId,
    };

    if (query.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (
      query.unread_only === true ||
      query.unread_only === 'true' ||
      query.unread_only === '1'
    ) {
      where.is_read = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });

    return { count };
  }
}
